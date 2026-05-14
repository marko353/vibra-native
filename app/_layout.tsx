import notifee, { EventType } from "@notifee/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApps, initializeApp } from "@react-native-firebase/app";
import { getMessaging } from "@react-native-firebase/messaging";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useMemo, useState, useRef } from "react";
import { ActivityIndicator, AppState, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthProvider, useAuthContext } from "../context/AuthContext";
import { FilterModalProvider, useFilterModal } from "../context/FilterModalContext";
import { ProfileProvider } from "../context/ProfileContext";
import { SocketProvider } from "../context/SocketContext";
import LikeFilterModal from "../components/likes/LikeFilterModal";
import { MatchToast } from "../components/MatchToast";
import { useMatchToast } from "../hooks/useMatchToast";
import { usePushNotifications } from "../hooks/usePushNotifications";
import AnimatedSplash from "./AnimatedSplash";
import { firebaseConfig } from "../firebaseConfig";

declare const global: typeof globalThis;

if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const queryClient = new QueryClient();

function AppContent() {
  const { user, loading, token } = useAuthContext();
  const router = useRouter();
  const segments = useSegments();
  const { toastData, visible, showMatchToast, hideMatchToast } = useMatchToast();
  const appState = useRef(AppState.currentState);

  usePushNotifications(token, showMatchToast);

  const inAuthFlow = useMemo(() => {
    const rootSegment = segments[0];
    return (
      rootSegment === "(auth)" ||
      rootSegment === "signup" ||
      rootSegment === "forgot-password"
    );
  }, [segments]);

  const goToChat = (data: any) => {
    if (!data?.chatId) {
      console.warn("⚠️ [goToChat] Nema chatId, preskačem navigaciju.");
      return false;
    }
    console.log("🚀 [goToChat] Navigiram na chat:", data.chatId, "| userName:", data.userName);
    router.push({
      pathname: "/chat-stack/[chatId]",
      params: {
        chatId: String(data.chatId),
        userName: String(data.userName || "Korisnik"),
        userAvatar: String(data.userAvatar || ""),
        receiverId: String(data.userId || data.receiverId || ""),
      },
    });
    return true;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Auth + navigacija logika
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading) {
      console.log("⏳ [handleNavigation] Čekam auth loading...");
      return;
    }

    const handleNavigation = async () => {
      console.log("🔍 [handleNavigation] Pokrenut. user:", !!user, "| inAuthFlow:", inAuthFlow);

      if (!user && !inAuthFlow) {
        console.log("🔒 [handleNavigation] Nema korisnika, navigiram na login.");
        router.replace("/(auth)/login");
        return;
      }

      if (user) {
        // ── 1. Proveri pendingNotificationData (background klik) ──
        try {
          const pendingRaw = await AsyncStorage.getItem("pendingNotificationData");
          console.log("🔍 [handleNavigation] pendingNotificationData:", pendingRaw);
          if (pendingRaw) {
            const data = JSON.parse(pendingRaw);
            await AsyncStorage.removeItem("pendingNotificationData");
            if (data?.chatId) {
              console.log("✅ [handleNavigation] Pronašao pendingNotificationData, navigiram na chat:", data.chatId);
              if (inAuthFlow) router.replace("/(tabs)/home");
              setTimeout(() => goToChat(data), 500);
              return;
            }
          }
        } catch (e) {
          console.error("❌ [handleNavigation] Greška pri čitanju pendingNotificationData:", e);
        }

        // ── 2. Proveri lastNotificationData (quit klik) ──
        try {
          const lastRaw = await AsyncStorage.getItem("lastNotificationData");
          console.log("🔍 [handleNavigation] lastNotificationData:", lastRaw);
          if (lastRaw) {
            const parsed = JSON.parse(lastRaw);
            const age = Date.now() - parsed.savedAt;
            console.log("🕐 [handleNavigation] lastNotificationData starost:", age, "ms");

            if (age < 30000 && parsed?.chatId) {
              console.log("✅ [handleNavigation] Pronašao svež lastNotificationData, navigiram na chat:", parsed.chatId);
              await AsyncStorage.removeItem("lastNotificationData");
              if (inAuthFlow) router.replace("/(tabs)/home");
              setTimeout(() => goToChat(parsed), 500);
              return;
            } else {
              console.log("⏰ [handleNavigation] lastNotificationData je star ili nema chatId, ignorišem. age:", age, "ms");
            }
          } else {
            console.log("ℹ️ [handleNavigation] Nema lastNotificationData u AsyncStorage.");
          }
        } catch (e) {
          console.error("❌ [handleNavigation] Greška pri čitanju lastNotificationData:", e);
        }

        // ── 3. Normalna navigacija ──
        if (inAuthFlow) {
          console.log("🏠 [handleNavigation] Korisnik je ulogovan, navigiram na home.");
          router.replace("/(tabs)/home");
        } else {
          console.log("✅ [handleNavigation] Korisnik je ulogovan i nije u auth flowu, ostajemo.");
        }
      }
    };

    handleNavigation();
  }, [user, loading, inAuthFlow]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Background → foreground AppState change
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const subscription = AppState.addEventListener("change", async (nextState) => {
      const wasBackground = appState.current === "background";
      appState.current = nextState;

      console.log(`📱 [AppState] Promena: ${wasBackground ? "background" : "foreground"} → ${nextState}`);

      if (wasBackground && nextState === "active") {
        console.log("🔄 [AppState] App se vratila iz backgrounda, proveravam pending...");
        try {
          const raw = await AsyncStorage.getItem("pendingNotificationData");
          console.log("🔍 [AppState] pendingNotificationData:", raw);
          if (raw) {
            const data = JSON.parse(raw);
            await AsyncStorage.removeItem("pendingNotificationData");
            console.log("✅ [AppState] Navigiram na chat:", data.chatId);
            goToChat(data);
          } else {
            console.log("ℹ️ [AppState] Nema pendingNotificationData.");
          }
        } catch (e) {
          console.error("❌ [AppState] Greška:", e);
        }
      }
    });

    return () => subscription.remove();
  }, [user]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FF6A00" />
      </View>
    );
  }

  return (
    <>
      <Slot />
      {toastData && (
        <MatchToast
          visible={visible}
          matchedUserName={toastData.matchedUserName}
          matchedUserAvatar={toastData.matchedUserAvatar}
          chatId={toastData.chatId}
          onPress={(chatId: string) => {
            router.push({
              pathname: "/chat-stack/[chatId]",
              params: {
                chatId,
                userName: toastData.matchedUserName,
                userAvatar: toastData.matchedUserAvatar || "",
                receiverId: toastData.userId,
              },
            });
          }}
          onHide={hideMatchToast}
        />
      )}
    </>
  );
}

export default function RootLayout() {
  const [isSplashAnimationFinished, setSplashAnimationFinished] = useState(false);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SocketProvider>
            <ProfileProvider>
              <FilterModalProvider>
                <GlobalFilterModal />
                {isSplashAnimationFinished ? (
                  <AppContent />
                ) : (
                  <AnimatedSplash onFinish={() => setSplashAnimationFinished(true)} />
                )}
              </FilterModalProvider>
            </ProfileProvider>
          </SocketProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

function GlobalFilterModal() {
  const { isVisible, hideModal, setFilterValues, filterValues } = useFilterModal();

  return (
    <LikeFilterModal
      visible={isVisible}
      onClose={hideModal}
      onApply={(newFilters: any) => {
        setFilterValues(newFilters);
        hideModal();
      }}
      initialFilters={filterValues}
    />
  );
}
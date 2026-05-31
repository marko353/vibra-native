import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApps, initializeApp } from "@react-native-firebase/app";
import notifee from "@notifee/react-native"; // 💡 Dodat notifee za resetovanje bedža
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, AppState, Linking, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import LikeFilterModal from "../components/likes/LikeFilterModal";
import { MatchToast } from "../components/MatchToast";
import { AuthProvider, useAuthContext } from "../context/AuthContext";
import {
  FilterModalProvider,
  useFilterModal,
} from "../context/FilterModalContext";
import { ProfileProvider } from "../context/ProfileContext";
import { SocketProvider } from "../context/SocketContext";
import { firebaseConfig } from "../firebaseConfig";
import { useMatchToast } from "../hooks/useMatchToast";
import { usePushNotifications } from "../hooks/usePushNotifications";
import AnimatedSplash from "./AnimatedSplash";

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
  const isNavigatingToReset = useRef(false);
  const [isResolvingInitialUrl, setIsResolvingInitialUrl] = useState(true);

  usePushNotifications(token, showMatchToast);

  // ─── 💡 LOGIKA ZA RESET BEDŽA KADA SE APLIKACIJA OTRE ILI PROMENI EKRAN ───
  useEffect(() => {
    if (user) {
      notifee.setBadgeCount(0)
        .then(() => console.log("🧼 [Notifee] Crveni bedž resetovan na 0."))
        .catch(err => console.error("❌ [Notifee] Greška pri resetu bedža:", err));
    }
  }, [user, segments]); // Okida se na promenu tabova / navigaciju

  // ─── Deep link handler ────────────────────────────────────────
  useEffect(() => {
    const handleUrl = (url: string | null) => {
      if (!url) return;
      if (url.includes("expo-development-client")) return;

      console.log("🔗 [Linking] URL primljen:", url);

      if (url.includes("reset-password")) {
        try {
          const parsed = new URL(url);
          const userId = parsed.searchParams.get("userId");
          const resetToken = parsed.searchParams.get("token");
          console.log(
            "🔑 [Linking] Navigiram na reset-password, userId:",
            userId,
          );
          isNavigatingToReset.current = true;
          router.push({
            pathname: "/(auth)/reset-password",
            params: { userId, token: resetToken },
          });
        } catch (e) {
          console.error("❌ [Linking] Greška parsiranja URL:", e);
        }
      }
    };

    Linking.getInitialURL().then((url) => {
      console.log("🔗 [Linking] Initial URL:", url);
      handleUrl(url);
      setIsResolvingInitialUrl(false);
    }).catch((error) => {
      console.error("❌ [Linking] Greška pri čitanju initial URL:", error);
      setIsResolvingInitialUrl(false);
    });

    const subscription = Linking.addEventListener("url", ({ url }) =>
      handleUrl(url),
    );

    return () => subscription.remove();
  }, []);

  const inAuthFlow = useMemo(() => segments[0] === "(auth)", [segments]);
  const inSignupFlow = useMemo(() => segments[0] === "signup", [segments]);
  const isOnResetPassword = useMemo(
    () => segments.includes("reset-password" as never),
    [segments],
  );

  const goToChat = (data: any) => {
    if (!data?.chatId) return false;
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

  // ─── Auth Guard ───────────────────────────────────────────────
  useEffect(() => {
    if (loading) return;
    if (segments.length < 1) return;
    if (isResolvingInitialUrl) return;
    if (isOnResetPassword || isNavigatingToReset.current) return;

    const handleNavigation = async () => {
      if (!user) {
        if (!inAuthFlow && !inSignupFlow) router.replace("/(auth)/login");
        return;
      }

      try {
        const pendingRaw = await AsyncStorage.getItem(
          "pendingNotificationData",
        );
        if (pendingRaw) {
          const data = JSON.parse(pendingRaw);
          await AsyncStorage.removeItem("pendingNotificationData");
          if (data?.chatId) {
            if (inAuthFlow) router.replace("/(tabs)/home");
            setTimeout(() => goToChat(data), 500);
            return;
          }
        }
      } catch (e) {}

      try {
        const lastRaw = await AsyncStorage.getItem("lastNotificationData");
        if (lastRaw) {
          const parsed = JSON.parse(lastRaw);
          const age = Date.now() - parsed.savedAt;
          if (age < 30000 && parsed?.chatId) {
            await AsyncStorage.removeItem("lastNotificationData");
            if (inAuthFlow) router.replace("/(tabs)/home");
            setTimeout(() => goToChat(parsed), 500);
            return;
          }
        }
      } catch (e) {}

      if (inAuthFlow) router.replace("/(tabs)/home");
    };

    handleNavigation();
  }, [user, loading, inAuthFlow, inSignupFlow, isOnResetPassword, isResolvingInitialUrl]);

  // ─── AppState handler ─────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const subscription = AppState.addEventListener(
      "change",
      async (nextState) => {
        const wasBackground = appState.current === "background";
        appState.current = nextState;
        
        if (wasBackground && nextState === "active") {
          // 💡 Kada se aplikacija vrati iz pozadine u aktivno stanje, obriši bedž
          try {
            await notifee.setBadgeCount(0);
          } catch (err) {}

          try {
            const raw = await AsyncStorage.getItem("pendingNotificationData");
            if (raw) {
              const data = JSON.parse(raw);
              await AsyncStorage.removeItem("pendingNotificationData");
              goToChat(data);
            }
          } catch (e) {}
        }
      },
    );
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
  const [isSplashAnimationFinished, setSplashAnimationFinished] =
    useState(false);

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
                  <AnimatedSplash
                    onFinish={() => setSplashAnimationFinished(true)}
                  />
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
  const { isVisible, hideModal, setFilterValues, filterValues } =
    useFilterModal();
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
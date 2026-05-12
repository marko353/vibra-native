import notifee, { EventType } from "@notifee/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApps, initializeApp } from "@react-native-firebase/app";
import {
  getMessaging,
  getInitialNotification,
} from "@react-native-firebase/messaging";
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

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    const data = detail.notification?.data;
    if (data?.chatId) {
      await AsyncStorage.setItem("pendingNotificationData", JSON.stringify(data));
    }
  }
});

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

  // ─────────────────────────────────────────────────────────────────────────────
  // Auth + notifikacija navigacija
  // FIX: Pre nego što idemo na home, proveravamo da li postoji pending
  // notifikacija. Ako postoji — idemo direktno na chat bez prolaska kroz home.
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading) return;

    const handleNavigation = async () => {
      if (!user && !inAuthFlow) {
        router.replace("/(auth)/login");
        return;
      }

      if (user) {
        // Korak 1: FCM quit notifikacija
        try {
          const initialMsg = await getInitialNotification(getMessaging());
          if (initialMsg?.data?.chatId) {
            // Idi direktno na chat — home se nikad ne vidi
            if (inAuthFlow) router.replace("/(tabs)/home");
            setTimeout(() => goToChat(initialMsg.data), inAuthFlow ? 300 : 0);
            return;
          }
        } catch (e) {}

        // Korak 2: Notifee background klik
        try {
          const raw = await AsyncStorage.getItem("pendingNotificationData");
          if (raw) {
            const data = JSON.parse(raw);
            await AsyncStorage.removeItem("pendingNotificationData");
            if (data?.chatId) {
              // Idi direktno na chat — home se nikad ne vidi
              if (inAuthFlow) router.replace("/(tabs)/home");
              setTimeout(() => goToChat(data), inAuthFlow ? 300 : 0);
              return;
            }
          }
        } catch (e) {}

        // Korak 3: Nema notifikacije — normalna navigacija
        if (inAuthFlow) {
          router.replace("/(tabs)/home");
        }
      }
    };

    handleNavigation();
  }, [user, loading, inAuthFlow]);

  // Background → foreground: provjeri AsyncStorage
  useEffect(() => {
    if (!user) return;

    const subscription = AppState.addEventListener("change", async (nextState) => {
      const wasBackground = appState.current === "background";
      appState.current = nextState;

      if (wasBackground && nextState === "active") {
        try {
          const raw = await AsyncStorage.getItem("pendingNotificationData");
          if (raw) {
            const data = JSON.parse(raw);
            await AsyncStorage.removeItem("pendingNotificationData");
            goToChat(data);
          }
        } catch (e) {}
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
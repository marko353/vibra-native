import { getApps, initializeApp } from "@react-native-firebase/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Contexts
import { AuthProvider, useAuthContext } from "../context/AuthContext";
import {
  FilterModalProvider,
  useFilterModal,
} from "../context/FilterModalContext";
import { ProfileProvider } from "../context/ProfileContext";
import { SocketProvider } from "../context/SocketContext";

// Components & Hooks
import LikeFilterModal from "../components/likes/LikeFilterModal";
import { usePushNotifications } from "../hooks/usePushNotifications";
import AnimatedSplash from "./AnimatedSplash";

// Inicijalizacija Firebase-a (samo jednom)
import { firebaseConfig } from "../firebaseConfig";

// FIX: Inicijalizacija mora biti APSOLUTNO prva stvar koja se desi
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const queryClient = new QueryClient();

// --- Glavna Logika za Navigaciju i Push Notifikacije ---
function AppContent() {
  const { user, loading } = useAuthContext();
  const { fcmToken } = usePushNotifications(); // Pozivamo tvoj hook ovde
  const segments = useSegments();
  const router = useRouter();

  const inAuthFlow = useMemo(() => {
    const rootSegment = segments[0];
    return (
      rootSegment === "(auth)" ||
      rootSegment === "signup" ||
      rootSegment === "forgot-password"
    );
  }, [segments]);

  // --- SINHRONIZACIJA TOKENA SA BACKENDOM ---
  useEffect(() => {
    if (user && fcmToken) {
      console.log("[PUSH] Token spreman za slanje:", fcmToken);

      // Ovde ide tvoj API poziv
      // Primer:
      // axios.post('/users/update-fcm-token', { fcmToken })
      //   .then(() => console.log("Token uspešno sačuvan"))
      //   .catch(err => console.error("Greška pri čuvanju tokena", err));
    }
  }, [user, fcmToken]);

  // --- AUTH NAVIGACIJA ---
  useEffect(() => {
    if (loading) return;

    if (!user && !inAuthFlow) {
      router.replace("/(auth)/login");
    } else if (user && inAuthFlow) {
      router.replace("/(tabs)/home");
    }
  }, [user, loading, segments, inAuthFlow, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FF6A00" />
      </View>
    );
  }

  return <Slot />;
}

// --- RootLayout ---
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

// --- Globalni Filter Modal ---
function GlobalFilterModal() {
  const { isVisible, hideModal, setFilterValues, filterValues } =
    useFilterModal();

  const handleApplyFilter = (newFilters: any) => {
    setFilterValues(newFilters);
    hideModal();
  };

  return (
    <LikeFilterModal
      visible={isVisible}
      onClose={hideModal}
      onApply={handleApplyFilter}
      initialFilters={filterValues}
    />
  );
}

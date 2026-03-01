import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Slot, useRouter, useSegments, Redirect } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import * as Notifications from 'expo-notifications';
import { Platform, ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import LikeFilterModal from "../components/likes/LikeFilterModal";
import { AuthProvider, useAuthContext } from "../context/AuthContext";
import {
    FilterModalProvider,
    useFilterModal,
} from "../context/FilterModalContext";
import { ProfileProvider } from "../context/ProfileContext";
import { SocketProvider } from "../context/SocketContext";
import AnimatedSplash from "./AnimatedSplash";

const queryClient = new QueryClient();

// --- Auth navigator za preusmeravanje ---
function AuthNavigator() {
  const { user, loading } = useAuthContext();
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

  useEffect(() => {
    console.log("User:", user);
    console.log("Loading:", loading);
    console.log("Segments:", segments);
    console.log("In Auth Flow:", inAuthFlow);

    if (loading) return;

    // Ako korisnik nije prijavljen i nije u auth toku → login
    if (!user && !inAuthFlow) {
      router.replace("/(auth)/login");
    }
    // Ako je korisnik prijavljen i u auth toku → home
    else if (user && inAuthFlow) {
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

  return segments.length ? <Slot /> : <RootRedirect />;
}

// --- RootLayout ---
export default function RootLayout() {
  const [isSplashAnimationFinished, setSplashAnimationFinished] = useState(false);

  useEffect(() => {
    // Postavi handler za foreground notifikacije
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // Traži dozvolu i uzmi push token
    const registerForPushNotificationsAsync = async () => {
      let token;
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
        });
      }
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('Dozvola za notifikacije nije odobrena!');
        return;
      }
      // token = (await Notifications.getExpoPushTokenAsync()).data;
    };
    registerForPushNotificationsAsync();

    return () => {};
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SocketProvider>
            <ProfileProvider>
              <FilterModalProvider>
                <GlobalFilterModal />
                {isSplashAnimationFinished ? (
                  <AuthNavigator />
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

// Global LikeFilterModal povezan sa kontekstom
function GlobalFilterModal() {
  const { isVisible, hideModal, setFilterValues, filterValues } =
    useFilterModal();
  // const { user } = useAuthContext();
  // const queryClient = useQueryClient();
  // filtersRef više nije potreban

  // Handler za primenu filtera
  const handleApplyFilter = (newFilters: {
    ageRange: [number, number];
    distance: number;
    gender: string;
  }) => {
    setFilterValues(newFilters);
    console.log("[FILTER] Sačuvane filter vrednosti za home:", newFilters);
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

function RootRedirect() {
  return <Redirect href="/(auth)/login" />;
}

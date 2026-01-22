import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Slot, useRouter, useSegments } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ActivityIndicator, View } from "react-native";
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
    if (loading) return;

    // Ako nije prijavljen i nije u auth toku → login
    if (!user && !inAuthFlow) {
      router.replace("/(auth)/login");
    }
    // Ako jeste prijavljen i u auth toku → home
    else if (user && inAuthFlow) {
      router.replace("/(tabs)/home");
    }
  }, [user, loading, segments, inAuthFlow]);

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
  const [isSplashAnimationFinished, setSplashAnimationFinished] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [notification, setNotification] = useState<any>(null);

  useEffect(() => {
    // Postavi handler za foreground notifikacije
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
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
      token = (await Notifications.getExpoPushTokenAsync()).data;
      setExpoPushToken(token);
    };
    registerForPushNotificationsAsync();

    // Listener za primljene notifikacije
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });
    // Listener za interakciju sa notifikacijom
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      // Možeš ovde dodati navigaciju ili logiku
      console.log('Notifikacija kliknuta:', response);
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
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
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
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

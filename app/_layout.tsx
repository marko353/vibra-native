import React, { useState, useEffect, useMemo } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuthContext } from '../context/AuthContext';
import { ProfileProvider } from '../context/ProfileContext';
import AnimatedSplash from './AnimatedSplash';
import { View, ActivityIndicator, Text } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const queryClient = new QueryClient();

function AuthNavigator() {
  const { user, loading } = useAuthContext();
  const segments = useSegments();
  const router = useRouter();

  const inAuthGroup = useMemo(() => segments[0] === '(auth)', [segments]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // ISPRAVKA: Preusmeravamo na grupu, a ruter će sam naći početni 'index.tsx' ekran
      router.replace('/(tabs)/home');
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ff7f00" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  const [isSplashAnimationFinished, setSplashAnimationFinished] = useState(false);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {isSplashAnimationFinished ? (
        // Lepo formatirano da se izbegnu greške sa tekstom
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ProfileProvider>
              <AuthNavigator />
            </ProfileProvider>
          </AuthProvider>
        </QueryClientProvider>
      ) : (
        <AnimatedSplash onFinish={() => setSplashAnimationFinished(true)} />
      )}
    </GestureHandlerRootView>
  );
}


import React, { useState, useEffect, useMemo } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuthContext } from '../context/AuthContext';
import { ProfileProvider } from '../context/ProfileContext';
import AnimatedSplash from './AnimatedSplash';
import { View, ActivityIndicator } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SocketProvider } from '../context/SocketContext';

const queryClient = new QueryClient();

// --- Auth navigator za preusmeravanje ---
function AuthNavigator() {
  const { user, loading } = useAuthContext();
  const segments = useSegments();
  const router = useRouter();

  const inAuthFlow = useMemo(() => {
    const rootSegment = segments[0];
    return rootSegment === '(auth)' || rootSegment === 'signup' || rootSegment === 'forgot-password';
  }, [segments]);

  useEffect(() => {
    if (loading) return;

    // Ako nije prijavljen i nije u auth toku → login
    if (!user && !inAuthFlow) {
      router.replace('/(auth)/login');
    } 
    // Ako jeste prijavljen i u auth toku → home
    else if (user && inAuthFlow) {
      router.replace('/(tabs)/home');
    }
  }, [user, loading, segments, inAuthFlow]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6A00" />
      </View>
    );
  }

  return <Slot />;
}

// --- RootLayout ---
export default function RootLayout() {
  const [isSplashAnimationFinished, setSplashAnimationFinished] = useState(false);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SocketProvider>
            <ProfileProvider>
              {isSplashAnimationFinished ? (
                <AuthNavigator />
              ) : (
                <AnimatedSplash onFinish={() => setSplashAnimationFinished(true)} />
              )}
            </ProfileProvider>
          </SocketProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuthContext } from '../context/AuthContext';
import { ProfileProvider } from '../context/ProfileContext';
// Pretpostavljamo da imate AnimatedSplash
import AnimatedSplash from './AnimatedSplash'; 
import { View, ActivityIndicator, Text } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const queryClient = new QueryClient();

function AuthNavigator() {
  const { user, loading } = useAuthContext();
  const segments = useSegments();
  const router = useRouter();

  // ✅ KRITIČNA IZMENA: Definišemo sve rute koje ne zahtevaju autentifikaciju
  const inAuthFlow = useMemo(() => {
    const rootSegment = segments[0];
    return (
      rootSegment === '(auth)' || 
      rootSegment === 'signup' || // Dodato za sve rute registracije
      rootSegment === 'forgot-password'
    );
  }, [segments]);

  useEffect(() => {
    if (loading) {
      return;
    }

    // 🛑 Logika preusmeravanja
    
    // 1. Ako NIJE prijavljen I NIJE u dozvoljenom (signup/auth) toku
    if (!user && !inAuthFlow) {
      // Forsirano preusmeravanje na login
      router.replace('/(auth)/login');
    } 
    // 2. Ako JESTE prijavljen I JESTE u toku za neautentifikaciju
    else if (user && inAuthFlow) {
      // Forsirano preusmeravanje na home tab
      router.replace('/(tabs)/home');
    }
  }, [user, loading, segments, inAuthFlow]); // Dodat inAuthFlow u zavisnosti

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
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ProfileProvider>
              {/* AuthNavigator sadrži glavnu logiku rutiranja */}
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
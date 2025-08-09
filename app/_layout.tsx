import React, { useState, useEffect, useMemo } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuthContext } from '../context/AuthContext';
import  {ProfileProvider } from '../context/ProfileContext'; // ✨ Dodao sam ovu liniju
import AnimatedSplash from '../app/AnimatedSplash';
import { View, ActivityIndicator, Text } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const queryClient = new QueryClient();

function AuthNavigator() {
  const { user, loading } = useAuthContext();
  const segments = useSegments();
  const router = useRouter();

  const inAuthGroup = useMemo(() => {
    const currentSegment = segments[0];
    return ['(auth)', 'login', 'signup', 'forgot-password', 'resetPassword'].includes(currentSegment as string);
  }, [segments]);

  const [initialCheckComplete, setInitialCheckComplete] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user && !inAuthGroup) {
      router.replace('../login');
    } else if (user && inAuthGroup) {
      router.replace('/home');
    }

    setInitialCheckComplete(true);
  }, [user, loading]);

  if (loading || !initialCheckComplete) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ff7f00" />
        <Text style={{ marginTop: 10, color: '#666' }}>Učitavanje aplikacije...</Text>
      </View>
    );
  }

  return <Slot />;
}

export default function Layout() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {showSplash ? (
        <AnimatedSplash onFinish={() => setShowSplash(false)} />
      ) : (
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ProfileProvider>
              <AuthNavigator />
            </ProfileProvider>
          </AuthProvider>
        </QueryClientProvider>
      )}
    </GestureHandlerRootView>
  );
}
import React, { useState, useEffect } from 'react';
import { Slot } from 'expo-router';
import { AuthProvider, useAuthContext } from '../context/AuthContext';
import AnimatedSplash from '../app/AnimatedSplash';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Gesture Handler
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Kreiraj QueryClient
const queryClient = new QueryClient();

function AppContent() {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/home'); // ili '/profile'
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ff7f00" />
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

  if (showSplash) {
    return <AnimatedSplash onFinish={() => setShowSplash(false)} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

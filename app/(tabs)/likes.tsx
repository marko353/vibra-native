import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

import Header from '../../components/Header';
import LikesGrid from '../../components/likes/LikesGrid';
import LikesCTA from '../../components/likes/LikesCTA';
import { useAuthContext } from '../../context/AuthContext';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

/* ================= COMPONENT ================= */

export default function LikesTab() {
  const { user } = useAuthContext();

  const isPremium = false;

  /* ================= DEBUG LOGS ================= */

  useEffect(() => {
    console.log('📌 LikesTab mounted');
    console.log('👤 User from AuthContext:', user);
    console.log('🔑 Token exists:', !!user?.token);
    console.log('🆔 User ID:', user?.id);
  }, [user]);

  /* ================= QUERY ================= */

  const {
    data: likes = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    // 🔥 KLJUČNA PROMENA
    queryKey: ['incoming-likes', user?.id],

    queryFn: async () => {
      console.log('🚀 incoming-likes queryFn CALLED');

      const res = await axios.get(
        `${API_BASE_URL}/api/user/incoming-likes`,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      console.log('📦 RAW response:', res.data);
      console.log('❤️ Likes from response:', res.data?.likes);
      console.log('🔢 Likes count:', res.data?.likes?.length ?? 0);

      return res.data?.likes || [];
    },

    // 🔥 KLJUČNA PROMENA
    enabled: !!user?.token && !!user?.id,

    // 🔥 KLJUČNA PROMENA
    refetchOnMount: true,
  });

  /* ================= RENDER LOGS ================= */

  console.log('🌀 isLoading:', isLoading);
  console.log('❌ isError:', isError);
  if (isError) {
    console.log('🔥 Query error:', error);
  }
  console.log('📊 Likes in state:', likes);
  console.log('📊 Likes length:', likes.length);

  /* ================= RENDER ================= */

  return (
    <View style={styles.container}>
      <Header title={`${likes.length} sviđanja`} />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text>Greška pri učitavanju sviđanja.</Text>
        </View>
      ) : (
        <>
          {console.log('✅ Rendering SUCCESS state')}
          <LikesGrid data={likes} isPremium={isPremium} />
          <LikesCTA
            isPremium={isPremium}
            onPress={() => {
              console.log('💳 OPEN PREMIUM PAYWALL');
            }}
          />
        </>
      )}
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

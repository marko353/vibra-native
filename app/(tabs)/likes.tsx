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

  /* ================= DEBUG MOUNT ================= */

  useEffect(() => {
    console.log('📌 [LikesTab] Component Mounted');
    console.log('👤 [LikesTab] Current User ID:', user?.id);
  }, []);

  /* ================= QUERY ================= */

  const {
    data: likes = [],
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery({
    // ✅ Sinhronizovan ključ sa SocketProvider-om i TabsLayout-om
    queryKey: ['incoming-likes', user?.id],

    queryFn: async () => {
      console.log('🚀 [LikesTab] queryFn START: Fetching from API...');

      const res = await axios.get(
        `${API_BASE_URL}/api/user/incoming-likes`,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      // ✅ Osiguravamo da vraćamo niz, bez obzira na strukturu response-a
      const fetchedLikes = res.data?.likes || res.data || [];
      
      console.log('📦 [LikesTab] API Response received. Count:', fetchedLikes.length);
      return fetchedLikes;
    },

    // ✅ Pokreći samo ako imamo korisnika
    enabled: !!user?.token && !!user?.id,
    
    // Osveži podatke pri svakom ulasku u tab
    refetchOnMount: true,
    // Podaci se smatraju "svežim" 10 sekundi, nakon toga će API biti pozvan u pozadini
    staleTime: 1000 * 10, 
  });

  /* ================= RENDER LOGS ================= */

  // Ovi logovi će se okinuti svaki put kada SocketProvider uradi setQueryData
  useEffect(() => {
    console.log('📊 [LikesTab] UI Update detected. Current likes count:', likes.length);
    if (likes.length > 0) {
       console.log('👀 [LikesTab] First user in list:', likes[0].fullName || likes[0]._id);
    }
  }, [likes]);

  /* ================= RENDER ================= */

  return (
    <View style={styles.container}>
      {/* Prikazujemo broj lajkova u headeru */}
      <Header title={`${likes.length} sviđanja`} />
       
  <View style={styles.likesHeader}>
  <View style={styles.likesBadge}>
    <Text style={styles.likesCount}>{likes.length}</Text>
    <Text style={styles.likesLabel}>sviđanja</Text>
  </View>
</View>

      {/* Indikator učitavanja ili osvežavanja u pozadini */}
      {(isLoading || (isFetching && likes.length === 0)) ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#ff7f00" />
          <Text style={{ marginTop: 10 }}>Učitavanje...</Text>
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text>Greška pri učitavanju sviđanja.</Text>
          <Text style={{ fontSize: 12, color: 'red' }}>{error?.message}</Text>
        </View>
      ) : (
        <>
          {/* Ako nema lajkova, ovde možete dodati Empty State komponentu */}
          {likes.length === 0 && (
            <View style={styles.center}>
               <Text>Još uvek nemaš lajkova.</Text>
            </View>
          )}

          <LikesGrid data={likes} isPremium={isPremium} />
          
          <LikesCTA
            isPremium={isPremium}
            onPress={() => {
              console.log('💳 [LikesTab] Premium Button Pressed');
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
    padding: 20,
  },
likesHeader: {
  alignItems: 'center',
  marginVertical: 12,
},

likesBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#FFE4EA',
  paddingHorizontal: 16,
  paddingVertical: 6,
  borderRadius: 30,
  elevation: 3,
  shadowColor: '#000',
  shadowOpacity: 0.1,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
},

likesCount: {
  fontSize: 20,
  fontWeight: '700',
  color: '#ff3b5c',
  marginRight: 6,
},

likesLabel: {
  fontSize: 15,
  color: '#ff3b5c',
  fontWeight: '500',
},

});
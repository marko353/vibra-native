import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthContext } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useQuery, useQueryClient } from '@tanstack/react-query'; // Dodato useQuery

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const calculateAge = (birthDateString?: string | null): number | null => {
  if (!birthDateString) return null;
  const birthDate = new Date(birthDateString);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export default function ProfileScreen() {
  console.log('PROFILE SCREEN IS LOADING');
  const { user, logout, loading: authContextLoading } = useAuthContext();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Koristimo useQuery umesto useState i useEffect
  const { data: profile, isLoading: isProfileLoading, isError } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user?.token) return null;
      const response = await axios.get(`${API_BASE_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      return response.data;
    },
    enabled: !!user?.token,
  });

  // Prefetch-ovanje podataka za EditProfileScreen
  // Učitavamo ih u pozadini dok je korisnik na ovoj strani
  useFocusEffect(
    useCallback(() => {
      if (user?.id && user?.token) {
        // Prefetch-uje profilne podatke za EditProfile
        queryClient.prefetchQuery({
          queryKey: ['userProfile', user.id],
          queryFn: async () => {
            const res = await axios.get(`${API_BASE_URL}/api/user/${user.id}`, {
              headers: { Authorization: `Bearer ${user.token}` },
            });
            return res.data;
          },
        });
        // Prefetch-uje profilne slike
        queryClient.prefetchQuery({
          queryKey: ['userProfilePhotos', user.id],
          queryFn: async () => {
            const res = await axios.get(`${API_BASE_URL}/api/user/profile-pictures`, {
              headers: { Authorization: `Bearer ${user.token}` },
            });
            const filledImages = Array(9).fill(null);
            if (Array.isArray(res.data.profilePictures)) {
              res.data.profilePictures.forEach((url: string, i: number) => {
                if (i < 9) filledImages[i] = url;
              });
            }
            return filledImages;
          },
        });
      }
    }, [user, queryClient])
  );

  // --- RENDERING LOGIKA ---

  if (authContextLoading || isProfileLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ color: '#555', marginTop: 10 }}>Učitavanje profila...</Text>
      </View>
    );
  }

  if (isError || !profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: '#555' }}>Profil nije učitan ili još uvek nije dostupan.</Text>
        <TouchableOpacity style={{ marginTop: 20, padding: 10, backgroundColor: '#eee', borderRadius: 5 }} onPress={() => queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] })}>
          <Text>Pokušaj ponovo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const age = calculateAge(profile.birthDate);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topSection}>
        {profile.avatar ? (
          <Image source={{ uri: profile.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarPlaceholderText}>
              {profile.fullName?.[0] || '?'}
            </Text>
          </View>
        )}
        <View style={styles.nameAgeContainer}>
          <Text style={styles.name}>
            {profile.fullName}{age !== null ? `, ${age}` : ''}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.editButton}
        onPress={() => router.push('/profile/edit-profile')}
      >
        <Icon name="edit" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.editButtonText}>Izmeni profil</Text>
      </TouchableOpacity>

      <Text style={styles.galleryTitle}>Galerija</Text>
      

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 40,
    backgroundColor: '#fefefe',
    alignItems: 'center',
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 55,
    backgroundColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 40,
    color: '#999',
    fontWeight: '700',
  },
  nameAgeContainer: {
    marginLeft: 24,
    justifyContent: 'center',
    flexShrink: 1,
  },
  name: {
    fontSize: 24,
    top: -15,
    fontWeight: '700',
    color: '#222',
  },
  editButton: {
    flexDirection: 'row',
    backgroundColor: '#ff2f06',
    paddingVertical: 7,
    top: -55,
    paddingHorizontal: 22,
    borderRadius: 30,
    marginBottom: 130,
    alignItems: 'center',
    shadowColor: '#ff2f06',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  editButtonText: {
    color: '#ffff',
    fontSize: 14,
    fontWeight: '800',
  },
  galleryTitle: {
    fontSize: 22,
    fontWeight: '700',
    alignSelf: 'flex-start',
    marginBottom: 16,
    color: '#111',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  image: {
    width: 115,
    height: 115,
    borderRadius: 12,
    margin: 8,
    backgroundColor: '#eee',
  },
  noImagesText: {
    color: '#888',
    fontStyle: 'italic',
    marginTop: 14,
  },
  logoutButton: {
    marginTop: 48,
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 30,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
});
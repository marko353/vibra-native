import React, { useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import axios from 'axios';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthContext } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import MonetizationPackages from '../../components/MonetizationPackages';
import BenefitMarquee from '../../components/BenefitMarquee';

const { width: windowWidth } = Dimensions.get('window');

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const HORIZONTAL_PADDING = 24;

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

const COLORS = {
  primary: '#E91E63',
  background: '#fefefe',
  textPrimary: '#222',
  textSecondary: '#555',
  cardBackground: '#fff',
  shadowColor: '#000',
  editButton: '#E91E63',
};

export default function ProfileScreen() {
  const { user, loading: authContextLoading } = useAuthContext();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: isProfileLoading, isError } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user?.token) {
        console.error("Token nije dostupan. Preskačem dohvat korisničkih podataka.");
        return null;
      }
      try {
        const response = await axios.get(`${API_BASE_URL}/api/user/profile`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        
        console.log("--- DEBUG: Preuzeti podaci za profil ---");
        console.log("Serverski odgovor (profil):", response.data);
        console.log("-----------------------------------------");

        return response.data;
      } catch (error) {
        console.error('Greška pri preuzimanju profila:', error);
        throw error;
      }
    },
    enabled: !!user?.token,
    retry: 1,
  });

  useFocusEffect(
    useCallback(() => {
      if (user?.id && user?.token) {
        queryClient.prefetchQuery({
          queryKey: ['userProfile', user.id],
          queryFn: async () => {
            const res = await axios.get(`${API_BASE_URL}/api/user/${user.id}`, {
              headers: { Authorization: `Bearer ${user.token}` },
            });
            return res.data;
          },
        });
      }
    }, [user, queryClient])
  );

  if (authContextLoading || isProfileLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.textSecondary, marginTop: 10 }}>Učitavanje profila...</Text>
      </View>
    );
  }

  if (isError || !profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: COLORS.textSecondary }}>Profil nije učitan ili još uvek nije dostupan.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] })}>
          <Text style={{ color: COLORS.textPrimary }}>Pokušaj ponovo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const age = calculateAge(profile.birthDate);

  // --- ISPRAVLJENA LOGIKA ZA AVATAR ---
  const avatarSource =
    profile.profilePictures && profile.profilePictures.length > 0
      ? { uri: profile.profilePictures[0] }
      : null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.profileHeaderSection}>
        {avatarSource ? (
          <Image source={avatarSource} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarPlaceholderText}>
              {profile.fullName?.[0] || '?'}
            </Text>
          </View>
        )}
        <View style={styles.nameContainer}>
          <Text style={styles.name}>
            {profile.fullName}{age !== null ? `, ${age}` : ''}
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.editButton}
            onPress={() => router.push('/profile/edit-profile')}
          >
            <Icon name="edit" size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.editButtonText}>Izmeni profil</Text>
          </TouchableOpacity>
        </View>
      </View>

      <MonetizationPackages />
      <BenefitMarquee />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    backgroundColor: COLORS.background,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#eee',
    borderRadius: 5,
  },
  profileHeaderSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 40,
    paddingLeft: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ddd',
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
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
  nameContainer: {
    marginLeft: 20,
    justifyContent: 'center',
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  editButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.editButton,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.editButton,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  editButtonText: {
    color: '#ffff',
    fontSize: 16,
    fontWeight: '800',
  },
});
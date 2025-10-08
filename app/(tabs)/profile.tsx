import React, { useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthContext } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useQueryClient } from '@tanstack/react-query';
import MonetizationPackages from '../../components/MonetizationPackages';
import BenefitMarquee from '../../components/BenefitMarquee';
import Header from '../../components/Header';
// ✨ 1. DODATO: Uvozimo `useProfileContext`
import { useProfileContext } from '../../context/ProfileContext';

// ... (calculateAge funkcija ostaje ista)
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
  const { user } = useAuthContext();
  const router = useRouter();
  const queryClient = useQueryClient();

  // ✨ 2. KLJUČNA IZMENA: Koristimo podatke direktno iz Contexta!
  const { profile, isLoading: isProfileLoading, isRefetching } = useProfileContext();

  // ✨ 3. UKLONJENO: Ceo `useQuery` blok koji je bio ovde je obrisan.

  useFocusEffect(
    useCallback(() => {
      // Ovaj deo je i dalje koristan, on osvežava podatke kada se vratimo na ekran
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['userProfile', user.id] });
      }
    }, [user, queryClient])
  );

  if (isProfileLoading || isRefetching) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.textSecondary, marginTop: 10 }}>Učitavanje profila...</Text>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={{ color: COLORS.textSecondary }}>Došlo je do greške pri učitavanju profila.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] })}>
          <Text style={{ color: COLORS.textPrimary }}>Pokušaj ponovo</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const age = calculateAge(profile.birthDate);
  const avatarSource =
    profile.profilePictures && profile.profilePictures.length > 0
      ? { uri: profile.profilePictures[0] }
      : null;

  return (
    <SafeAreaView style={styles.mainContainer}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
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
              onPress={() => router.push('/profile/editProfile')}
            >
              <Icon name="edit" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.editButtonText}>Izmeni profil</Text>
            </TouchableOpacity>
          </View>
        </View>

        <MonetizationPackages />
        <BenefitMarquee />
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#eee',
    borderRadius: 25,
  },
  profileHeaderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ddd',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  avatarPlaceholderText: {
    fontSize: 40,
    color: '#999',
    fontWeight: '700',
  },
  nameContainer: {
    marginLeft: 20,
    flex: 1, 
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  editButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.editButton,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start', 
    shadowColor: COLORS.editButton,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

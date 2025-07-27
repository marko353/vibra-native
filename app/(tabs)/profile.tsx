import React, { useEffect, useState } from 'react';
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
import { useRouter } from 'expo-router';
import { useAuthContext } from '@/context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

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
  const [profile, setProfile] = useState<null | {
    fullName: string;
    birthDate?: string | null;
    avatar?: string | null;
    profilePictures?: string[];
  }>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (user?.token) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      setProfile(response.data);
    } catch (error) {
      console.error('Greška pri dohvaćanju profila:', error);
      Alert.alert('Greška', 'Nije moguće učitati profil.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: '#555' }}>Profil nije učitan.</Text>
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
        onPress={() => router.push('/edit-profile')}
      >
        <Icon name="edit" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.editButtonText}>Izmeni profil</Text>
      </TouchableOpacity>

      <Text style={styles.galleryTitle}>Galerija</Text>
      <View style={styles.grid}>
        {profile.profilePictures && profile.profilePictures.length > 0 ? (
          profile.profilePictures.map((img, idx) => (
            <Image key={idx} source={{ uri: img }} style={styles.image} />
          ))
        ) : (
          <Text style={styles.noImagesText}>Nema dostupnih slika.</Text>
        )}
      </View>

      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.logoutButton}
        onPress={async () => {
          try {
            await (await import('@/context/AuthContext')).useAuthContext().logout();
            router.replace('/login');
          } catch (e) {
            Alert.alert('Greška', 'Logout nije uspeo.');
          }
        }}
      >
        <Text style={styles.logoutButtonText}>Odjavi se</Text>
      </TouchableOpacity>

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
    shadowColor: '',
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

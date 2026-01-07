import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width / 2 - 18;
const CARD_HEIGHT = 260;

interface LikeCardProps {
  user: {
    _id: string;
    fullName: string;
    birthDate: string;
    avatar: string;
    age?: number;
  };
  onLike: () => void;
  onSkip: () => void;
}

export default function LikeCard({ user, onLike, onSkip }: LikeCardProps) {
  
  // ✅ PRECIZNA LOGIKA ZA GODINE
  const getPreciseAge = (birthDateString: string) => {
    if (!birthDateString) return "N/A";

    const today = new Date();
    const birthDate = new Date(birthDateString);
    
    // Inicijalna razlika
    let age = today.getFullYear() - birthDate.getFullYear();
    
    // Provera meseca i dana
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    // Ako je mesec rođenja tek pred nama, ili je ovaj mesec ali dan tek dolazi
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }

    return age;
  };

  const age = getPreciseAge(user.birthDate);

  return (
    <View style={styles.card}>
      <Image source={{ uri: user.avatar || 'https://via.placeholder.com/150' }} style={styles.image} />

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.9)']}
        style={styles.gradient}
      />

      <Text style={styles.nameText} numberOfLines={1}>
        {user.fullName}, {age}
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.rejectBtn} onPress={onSkip}>
          <Ionicons name="close" size={22} color="#ff4d4d" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.likeBtn} onPress={onLike}>
          <Ionicons name="heart" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    marginBottom: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '50%',
  },
  nameText: {
    position: 'absolute',
    bottom: 50,
    left: 12,
    right: 12,
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  actions: {
    position: 'absolute',
    bottom: 10,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  likeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ff3b5c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
import React, { useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width / 2 - 18;
const CARD_HEIGHT = 260;

interface LikeCardProps {
  user: {
    _id: string;
    fullName: string;
    birthDate: string;
    avatar: string;
  };
  onLike: (id: string) => void;
  onSkip: (id: string) => void;
}

export default function LikeCard({ user, onLike, onSkip }: LikeCardProps) {
  // Animacione vrednosti
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const getPreciseAge = (birthDateString: string) => {
    if (!birthDateString) return 'N/A';
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const animateAndExit = (callback: (id: string) => void) => {
    // Paralelna animacija skupljanja i nestajanja
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Tek kada se animacija završi, javljamo roditelju da obriše podatke
      callback(user._id);
    });
  };

  const handleRejectPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    animateAndExit(onSkip);
  };

  const handleLikePress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    animateAndExit(onLike);
  };

  return (
    <Animated.View 
      style={[
        styles.card, 
        { opacity, transform: [{ scale }] } // Primena animacije
      ]}
    >
      <Image 
        source={{ uri: user.avatar || 'https://via.placeholder.com/150' }} 
        style={styles.image} 
      />
      
      <LinearGradient 
        colors={['transparent', 'rgba(0,0,0,0.85)']} 
        style={styles.gradient} 
      />

      <Text style={styles.nameText} numberOfLines={1}>
        {user.fullName}, {getPreciseAge(user.birthDate)}
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.rejectBtn} 
          onPress={handleRejectPress} 
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color="#ff4d4d" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.likeBtn} 
          onPress={handleLikePress} 
          activeOpacity={0.7}
        >
          <Ionicons name="heart" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </Animated.View>
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
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  gradient: { position: 'absolute', bottom: 0, width: '100%', height: '60%' },
  nameText: { 
    position: 'absolute', 
    bottom: 55, 
    left: 12, 
    right: 12, 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },
  actions: { 
    position: 'absolute', 
    bottom: 12, 
    width: '100%', 
    flexDirection: 'row', 
    justifyContent: 'space-evenly', 
    alignItems: 'center' 
  },
  likeBtn: { 
    width: 42, 
    height: 42, 
    borderRadius: 21, 
    backgroundColor: '#FF6A00', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  rejectBtn: { 
    width: 42, 
    height: 42, 
    borderRadius: 21, 
    backgroundColor: '#ffffff', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
});
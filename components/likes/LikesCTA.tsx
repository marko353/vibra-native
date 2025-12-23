import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

/* ================= TYPES ================= */

interface LikesCTAProps {
  isPremium: boolean;
  onPress?: () => void; // otvara paywall / premium modal
}

/* ================= COMPONENT ================= */

const LikesCTA: React.FC<LikesCTAProps> = ({ isPremium, onPress }) => {
  // ✅ Ako user ima premium – CTA se uopšte ne prikazuje
  if (isPremium) return null;

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        <LinearGradient
          colors={['#f9d976', '#f39f86', '#f76b1c']} // Tinder Gold vibe
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.button}
        >
          <Text style={styles.title}>Vidi kome se sviđaš</Text>
          <Text style={styles.subtitle}>
            Otkrij sve lajkove uz Premium
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

export default LikesCTA;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    alignItems: 'center',
    zIndex: 100,
  },
  button: {
    width: width * 0.85,
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  title: {
    color: '#1c1c1c',
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 4,
    color: '#1c1c1c',
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.85,
  },
});

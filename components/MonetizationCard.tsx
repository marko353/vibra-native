import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ColorValue } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = {
  cardBackground: '#fff',
  textPrimary: '#222',
  textSecondary: '#666',
  buttonText: '#fff',
  shadowColor: '#000',
  extraGradient: ['#3B82F6', '#2563EB'] as const,
  goldGradient: ['#FFD700', '#F2994A'] as const,
  platinumGradient: ['#E5E4E2', '#BFC0C0'] as const,
};

interface MonetizationCardProps {
  pkg: {
    name: string;
    price: string;
    icon: string;
    color: string;
  };
}

// ✨ DEKLARACIJA TIPA za niz boja koji LinearGradient očekuje
type GradientColorArray = readonly [ColorValue, ColorValue, ...ColorValue[]];

const MonetizationCard = ({ pkg }: MonetizationCardProps) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  };

  const animatedStyle = {
    transform: [{ scale: scaleValue }],
  };

  // ✨ Korišćenje novog tipa prilikom deklaracije promenljive
  let gradientColors: GradientColorArray = [pkg.color, pkg.color] as GradientColorArray;

  if (pkg.name === 'Extra Paket') {
    gradientColors = COLORS.extraGradient;
  } else if (pkg.name === 'Gold Paket') {
    gradientColors = COLORS.goldGradient;
  } else if (pkg.name === 'Platinum Paket') {
    gradientColors = COLORS.platinumGradient;
  }

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <TouchableOpacity
        style={styles.cardTouchable}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => console.log(`Pretplati se na ${pkg.name}`)}
        activeOpacity={1}
      >
        <LinearGradient
          colors={gradientColors}
          style={styles.iconCircle}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Icon name={pkg.icon} size={40} color="#fff" />
        </LinearGradient>
        
        <Text style={styles.packageName}>{pkg.name}</Text>
        <Text style={styles.packagePrice}>{pkg.price}</Text>

        <TouchableOpacity 
          style={[styles.subscribeButton, { borderColor: pkg.color }]}
          activeOpacity={0.8}
        >
          <Text style={[styles.subscribeButtonText, { color: pkg.color }]}>Pretplati se</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const CARD_WIDTH = 220;
const CARD_MARGIN = 10;

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 15,
    width: CARD_WIDTH,
    marginHorizontal: CARD_MARGIN,
    alignItems: 'center',
    padding: 15,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  cardTouchable: {
    width: '100%',
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  packageName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 5,
    textAlign: 'center',
  },
  packagePrice: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: 25,
    textAlign: 'center',
  },
  subscribeButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    width: '90%',
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  subscribeButtonText: {
    fontWeight: '700',
    fontSize: 16,
  },
});

export default MonetizationCard;
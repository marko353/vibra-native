import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ColorValue,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: windowWidth } = Dimensions.get('window');
const CARD_WIDTH = windowWidth - 80;

type GradientColorArray = readonly [ColorValue, ColorValue, ...ColorValue[]];

interface MonetizationCardProps {
  pkg: {
    name: string;
    price: string;
    icon: string;
    color: string;
    gradient: GradientColorArray;
    description?: string;
  };
}

const MonetizationCard = ({ pkg }: MonetizationCardProps) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  if (!pkg) return <View />;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 60,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 8,
    }).start();
  };

  const priceAmount = pkg.price.includes('/') ? pkg.price.split('/')[0].trim() : pkg.price;

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleValue }] }]}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e']}
        style={styles.darkBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => console.log(`Subscribe to ${pkg.name}`)}
          activeOpacity={1}
          style={styles.touchable}
        >
          {/* Top accent line */}
          <LinearGradient
            colors={pkg.gradient}
            style={styles.accentLine}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />

          <View style={styles.topRow}>
            {/* Icon */}
            <LinearGradient
              colors={pkg.gradient}
              style={styles.iconBox}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name={pkg.icon as any} size={24} color="#fff" />
            </LinearGradient>

            {/* Name & description */}
            <View style={styles.nameBlock}>
              <Text style={styles.name}>{pkg.name}</Text>
              {pkg.description && (
                <Text style={styles.description}>{pkg.description}</Text>
              )}
            </View>

            {/* Price */}
            <View style={styles.priceBlock}>
              <Text style={styles.price}>{priceAmount}</Text>
              <Text style={styles.priceSub}>/ mo</Text>
            </View>
          </View>

          {/* CTA */}
          <LinearGradient
            colors={pkg.gradient}
            style={styles.btn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.btnText}>Get started</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    alignSelf: 'center',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 10,
  },
  darkBg: {
    borderRadius: 24,
  },
  accentLine: {
    height: 3,
    width: '100%',
    marginBottom: 4,
  },
  touchable: {
    padding: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  nameBlock: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  description: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 16,
  },
  priceBlock: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  priceSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
    marginTop: 1,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.2,
  },
});

export default MonetizationCard;
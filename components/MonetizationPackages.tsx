import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import MonetizationCard from './MonetizationCard';

const { width: windowWidth } = Dimensions.get('window');

const packages = [
  {
    name: 'Extra',
    price: '9.99€ / mo',
    icon: 'flash-outline',
    color: '#3B82F6',
    gradient: ['#3B82F6', '#2563EB'] as const,
    description: 'Boost your visibility',
  },
  {
    name: 'Gold',
    price: '19.99€ / mo',
    icon: 'star-outline',
    color: '#F59E0B',
    gradient: ['#F59E0B', '#D97706'] as const,
    description: 'Gold badge & priority search',
  },
  {
    name: 'Platinum',
    price: '29.99€ / mo',
    icon: 'diamond-outline',
    color: '#8B5CF6',
    gradient: ['#8B5CF6', '#7C3AED'] as const,
    description: 'All features, unlimited',
  },
];

const MonetizationPackages = () => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Upgrade your profile</Text>
        <Text style={styles.subtitle}>Unlock premium features</Text>
      </View>
      <Carousel
        loop
        width={windowWidth}
        height={200}
        autoPlay
        autoPlayInterval={3500}
        scrollAnimationDuration={900}
        pagingEnabled={false}
        data={packages}
        renderItem={({ item }) => <MonetizationCard pkg={item} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
    marginLeft: -20, // kompenzuje padding parenta
  },
  headerRow: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#999',
    fontWeight: '400',
  },
});

export default MonetizationPackages;
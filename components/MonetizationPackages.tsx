import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import MonetizationCard from './MonetizationCard';

const { width: windowWidth } = Dimensions.get('window');
const CARD_MARGIN = 10;
const CAROUSEL_WIDTH = windowWidth;

const COLORS = {
  textPrimary: '#222',
};

interface MonetizationPackage {
  name: string;
  price: string;
  icon: string;
  color: string;
}

const packages: MonetizationPackage[] = [
  {
    name: 'Extra Paket',
    price: '9.99€ / mesec',
    icon: 'star-circle',
    color: '#3B82F6',
  },
  {
    name: 'Gold Paket',
    price: '19.99€ / mesec',
    icon: 'crown',
    color: '#FFD700',
  },
  {
    name: 'Platinum Paket',
    price: '29.99€ / mesec',
    icon: 'diamond',
    color: '#E5E4E2',
  },
];

const MonetizationPackages = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Nadogradi svoj profil</Text>
      <Carousel
        loop
        width={CAROUSEL_WIDTH} // Koristi punu širinu ekrana
        height={220}
        autoPlay={true}
        autoPlayInterval={3000}
        data={packages}
        pagingEnabled={false}
        scrollAnimationDuration={1000}
        renderItem={({ item, index }) => (
          <MonetizationCard key={index} pkg={item} />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 24, // ✨ Dodali smo padding ovde
  },
});

export default MonetizationPackages;
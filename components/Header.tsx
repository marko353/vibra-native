import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Definišemo novi, logičniji prop
interface HeaderProps {
  withShadow?: boolean;
}

export default function Header({ withShadow }: HeaderProps) {
  return (
    // Logika je sada obrnuta: primeni senku samo ako je `withShadow` true
    <SafeAreaView edges={['top']} style={[styles.container, withShadow && styles.shadow]}>
      <Image
        source={require('../assets/images/1000006380.png')} // Prilagodite putanju
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="Logo"
      />
      <View style={styles.buttons}>
        <TouchableOpacity
          onPress={() => console.log('Otvoren filter')}
          accessibilityLabel="Filter dugme"
          style={styles.iconButton}
        >
          <MaterialCommunityIcons name="tune-variant" size={28} color="#FF6B6B" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => console.log('Otvorena pogodnost')}
          accessibilityLabel="Pogodnost dugme"
          style={styles.iconButton}
        >
          <MaterialCommunityIcons name="star-four-points" size={28} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 100,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shadow: {
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  logo: {
    width: 100,
    height: 100,
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 10,
  },
});
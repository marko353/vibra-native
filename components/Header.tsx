import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Header() {
  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <Image
        source={require('@/assets/images/1000006380.png')}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="Logo"
      />
      <View style={styles.buttons}>
        <TouchableOpacity
          onPress={() => console.log('Otvoren filter')}
          accessibilityLabel="Filter dugme"
          style={styles.iconButton} // Dodat novi stil
        >
          <MaterialCommunityIcons
            name="tune-variant"
            size={28} // Malo manja ikona
            color="#E91E63" // Boja koja se uklapa sa ostalim elementima (primary color)
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => console.log('Otvorena pogodnost')}
          accessibilityLabel="Pogodnost dugme"
          style={styles.iconButton} // Dodat novi stil
        >
          <MaterialCommunityIcons
            name="star-four-points"
            size={28} // Malo manja ikona
            color="#E91E63" // Primary color
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 100, // Malo manja visina
    backgroundColor: '#fff',
    paddingHorizontal: 20, // Povećan razmak sa strane
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  logo: {
    width: 100, // Manji logo
    height: 100,
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 'auto',
  },
  iconButton: {
    padding: 8, // Dodat padding oko dugmeta za lakše pritiskanje
    marginLeft: 10, // Razmak između ikona
  },
});
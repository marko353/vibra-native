import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Header() {
  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* LOGO */}
      <Image
        source={require('@/assets/images/1000006380.png')}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="Logo"
      />

      {/* DESNA STRANA */}
      <View style={styles.buttons}>
        <TouchableOpacity
          onPress={() => console.log('Otvoren filter')}
          accessibilityLabel="Filter dugme"
        >
          <MaterialCommunityIcons
            name="tune-variant"
            size={30}
            color="black"
            style={styles.filterIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => console.log('Otvorena pogodnost')}
          accessibilityLabel="Pogodnost dugme"
        >
          <MaterialCommunityIcons
            name="star-four-points"
            size={30}
            
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 110,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingTop: 10,  // dodatni spacing unutar safe area
  },
  logo: {
    width: 130,
    height: 130,
    left: -10,
    
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
 
  filterIcon: {
    marginBottom: -20,
    right: 70,
  },
  icon: {
    marginLeft: -35,
    marginBottom: -19,
  }
});

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import axios from 'axios';
import { useAuthContext } from '../../context/AuthContext';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuthContext(); // Dodao signOut

  const requestLocationPermission = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Dozvola odbijena',
          'Aplikacija neće moći da koristi funkcije lokacije.'
        );
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      if (!user?.token) {
        return;
      }
      
      const response = await axios.put(
        `${API_BASE_URL}/api/user/update-location`,
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      // ISPRAVLJENA LINIJA: Specifičnija poruka o grešci
      Alert.alert(
        'Greška sa lokacijom',
        'Lokacija nije dostupna. Molimo vas da proverite da li su lokacijske usluge uključene na vašem uređaju.'
      );
    }
  };

  useEffect(() => {
    requestLocationPermission();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Dobrodošao na početnu stranu VibrA!</Text>

      <Button
        title="Logout"
        color="#e63946"
        onPress={logout} // Korišćenje signOut funkcije iz konteksta
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20, fontWeight: '600', marginBottom: 20 },
});

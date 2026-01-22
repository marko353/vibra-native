import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as Location from 'expo-location';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// ✨ Komponenta prima 'onComplete' prop da obavesti TabsGroupGateLayout da je gotova
export default function LocationPermissionScreen({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { location?: object | null; showLocation: boolean }) => {
      if (!user?.token) throw new Error('Not authenticated');
      // Uklonili smo slanje `hasCompletedLocationPrompt` na server
      const response = await axios.put(`${API_BASE_URL}/api/user/update-profile`, data, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      return response.data.user;
    },
    onSuccess: async () => {
      console.log('LOG: [LocationScreen] Mutacija uspešna.');
      // ✨ Upisujemo u AsyncStorage da je prompt završen
      await AsyncStorage.setItem('location_prompt_completed', 'true');
      // ✨ Obaveštavamo TabsGroupGateLayout da može dalje
      onComplete();
    },
    onError: (error) => {
      console.error('ERROR: [LocationScreen] Mutacija neuspešna:', error);
      Alert.alert('Greška', 'Nije uspelo čuvanje podešavanja.');
    },
  });

  const handleDecision = (locationData: { location: object | null; showLocation: boolean }) => {
    updateProfileMutation.mutate(locationData);
  };

  const handleActivateLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Dozvola nije data', 'Ne možemo pristupiti lokaciji.');
      handleDecision({ location: null, showLocation: false });
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    const geocode = await Location.reverseGeocodeAsync(location.coords);
    const locationCity = geocode[0]?.subregion || geocode[0]?.city || null;

    handleDecision({
      location: { ...location.coords, locationCity },
      showLocation: true,
    });
  };

  const handleDeclineLocation = () => {
    handleDecision({ location: null, showLocation: false });
  };

  // 👇 JSX deo ekrana
  return (
    <View style={styles.container}>
      <Ionicons name="location-outline" size={64} color="#ff7f00" style={{ marginBottom: 20 }} />
      <Text style={styles.title}>Dozvoli pristup lokaciji</Text>
      <Text style={styles.subtitle}>
        VibrA koristi tvoju lokaciju da bi prikazala korisnike u tvojoj blizini.
      </Text>

      {updateProfileMutation.isPending ? (
        <ActivityIndicator size="small" color="#ff7f00" style={{ marginTop: 20 }} />
      ) : (
        <>
          <TouchableOpacity style={styles.allowButton} onPress={handleActivateLocation}>
            <Text style={styles.allowText}>Dozvoli lokaciju</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.declineButton} onPress={handleDeclineLocation}>
            <Text style={styles.declineText}>Preskoči</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

// 💅 Stilovi
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 40,
  },
  allowButton: {
    backgroundColor: '#ff7f00',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginBottom: 15,
  },
  allowText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  declineButton: {
    backgroundColor: '#f2f2f2',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  declineText: {
    color: '#333',
    fontSize: 16,
  },
});

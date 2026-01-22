import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthContext } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#FE4E60',
  textPrimary: '#1E1E1E',
  white: '#FFFFFF',
  background: '#F0F2F5',
};

export default function LocationOnboardingScreen() {
  const router = useRouter();
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);

  const requestLocationPermission = async () => {
    setLoading(true);
    console.log('[Onboarding] Requesting location permission...');

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const isEnabled = status === 'granted';
      console.log(`[Onboarding] Location permission granted: ${isEnabled}`);

      if (!isEnabled) {
        Alert.alert('Dozvola lokacije', 'Da bi koristio aplikaciju, moraš omogućiti lokaciju.');
      }

      if (isEnabled && user?.token) {
        const location = await Location.getCurrentPositionAsync({});
        console.log('[Onboarding] Current location:', location);

        // Slanje lokacije na backend
        try {
          const response = await fetch('https://tvoj-backend.com/api/update-location', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.token}`,
            },
            body: JSON.stringify({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              accuracy: location.coords.accuracy,
              showLocation: true,
            }),
          });
          const data = await response.json();
          console.log('[Onboarding] Backend response:', data);
        } catch (error) {
          console.error('[Onboarding] Error sending location to backend:', error);
        }
      }

      // 🚀 Obavezno setujemo flag pre redirect-a
      await AsyncStorage.setItem('hasSeenLocationOnboarding', 'true');
      console.log('[Onboarding] hasSeenLocationOnboarding set to true');

      router.replace('/(tabs)/home');
      console.log('[Onboarding] Redirect to home');

    } catch (err) {
      console.error('[Onboarding] Error requesting location:', err);
      Alert.alert('Greška', 'Došlo je do greške pri dobijanju lokacije.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Živiš ovde negde?</Text>
        <Text style={styles.subtitle}>
          Podesi lokaciju da vidiš ko ti je u kraju ili šire. Nećeš moći da se spojiš sa ljudima ako to ne učiniš.
        </Text>
        <View style={styles.iconCircle}>
          <Ionicons name="location-outline" size={80} color={COLORS.primary} />
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.allowButton, loading && { opacity: 0.7 }]}
          onPress={requestLocationPermission}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Čekaj...' : 'Dozvoli'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: width * 0.1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginTop: 15,
    lineHeight: 26,
  },
  iconCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  buttonContainer: {
    paddingBottom: 40,
    alignItems: 'center',
    width: '100%',
  },
  allowButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 30,
    width: '100%',
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

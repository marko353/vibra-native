// app/profile/edit/horoscope.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, Platform } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
// LinearGradient nije neophodan ako ga ne koristite za stilizaciju u ovom fajlu, ali ga možete zadržati

const horoscopeOptions = [
  "Ovan", "Bik", "Blizanci", "Rak", "Lav", "Devica",
  "Vaga", "Škorpija", "Strelac", "Jarac", "Vodolija", "Ribe"
];

export default function HoroscopeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedHoroscope, setSelectedHoroscope] = useState<string | null>(null);

  useEffect(() => {
    // Inicijalizacija iz parametara rute kada se ekran fokusira
    if (params.currentHoroscope) {
      setSelectedHoroscope(params.currentHoroscope as string);
    }
  }, [params.currentHoroscope]);

  const handleSave = useCallback(() => {
    if (selectedHoroscope) {
      router.navigate({
        pathname: '/profile/edit-profile', // OVO JE VAŽNA PUTANJA: Mora da se poklapa sa fajlom vaše komponente
        params: { updatedHoroscope: selectedHoroscope },
      });
    } else {
      Alert.alert("Greška", "Molimo odaberite horoskopski znak.");
    }
  }, [selectedHoroscope, router]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#ff2f06" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Horoskop</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Sačuvaj</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        {horoscopeOptions.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.optionCard,
              selectedHoroscope === option && styles.selectedOptionCard,
            ]}
            onPress={() => setSelectedHoroscope(option)}
          >
            <Text style={[
              styles.optionText,
              selectedHoroscope === option && styles.selectedOptionText,
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'android' ? 40 : 10, // Prilagodite paddingTop za Android
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#ff2f06',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  optionCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedOptionCard: {
    borderColor: '#ff2f06',
    borderWidth: 2,
    backgroundColor: '#fff5f5',
  },
  optionText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#ff2f06',
    fontWeight: '700',
  },
});
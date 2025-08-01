// app/profile/edit/drinks.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, Platform } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const drinksOptions = [
  "Ne pijem",
  "Povremeno pijem",
  "Redovno pijem",
  "Samo u posebnim prilikama",
  "Pijem samo pivo",
];

export default function DrinksScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  useEffect(() => {
    if (params.currentDrinks) {
      setSelectedOption(params.currentDrinks as string);
    }
  }, [params.currentDrinks]);

  const handleSave = useCallback(() => {
    if (selectedOption) {
      router.navigate({
        pathname: '/profile/edit-profile', // Ispravna putanja nazad
        params: { updatedDrinks: selectedOption },
      });
    } else {
      Alert.alert("Greška", "Molimo odaberite opciju za piće.");
    }
  }, [selectedOption, router]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#ff2f06" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Piće</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Sačuvaj</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        {drinksOptions.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.optionCard, selectedOption === option && styles.selectedOptionCard]}
            onPress={() => setSelectedOption(option)}
          >
            <Text style={[styles.optionText, selectedOption === option && styles.selectedOptionText]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 15, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 10,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#333' },
  saveButton: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, backgroundColor: '#ff2f06' },
  saveButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  container: { flex: 1, padding: 20, backgroundColor: '#f8f8f8' },
  optionCard: {
    backgroundColor: '#fff', borderRadius: 15, paddingVertical: 18, paddingHorizontal: 20, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
    alignItems: 'center', justifyContent: 'center',
  },
  selectedOptionCard: { borderColor: '#ff2f06', borderWidth: 2, backgroundColor: '#fff5f5' },
  optionText: { fontSize: 18, color: '#333', fontWeight: '500' },
  selectedOptionText: { color: '#ff2f06', fontWeight: '700' },
});
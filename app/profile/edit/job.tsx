// app/profile/edit/job.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, Platform, TextInput, Keyboard
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function JobScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [jobTitle, setJobTitle] = useState<string | null>(null);

  useEffect(() => {
    if (params.currentJob) {
      setJobTitle(params.currentJob as string);
    }
  }, [params.currentJob]);

  const handleSave = useCallback(() => {
    Keyboard.dismiss();
    
    // Ključna izmena: Koristi se `router.replace`
    // Putanja mora biti relativna da bi se ispravno vratio unutar (tabs)
    // Postoji problem sa rutama, 'edit-profile' nije unutar '/profile/'
    // Već je verovatno 'edit-profile.tsx' u 'app/profile/' folderu, 
    // pa je putanja samo '/profile/edit-profile'
    router.replace({
      pathname: '/profile/edit-profile', // Ažurirana putanja
      params: { updatedJob: jobTitle || '' }, 
    });
  }, [jobTitle, router]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#ff2f06" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Posao</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Sačuvaj</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        <Text style={styles.label}>Tvoj posao/zanimanje:</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Npr. Softver inženjer, Dizajner"
          placeholderTextColor="#888"
          value={jobTitle || ''}
          onChangeText={setJobTitle}
          maxLength={50}
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />
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
  label: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 10 },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
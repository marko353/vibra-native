// app/profile/edit/education.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, TextInput, Keyboard
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#5B41F5', // Vibrant, modern blue
  background: '#F0F2F5', // Light grey background
  cardBackground: '#FFFFFF', // Pure white for cards
  textPrimary: '#1E1E1E', // Darker text for readability
  textSecondary: '#666666', // Grey for secondary text
  placeholder: '#A0A0A0', // Lighter grey for placeholders
  border: '#E0E0E0', // Light border color
};

export default function EducationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [educationLevel, setEducationLevel] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (params.currentEducation) {
      setEducationLevel(params.currentEducation as string);
    }
  }, [params.currentEducation]);

  const handleSave = useCallback(() => {
    Keyboard.dismiss();
    router.replace({
      pathname: '/profile/edit-profile',
      params: { updatedEducation: educationLevel || '' },
    });
  }, [educationLevel, router]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Obrazovanje</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Sačuvaj</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        <Text style={styles.label}>Nivo obrazovanja</Text>
        <TextInput
          style={[styles.textInput, isFocused && styles.textInputFocused]}
          placeholder="Npr. Fakultet, Srednja škola, Master"
          placeholderTextColor={COLORS.placeholder}
          value={educationLevel || ''}
          onChangeText={setEducationLevel}
          maxLength={50}
          returnKeyType="done"
          onSubmitEditing={handleSave}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 15,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    color: COLORS.cardBackground,
    fontWeight: '600',
    fontSize: 16,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 15,
  },
  textInput: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 15,
    paddingVertical: 18,
    paddingHorizontal: 20,
    fontSize: 16,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  textInputFocused: {
    borderColor: COLORS.primary,
    shadowOpacity: 0.2,
    elevation: 6,
  },
});
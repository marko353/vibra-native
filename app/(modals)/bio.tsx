// app/(modals)/bio.tsx - Finalna korigovana verzija (sa diskretnim kursorom)

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthContext } from '../../context/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const API_B = process.env.EXPO_PUBLIC_API_BASE_URL;

const COLORS = {
  primary: '#E91E63',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  background: '#F8F8F8',
  cardBackground: '#FFFFFF',
  border: '#E0E0E0',
  white: '#FFFFFF',
  danger: '#DC3545',
};

const MAX_BIO_LENGTH = 500;

export default function BioModalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const textInputRef = useRef<TextInput>(null);

  const initialBio = typeof params.currentBio === 'string' ? params.currentBio : '';
  const [bioInput, setBioInput] = useState(initialBio);
  const [isChanged, setIsChanged] = useState(false);

  useEffect(() => {
    setIsChanged(bioInput !== initialBio);
  }, [bioInput, initialBio]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      textInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, []);

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: { field: string; value: any }) => {
      if (!user?.token) throw new Error("Token not available");
      const response = await axios.put(
        `${API_B}/api/user/update-profile`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['userProfile', user?.id], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          [variables.field]: variables.value,
        };
      });
      router.back();
    },
    onError: (error: any) => {
      console.error('Greška pri čuvanju biografije:', error.response?.data || error.message);
      Alert.alert('Greška', `Došlo je do greške prilikom čuvanja biografije: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleSaveBio = () => {
    const trimmedBio = bioInput.trim();
    updateProfileMutation.mutate({ field: 'bio', value: trimmedBio === '' ? null : trimmedBio });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cardBackground} />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="close-outline" size={30} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Uredi biografiju</Text>
          <TouchableOpacity
            onPress={handleSaveBio}
            style={styles.headerButton}
            disabled={!isChanged || updateProfileMutation.isPending || bioInput.trim() === initialBio.trim()}
          >
            {updateProfileMutation.isPending ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <Text style={[
                styles.saveButtonTextHeader,
                { color: (!isChanged || bioInput.trim() === initialBio.trim()) ? COLORS.textSecondary : COLORS.primary }
              ]}>
                Sačuvaj
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* CONTENT */}
        <View style={styles.content}>
          <TextInput
            ref={textInputRef}
            style={styles.textInput}
            multiline
            placeholder="Napišite nešto o sebi..."
            placeholderTextColor={COLORS.textSecondary}
            value={bioInput}
            onChangeText={setBioInput}
            maxLength={MAX_BIO_LENGTH}
            autoCorrect={true}
            autoCapitalize="sentences"
            // ✨ KLJUČNA PROMENA: Postavljen cursorColor na istu boju kao tekst
            cursorColor={COLORS.textPrimary}
          />
          <View style={styles.charCountContainer}>
            <Text style={styles.charCountText}>
              {bioInput.length}/{MAX_BIO_LENGTH}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.cardBackground,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  saveButtonTextHeader: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.cardBackground,
  },
  textInput: {
    flex: 1,
    minHeight: 120,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: COLORS.textPrimary,
    textAlignVertical: 'top',
    lineHeight: 24,
    backgroundColor: COLORS.cardBackground,
    ...Platform.select({
      ios: {
     
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  charCountContainer: {
    alignSelf: 'flex-end',
    marginTop: 10,
    marginBottom: Platform.OS === 'ios' ? 0 : 20,
  },
  charCountText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
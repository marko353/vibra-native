import React, { useState, useRef, useEffect } from 'react';
import {
  View, TextInput, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, SafeAreaView, StatusBar, Dimensions
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthContext } from '../../context/AuthContext';
import { useProfileContext } from '../../context/ProfileContext';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const API_B = process.env.EXPO_PUBLIC_API_BASE_URL;
const MAX_BIO_LENGTH = 500;

const { width } = Dimensions.get('window');
const wp = (percentage: number) => (width * percentage) / 100;
const RF = (size: number) => size * (width / 375);

const COLORS = {
  primary: '#E91E63',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  background: '#F8F8F8',
  cardBackground: '#FFFFFF',
  border: '#E0E0E0',
  headerShadow: 'rgba(0, 0, 0, 0.08)',
};

export default function BioModalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthContext();
  const { setProfileField } = useProfileContext();

  const initialBio = typeof params.currentBio === 'string' ? params.currentBio : '';
  const [bioInput, setBioInput] = useState(initialBio);
  const [isChanged, setIsChanged] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  useEffect(() => setIsChanged(bioInput !== initialBio), [bioInput, initialBio]);
  useEffect(() => { const timeout = setTimeout(() => textInputRef.current?.focus(), 100); return () => clearTimeout(timeout); }, []);

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: { field: string; value: any }) => {
      if (!user?.token) throw new Error("Token not available");
      const res = await axios.put(`${API_B}/api/user/update-profile`, payload, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      return res.data;
    },
    onSuccess: (data, variables) => {
      setProfileField(variables.field as 'bio', variables.value);
      router.back();
    },
    onError: (error: any) => {
      console.error("LOG: [BioModal] onError:", error.response?.data || error.message);
      Alert.alert('Greška', `Došlo je do greške: ${error.response?.data?.message || error.message}`);
    }
  });

  const handleSaveBio = () => {
    const trimmed = bioInput.trim();
    updateProfileMutation.mutate({ field: 'bio', value: trimmed === '' ? null : trimmed });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cardBackground} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} disabled={updateProfileMutation.isPending}>
            <Ionicons name="close-outline" size={RF(30)} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Uredi biografiju</Text>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSaveBio}
            disabled={!isChanged || updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <Text style={[styles.saveBtnText, { color: !isChanged ? COLORS.textSecondary : COLORS.primary }]}>
                Sačuvaj
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Bio Input */}
        <TextInput
          ref={textInputRef}
          value={bioInput}
          onChangeText={setBioInput}
          multiline
          maxLength={MAX_BIO_LENGTH}
          placeholder="Napišite nešto o sebi..."
          style={styles.input}
        />
        <Text style={styles.charCount}>{bioInput.length}/{MAX_BIO_LENGTH}</Text>
      </KeyboardAvoidingView>
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
    paddingHorizontal: wp(4),
    paddingVertical: wp(2.5),
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + wp(2) : wp(2.5),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.cardBackground,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.headerShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      android: {
        elevation: 6,
      },
    }),
    zIndex: 10,
  },
  closeBtn: { padding: wp(1.5) },
  saveBtn: { padding: wp(1.5) },
  saveBtnText: { fontSize: RF(16), fontWeight: '600' },
  headerTitle: {
    fontSize: RF(18),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: wp(2),
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 15,
    textAlignVertical: 'top',
    fontSize: 16,
    minHeight: 150,
    backgroundColor: COLORS.cardBackground,
    margin: wp(4),
  },
  charCount: {
    alignSelf: 'flex-end',
    marginHorizontal: wp(4),
    marginTop: 4,
    color: COLORS.textSecondary,
    fontSize: 12,
  },
});

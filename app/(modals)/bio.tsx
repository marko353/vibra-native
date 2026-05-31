import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthContext } from '../../context/AuthContext';
import { useProfileContext } from '../../context/ProfileContext';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { AntDesign } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API_B = process.env.EXPO_PUBLIC_API_BASE_URL;
const MAX_BIO_LENGTH = 500;

const COLORS = {
  primary: '#ff7f00',
  textPrimary: '#1a1a1a',
  textSecondary: '#999',
  textPlaceholder: '#C8C8C8',
  background: '#fff',
  border: '#ECECEC',
  inputBg: '#FAFAFA',
};

export default function BioModalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthContext();
  const { setProfileField } = useProfileContext();
  const insets = useSafeAreaInsets();

  const initialBio = typeof params.currentBio === 'string' ? params.currentBio : '';
  const [bioInput, setBioInput] = useState(initialBio);
  const isChanged = bioInput !== initialBio;
  const textInputRef = useRef<TextInput>(null);

  useEffect(() => {
    const timeout = setTimeout(() => textInputRef.current?.focus(), 150);
    return () => clearTimeout(timeout);
  }, []);

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: { field: string; value: any }) => {
      if (!user?.token) throw new Error("Token not available");
      const res = await axios.put(`${API_B}/api/user/update-profile`, payload, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      setProfileField(variables.field as 'bio', variables.value);
      router.back();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || error.message);
    },
  });

  const handleSave = () => {
    const trimmed = bioInput.trim();
    updateProfileMutation.mutate({ field: 'bio', value: trimmed === '' ? null : trimmed });
  };

  const charLeft = MAX_BIO_LENGTH - bioInput.length;
  const isNearLimit = charLeft < 50;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingBottom: insets.bottom || 16 }]}>

        {/* Drag handle */}
        <View style={styles.dragHandle} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => router.back()}
            disabled={updateProfileMutation.isPending}
          >
            <AntDesign name="close" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>About me</Text>

          <TouchableOpacity
            style={[styles.saveBtn, isChanged && styles.saveBtnActive]}
            onPress={handleSave}
            disabled={!isChanged || updateProfileMutation.isPending}
            activeOpacity={0.8}
          >
            {updateProfileMutation.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={[styles.saveBtnText, isChanged && styles.saveBtnTextActive]}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Tell others a bit about yourself
        </Text>

        {/* Input */}
        <View style={styles.inputWrapper}>
          <TextInput
            ref={textInputRef}
            value={bioInput}
            onChangeText={setBioInput}
            multiline
            maxLength={MAX_BIO_LENGTH}
            placeholder="Write something about yourself..."
            placeholderTextColor={COLORS.textPlaceholder}
            style={styles.input}
            selectionColor={COLORS.primary}
          />
        </View>

        {/* Char count */}
        <Text style={[styles.charCount, isNearLimit && styles.charCountWarning]}>
          {charLeft} characters remaining
        </Text>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },

  // Drag handle
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 20,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
  },
  saveBtnActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPlaceholder,
  },
  saveBtnTextActive: {
    color: '#fff',
  },

  // Subtitle
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },

  // Input
  inputWrapper: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.inputBg,
    padding: 4,
  },
  input: {
    fontSize: 15,
    color: COLORS.textPrimary,
    padding: 12,
    minHeight: 160,
    textAlignVertical: 'top',
    lineHeight: 22,
  },

  // Char count
  charCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'right',
  },
  charCountWarning: {
    color: '#ff4444',
    fontWeight: '600',
  },
});
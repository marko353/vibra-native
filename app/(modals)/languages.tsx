import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  ScrollView,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthContext } from '../../context/AuthContext';
import { useProfileContext } from '../../context/ProfileContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ModalDragHandle, ModalHeader, modalStyles } from '../../components/ModalTemplate';

const API_B = process.env.EXPO_PUBLIC_API_BASE_URL;

const COLORS = {
  primary: '#ff7f00',
  textPrimary: '#1a1a1a',
  textSecondary: '#999',
  textMuted: '#bbb',
  border: '#ECECEC',
  selectedBg: '#fff5ec',
  selectedBorder: '#ffd0a8',
  cardBg: '#fff',
  inputBg: '#FAFAFA',
};

const PREDEFINED_LANGUAGES: string[] = [
  'Serbian', 'English', 'German', 'Spanish', 'French',
  'Italian', 'Russian', 'Chinese', 'Japanese', 'Arabic',
];

const MAX_LANGUAGES = 4;

interface MutationPayload { field: string; value: any; }

export default function LanguagesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthContext();
  const { setProfileField } = useProfileContext();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const initialLanguages: string[] = useMemo(() => {
    if (typeof params.currentLanguages === 'string') {
      try {
        const parsed = JSON.parse(params.currentLanguages);
        return Array.isArray(parsed) ? parsed.map(String) : [];
      } catch { return []; }
    }
    if (Array.isArray(params.currentLanguages)) return params.currentLanguages.map(String);
    return [];
  }, [params.currentLanguages]);

  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(initialLanguages);
  const [newLanguage, setNewLanguage] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  const hasChanges = useMemo(() =>
    JSON.stringify([...initialLanguages].sort()) !== JSON.stringify([...selectedLanguages].sort()),
    [initialLanguages, selectedLanguages]
  );

  useEffect(() => {
    if (showInput) {
      const t = setTimeout(() => textInputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [showInput]);

  const allLanguages: string[] = useMemo(() => {
    const custom = selectedLanguages.filter(
      lang => !PREDEFINED_LANGUAGES.some(p => p.toLowerCase() === lang.toLowerCase())
    );
    return Array.from(new Set([...PREDEFINED_LANGUAGES, ...custom])).sort((a, b) => a.localeCompare(b));
  }, [selectedLanguages]);

  const mutation = useMutation({
    mutationFn: async (payload: MutationPayload) => {
      if (!user?.token) throw new Error("Token not available");
      const res = await axios.put(`${API_B}/api/user/update-profile`, payload, {
        headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' },
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      setProfileField('languages', variables.value);
      queryClient.setQueryData(['userProfile', user?.id], (old: any) =>
        old ? { ...old, languages: variables.value } : old
      );
      router.back();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || error.message);
    },
  });

  const handleToggle = (lang: string) => {
    if (mutation.isPending) return;
    setSelectedLanguages(prev => {
      if (prev.includes(lang)) return prev.filter(l => l !== lang);
      if (prev.length >= MAX_LANGUAGES) {
        Alert.alert('Limit reached', `You can select up to ${MAX_LANGUAGES} languages.`);
        return prev;
      }
      return [...prev, lang];
    });
  };

  const handleAdd = () => {
    const trimmed = newLanguage.trim();
    if (!trimmed) return;
    if (selectedLanguages.length >= MAX_LANGUAGES) {
      Alert.alert('Limit reached', `You can select up to ${MAX_LANGUAGES} languages.`);
      setNewLanguage('');
      Keyboard.dismiss();
      return;
    }
    if (allLanguages.some(l => l.toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert('Already added', 'This language is already in your list.');
      setNewLanguage('');
      Keyboard.dismiss();
      return;
    }
    setSelectedLanguages(prev => [...prev, trimmed]);
    setNewLanguage('');
    setShowInput(false);
    Keyboard.dismiss();
  };

  const handleSave = () => {
    if (selectedLanguages.length === 0) {
      Alert.alert('Required', 'Please select at least one language.');
      return;
    }
    if (!hasChanges || mutation.isPending) return;
    mutation.mutate({ field: 'languages', value: selectedLanguages });
  };

  const isAtLimit = selectedLanguages.length >= MAX_LANGUAGES;

  return (
    <View style={[modalStyles.container, { paddingBottom: insets.bottom || 16 }]}>
      <ModalDragHandle />
      <ModalHeader
        title="Languages"
        onClose={() => router.back()}
        onSave={handleSave}
        hasChanges={hasChanges}
        isPending={mutation.isPending}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Counter */}
          <View style={styles.counterRow}>
            <Text style={styles.counterLabel}>Selected</Text>
            <View style={[styles.countBadge, isAtLimit && styles.countBadgeFull]}>
              <Text style={[styles.countBadgeText, isAtLimit && styles.countBadgeTextFull]}>
                {selectedLanguages.length}/{MAX_LANGUAGES}
              </Text>
            </View>
          </View>

          {/* Add input or button */}
          {showInput ? (
            <View style={styles.inputRow}>
              <TextInput
                ref={textInputRef}
                style={[styles.input, isFocused && styles.inputFocused]}
                placeholder="Type a language..."
                placeholderTextColor={COLORS.textMuted}
                value={newLanguage}
                onChangeText={setNewLanguage}
                onSubmitEditing={handleAdd}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                editable={!mutation.isPending}
              />
              <TouchableOpacity
                style={styles.addBtn}
                onPress={handleAdd}
                disabled={mutation.isPending}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.addLanguageBtn, isAtLimit && styles.addLanguageBtnDisabled]}
              onPress={() => setShowInput(true)}
              disabled={isAtLimit || mutation.isPending}
              activeOpacity={0.7}
            >
              <Ionicons
                name="add-circle-outline"
                size={18}
                color={isAtLimit ? COLORS.textMuted : COLORS.primary}
              />
              <Text style={[styles.addLanguageBtnText, isAtLimit && styles.addLanguageBtnTextDisabled]}>
                Add a language
              </Text>
            </TouchableOpacity>
          )}

          {/* Chips */}
          <View style={styles.chipsContainer}>
            {allLanguages.map(lang => {
              const isSelected = selectedLanguages.includes(lang);
              return (
                <TouchableOpacity
                  key={lang}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => handleToggle(lang)}
                  disabled={mutation.isPending}
                  activeOpacity={0.65}
                >
                  {isSelected && (
                    <Ionicons
                      name="checkmark"
                      size={11}
                      color={COLORS.primary}
                      style={{ marginRight: 4 }}
                    />
                  )}
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {lang}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  counterLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  countBadgeFull: {
    backgroundColor: COLORS.selectedBg,
    borderColor: COLORS.selectedBorder,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  countBadgeTextFull: {
    color: COLORS.primary,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  inputFocused: {
    borderColor: COLORS.selectedBorder,
    backgroundColor: COLORS.cardBg,
  },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLanguageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.selectedBorder,
    backgroundColor: COLORS.selectedBg,
    marginBottom: 16,
  },
  addLanguageBtnDisabled: {
    borderColor: COLORS.border,
    backgroundColor: '#FAFAFA',
  },
  addLanguageBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  addLanguageBtnTextDisabled: {
    color: COLORS.textMuted,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    backgroundColor: '#FAFAFA',
  },
  chipSelected: {
    borderColor: COLORS.selectedBorder,
    backgroundColor: COLORS.selectedBg,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
    letterSpacing: 0.1,
  },
  chipTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
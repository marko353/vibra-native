// app/(modals)/languages.tsx - Implementacija kao standardni ekran
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
  SafeAreaView,
  StatusBar,
  Dimensions,
  ScrollView,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthContext } from '../../context/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_B = process.env.EXPO_PUBLIC_API_BASE_URL;

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
  white: '#FFFFFF',
  danger: '#DC3545',
  selectedChip: '#FFEBF1',
  selectedChipBorder: '#E91E63',
  headerShadow: 'rgba(0, 0, 0, 0.08)',
};

const PREDEFINED_LANGUAGES: string[] = [
  'Srpski', 'Engleski', 'Nemački', 'Španski', 'Francuski', 'Italijanski', 'Ruski', 'Kineski', 'Japanski', 'Arapski',
];
const MAX_LANGUAGES = 4;

export default function LanguagesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const initialLanguages: string[] = useMemo(() => {
    if (typeof params.currentLanguages === 'string') {
      try {
        return JSON.parse(params.currentLanguages);
      } catch (e) {
        console.error("Failed to parse currentLanguages:", e);
        return [];
      }
    }
    if (Array.isArray(params.currentLanguages)) {
      return params.currentLanguages.map(String);
    }
    return [];
  }, [params.currentLanguages]);

  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(initialLanguages);
  const [newLanguage, setNewLanguage] = useState<string>('');
  const [showInput, setShowInput] = useState<boolean>(false);
  const textInputRef = useRef<TextInput>(null);

  const hasChanges = useMemo(() => {
    const sortedInitial = [...initialLanguages].sort();
    const sortedSelected = [...selectedLanguages].sort();
    return JSON.stringify(sortedInitial) !== JSON.stringify(sortedSelected);
  }, [initialLanguages, selectedLanguages]);

  useEffect(() => {
    if (showInput) {
      const timeoutId = setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [showInput]);

  const allLanguages: string[] = useMemo(() => {
    const customLanguages = selectedLanguages.filter(lang => !PREDEFINED_LANGUAGES.includes(lang));
    const uniqueLanguages = new Set([...PREDEFINED_LANGUAGES, ...customLanguages]);
    return Array.from(uniqueLanguages).sort((a, b) => a.localeCompare(b));
  }, [selectedLanguages]);

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
      console.error('Greška pri čuvanju jezika:', error.response?.data || error.message);
      Alert.alert('Greška', `Došlo je do greške prilikom čuvanja jezika: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleToggleLanguage = (language: string) => {
    if (updateProfileMutation.isPending) return;
    setSelectedLanguages((prev: string[]) => {
      const isSelected = prev.includes(language);
      if (isSelected) {
        return prev.filter((lang: string) => lang !== language);
      } else {
        if (prev.length >= MAX_LANGUAGES) {
          Alert.alert('Limit je dostignut', `Možete odabrati maksimalno ${MAX_LANGUAGES} jezika.`);
          return prev;
        }
        return [...prev, language];
      }
    });
  };

  const handleAddLanguage = () => {
    if (updateProfileMutation.isPending) return;
    const trimmedLang = newLanguage.trim();
    if (trimmedLang === '') {
      Alert.alert('Upozorenje', 'Unesite naziv jezika.');
      return;
    }
    if (selectedLanguages.length >= MAX_LANGUAGES) {
      Alert.alert('Limit je dostignut', `Možete dodati maksimalno ${MAX_LANGUAGES} jezika.`);
      setNewLanguage('');
      Keyboard.dismiss();
      return;
    }
    if (allLanguages.map(l => l.toLowerCase()).includes(trimmedLang.toLowerCase())) {
      Alert.alert('Upozorenje', 'Ovaj jezik je već dodat ili odabran.');
      setNewLanguage('');
      Keyboard.dismiss();
      return;
    }

    setSelectedLanguages(prev => [...prev, trimmedLang]);
    setNewLanguage('');
    setShowInput(false);
    Keyboard.dismiss();
  };

  const handleSave = () => {
    updateProfileMutation.mutate({ field: 'languages', value: selectedLanguages });
  };

  const renderLanguageItem = (item: string) => {
    const isSelected = selectedLanguages.includes(item);
    return (
      <TouchableOpacity
        key={item}
        style={[
          styles.languageChip,
          isSelected && styles.languageChipSelected,
          updateProfileMutation.isPending && styles.languageChipDisabled
        ]}
        onPress={() => handleToggleLanguage(item)}
        disabled={updateProfileMutation.isPending}
      >
        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{item}</Text>
        {isSelected && (
          <Ionicons name="checkmark-circle-outline" size={RF(18)} color={COLORS.primary} style={styles.chipIcon} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cardBackground} />

      {/* Header View */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton} disabled={updateProfileMutation.isPending}>
          <Ionicons name="close-outline" size={RF(30)} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Uredi jezike</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={styles.headerButton}
          disabled={!hasChanges || updateProfileMutation.isPending}
        >
          {updateProfileMutation.isPending ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Text style={[
              styles.saveButtonTextHeader,
              { color: (!hasChanges) ? COLORS.textSecondary : COLORS.primary }
            ]}>
              Sačuvaj
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Content View */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollViewContentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.selectedCount}>
            Odabrano: {selectedLanguages.length} / {MAX_LANGUAGES}
          </Text>
          {showInput ? (
            <View style={styles.inputContainer}>
              <TextInput
                ref={textInputRef}
                style={styles.textInput}
                placeholder="Unesite novi jezik"
                placeholderTextColor={COLORS.textSecondary}
                value={newLanguage}
                onChangeText={setNewLanguage}
                onSubmitEditing={handleAddLanguage}
                cursorColor={COLORS.textPrimary}
                returnKeyType="done"
                autoCapitalize="sentences"
                editable={!updateProfileMutation.isPending}
              />
              <TouchableOpacity
                style={[styles.addButton, updateProfileMutation.isPending && styles.addButtonDisabled]}
                onPress={handleAddLanguage}
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Ionicons name="add" size={RF(24)} color={COLORS.white} />
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.addLanguageButton,
                (selectedLanguages.length >= MAX_LANGUAGES || updateProfileMutation.isPending) && styles.addLanguageButtonDisabled
              ]}
              onPress={() => setShowInput(true)}
              disabled={selectedLanguages.length >= MAX_LANGUAGES || updateProfileMutation.isPending}
            >
              <Ionicons
                name="add-circle-outline"
                size={RF(22)}
                color={(selectedLanguages.length >= MAX_LANGUAGES || updateProfileMutation.isPending) ? COLORS.textSecondary : COLORS.primary}
              />
              <Text style={[
                styles.addLanguageText,
                (selectedLanguages.length >= MAX_LANGUAGES || updateProfileMutation.isPending) && { color: COLORS.textSecondary }
              ]}>
                Dodaj novi jezik
              </Text>
            </TouchableOpacity>
          )}
          <View style={styles.chipContainer}>
            {allLanguages.map(renderLanguageItem)}
          </View>
        </ScrollView>
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
  headerButton: { padding: wp(1.5) },
  headerTitle: {
    fontSize: RF(18), fontWeight: 'bold', color: COLORS.textPrimary, flex: 1, textAlign: 'center', marginHorizontal: wp(2),
  },
  saveButtonTextHeader: { fontSize: RF(16), fontWeight: '600' },
  
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollViewContentContainer: {
    flexGrow: 1,
    padding: wp(5),
    backgroundColor: COLORS.background,
    paddingBottom: Platform.OS === 'ios' ? wp(5) : wp(10),
  },
  selectedCount: {
    textAlign: 'center', fontSize: RF(16), color: COLORS.textPrimary, marginBottom: wp(4), fontWeight: 'bold',
  },
  addLanguageButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: wp(4), borderRadius: 12, backgroundColor: COLORS.cardBackground, marginBottom: wp(4),
    borderColor: COLORS.border, borderWidth: 1,
    ...Platform.select({ ios: { shadowColor: COLORS.textPrimary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5 }, android: { elevation: 3 } }),
  },
  addLanguageButtonDisabled: { opacity: 0.5 },
  addLanguageText: { color: COLORS.primary, fontWeight: 'bold', marginLeft: wp(1.5), fontSize: RF(16) },
  inputContainer: { flexDirection: 'row', marginBottom: wp(4) },
  textInput: {
    flex: 1, borderColor: COLORS.border, borderWidth: 1, borderRadius: 12, padding: wp(4), fontSize: RF(16), color: COLORS.textPrimary, backgroundColor: COLORS.cardBackground,
    ...Platform.select({ ios: { shadowColor: COLORS.textPrimary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5 }, android: { elevation: 3 } }),
  },
  addButton: {
    backgroundColor: COLORS.primary, borderRadius: 12, padding: wp(4), marginLeft: wp(2), justifyContent: 'center', alignItems: 'center',
  },
  addButtonDisabled: { opacity: 0.6 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', alignItems: 'center' },
  languageChip: {
    backgroundColor: COLORS.cardBackground, borderRadius: 20, paddingHorizontal: wp(4), paddingVertical: wp(3), marginBottom: wp(3), marginHorizontal: wp(1), borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    ...Platform.select({ ios: { shadowColor: COLORS.textPrimary, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 }, android: { elevation: 2 } }),
  },
  languageChipSelected: { backgroundColor: COLORS.selectedChip, borderColor: COLORS.selectedChipBorder },
  languageChipDisabled: { opacity: 0.7 },
  chipText: { color: COLORS.textPrimary, fontSize: RF(14), fontWeight: '500' },
  chipTextSelected: { color: COLORS.primary, fontWeight: 'bold' },
  chipIcon: { marginLeft: wp(1.5) },
});

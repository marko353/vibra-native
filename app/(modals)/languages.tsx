import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert, // Using Alert for native environment
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
// Pretpostavljeni importi iz Expo/React Native okruženja:
import { useRouter, useLocalSearchParams } from 'expo-router';
// Importi za autentifikaciju i stanje profila:
import { useAuthContext } from '../../context/AuthContext'; // REAL IMPORT
// Importi za TanStack Query:
import { useMutation, useQueryClient } from '@tanstack/react-query'; // REAL IMPORT
import axios from 'axios'; // REAL IMPORT

// Konfiguracija i Konstante
const API_B = process.env.EXPO_PUBLIC_API_BASE_URL; // Pretpostavljena varijabla okruženja
const { width } = Dimensions.get('window');
const wp = (percentage: number) => (width * percentage) / 100;
const RF = (size: number) => size * (width / 375); // Responzivna font skala

const COLORS = {
  primary: '#E91E63',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  background: '#F8F8F8',
  cardBackground: '#FFFFFF',
  border: '#E0E0E0',
  white: '#FFFFFF',
  danger: '#DC3545',
  selectedChip: '#FFEBF1', // Light pink for selected background
  headerShadow: 'rgba(0, 0, 0, 0.08)',
};

const PREDEFINED_LANGUAGES: string[] = [
  'Srpski', 'Engleski', 'Nemački', 'Španski', 'Francuski', 'Italijanski', 'Ruski', 'Kineski', 'Japanski', 'Arapski',
];
const MAX_LANGUAGES = 4;

// Definisanje interfejsa za payload mutacije
interface MutationPayload {
  field: string;
  value: any; // Može biti string, string[], ili drugi tip zavisno od polja
}

// TIP: Definišemo UserProfile sa ključevima koje koristimo
interface UserProfile {
  languages: string[];
  bio: string | null | undefined; // Dodato za potrebe tipizacije pri setProfileField
  [key: string]: any;
}
// TIP: Pomoćni tip koji obuhvata polja koja ažuriramo
type UpdateableProfileField = 'languages' | 'bio';

// Mock implementacija useProfileContext je uklonjena radi čistoće i izbegavanja logova dupliranja.
// Oslanjamo se na vašu pravu implementaciju:
import { useProfileContext } from '../../context/ProfileContext'; 

export default function LanguagesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams(); 
  const { user } = useAuthContext();
  const { setProfileField } = useProfileContext(); 
  const queryClient = useQueryClient();
  
  // LOG: Inicijalizacija iz params
  const initialLanguages: string[] = useMemo(() => {
    let languages: string[] = [];
    if (typeof params.currentLanguages === 'string') {
        try {
            const parsed = JSON.parse(params.currentLanguages);
            languages = Array.isArray(parsed) ? (parsed as string[]).map(String) : [];
        } catch {
            languages = [];
        }
    } else if (Array.isArray(params.currentLanguages)) {
        languages = (params.currentLanguages as string[]).map(String);
    }
    console.log("LOG: [Languages] useMemo - Inicijalni jezici iz params:", languages);
    return languages;
  }, [params.currentLanguages]);


  // Lokalni state
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(initialLanguages); 
  
  const [newLanguage, setNewLanguage] = useState<string>('');
  const [showInput, setShowInput] = useState<boolean>(false);
  const textInputRef = useRef<TextInput>(null);

  // LOG: Provera promena
  const hasChanges = useMemo(() => {
    const sortedInitial = [...initialLanguages].sort();
    const sortedSelected = [...selectedLanguages].sort();
    const changed = JSON.stringify(sortedInitial) !== JSON.stringify(sortedSelected);
    console.log(`LOG: [Languages] useMemo - Promene detektovane: ${changed}, Trenutno: ${selectedLanguages.join(', ')}`);
    return changed;
  }, [initialLanguages, selectedLanguages]); 

  useEffect(() => {
    if (showInput) {
      const timeoutId = setTimeout(() => textInputRef.current?.focus(), 100);
      return () => clearTimeout(timeoutId);
    }
  }, [showInput]);

  const allLanguages: string[] = useMemo(() => {
    const customLanguages = selectedLanguages.filter(lang => 
        !PREDEFINED_LANGUAGES.some(predef => predef.toLowerCase() === lang.toLowerCase())
    );
    return Array.from(new Set([...PREDEFINED_LANGUAGES, ...customLanguages])).sort((a, b) => a.localeCompare(b));
  }, [selectedLanguages]);

  // Implementacija mutacije
  const updateProfileMutation = useMutation({
    mutationFn: async (payload: MutationPayload) => {
        if (!user?.token) throw new Error("Token nije dostupan");
        console.log("LOG: [Languages] MutationFn - Slanje payload-a:", payload);
        const res = await axios.put(`${API_B}/api/user/update-profile`, payload, {
            headers: { 
                Authorization: `Bearer ${user.token}`, 
                'Content-Type': 'application/json' 
            },
        });
        return res.data;
    },
    onSuccess: (data, variables) => {
        // FIKSIRANO: Kastovanje na UpdateableProfileField (koji uključuje 'languages')
        const fieldName = variables.field as UpdateableProfileField;
        const newValue = variables.value;

        // KORAK 1: Ažuriranje LOKALNOG Contexta (Brzo, sinhrono ažuriranje stanja)
        setProfileField(fieldName, newValue); 
        console.log(`LOG: [Languages] Mutacija USPEŠNA. Ažuriran context za polje: ${fieldName}.`);

        // KORAK 2: DIREKTNO AŽURIRANJE QUERY KEŠA (Optimistično ažuriranje)
        queryClient.setQueryData(['userProfile', user?.id], (oldData: any) => {
            if (!oldData) return oldData;
            const updatedData = { ...oldData, [fieldName]: newValue };
            console.log("LOG: [Languages] Mutacija USPEŠNA. Query keš AŽURIRAN.");
            return updatedData;
        });

        // KORAK 3: TRENUTNO AŽURIRANJE LOKALNOG STANJA MODALA
        // Ovo osigurava da korisnik vidi najnoviju promenu pre nego što se modal zatvori.
        setSelectedLanguages(newValue as string[]); 
        
        // KORAK 4: Zatvaranje modala
        router.back();
    },
    onError: (error: any) => {
        console.error("LOG: [LanguagesScreen] onError - Greška prilikom čuvanja:", error.response?.data || error.message);
        Alert.alert('Greška', `Došlo je do greške pri čuvanju jezika: ${error.response?.data?.message || error.message}`);
    }
  });

  const isLoading = updateProfileMutation.isPending; 

  const handleToggleLanguage = (language: string) => {
    if (isLoading) return;
    setSelectedLanguages(prev => {
      let newState: string[];
      if (prev.includes(language)) {
        newState = prev.filter(l => l !== language);
      } else {
        if (prev.length >= MAX_LANGUAGES) {
          Alert.alert('Limit je dostignut', `Možete odabrati maksimalno ${MAX_LANGUAGES} jezika.`);
          return prev;
        }
        newState = [...prev, language];
      }
      console.log("LOG: [Languages] Novi odabrani jezici:", newState);
      return newState;
    });
  };

  const handleAddLanguage = () => {
    if (isLoading) return;
    const trimmed = newLanguage.trim();
    if (!trimmed) return Alert.alert('Upozorenje', 'Unesite naziv jezika.');
    
    // Provere limita i duplikata...
    if (selectedLanguages.length >= MAX_LANGUAGES) {
        Alert.alert('Limit je dostignut', `Možete dodati maksimalno ${MAX_LANGUAGES} jezika.`);
        setNewLanguage('');
        Keyboard.dismiss();
        return;
    }
    if (allLanguages.some(l => l.toLowerCase() === trimmed.toLowerCase())) {
        Alert.alert('Upozorenje', 'Ovaj jezik je već dodat ili odabran.');
        setNewLanguage('');
        Keyboard.dismiss();
        return;
    }

    const newState = [...selectedLanguages, trimmed];
    setSelectedLanguages(newState);
    console.log("LOG: [Languages] Dodat novi jezik:", trimmed, "Ukupno:", newState);
    
    setNewLanguage('');
    setShowInput(false);
    Keyboard.dismiss();
  };

  const handleSave = () => {
    if (selectedLanguages.length === 0) {
        return Alert.alert('Upozorenje', 'Morate odabrati barem jedan jezik pre čuvanja.');
    }
    console.log("LOG: [Languages] Pokrenuto čuvanje. Vrednost za slanje:", selectedLanguages);
    updateProfileMutation.mutate({ field: 'languages', value: selectedLanguages });
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cardBackground} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} disabled={isLoading}>
          <Ionicons name="close-outline" size={RF(30)} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Uredi jezike</Text>
        <TouchableOpacity 
          style={styles.saveBtn}
          onPress={handleSave} 
          disabled={!hasChanges || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Text style={[styles.saveBtnText, { color: !hasChanges ? COLORS.textSecondary : COLORS.primary }]}>
              Sačuvaj
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.limitText}>
            Odabrano: {selectedLanguages.length} / {MAX_LANGUAGES}
          </Text>

          {showInput ? (
            <View style={styles.inputRow}>
              <TextInput
                ref={textInputRef}
                style={styles.input}
                placeholder="Unesite novi jezik"
                placeholderTextColor={COLORS.textSecondary}
                value={newLanguage}
                onChangeText={setNewLanguage}
                onSubmitEditing={handleAddLanguage}
                editable={!isLoading}
              />
              <TouchableOpacity 
                onPress={handleAddLanguage} 
                disabled={isLoading} 
                style={styles.addButton}
              >
                {isLoading ? <ActivityIndicator color={COLORS.white} /> : <Ionicons name="add" size={RF(24)} color={COLORS.white} />}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              onPress={() => setShowInput(true)} 
              disabled={selectedLanguages.length >= MAX_LANGUAGES || isLoading} 
              style={styles.addLanguageButton}
            >
              <Ionicons 
                name="add-circle-outline" 
                size={RF(22)} 
                color={selectedLanguages.length >= MAX_LANGUAGES || isLoading ? COLORS.textSecondary : COLORS.primary} 
              />
              <Text style={styles.addLanguageText}>Dodaj novi jezik</Text>
            </TouchableOpacity>
          )}

          <View style={styles.chipsContainer}>
            {allLanguages.map(lang => {
              const isSelected = selectedLanguages.includes(lang);
              return (
                <TouchableOpacity 
                  key={lang} 
                  onPress={() => handleToggleLanguage(lang)} 
                  disabled={isLoading} 
                  style={[
                    styles.chip, 
                    { 
                      borderColor: isSelected ? COLORS.primary : COLORS.border,
                      backgroundColor: isSelected ? COLORS.selectedChip : COLORS.cardBackground,
                    }
                  ]}
                >
                  <Text style={[styles.chipText, { color: isSelected ? COLORS.primary : COLORS.textPrimary }]}>
                    {lang}
                  </Text>
                  {isSelected && <Ionicons name="checkmark-circle-outline" size={RF(18)} color={COLORS.primary} style={styles.chipIcon} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: wp(2.5),
    paddingTop: Platform.select({ android: (StatusBar.currentHeight ?? 0) + wp(2), ios: wp(2.5) }),
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
      android: { elevation: 6 },
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
  scrollContent: {
    flexGrow: 1,
    padding: wp(5),
  },
  limitText: {
    textAlign: 'center',
    fontSize: RF(16),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: wp(4),
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: wp(4),
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: wp(4),
    fontSize: RF(16),
    color: COLORS.textPrimary,
    backgroundColor: COLORS.cardBackground,
  },
  addButton: {
    marginLeft: wp(2),
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: wp(4),
    justifyContent: 'center',
    alignItems: 'center',
  },
  addLanguageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: wp(4),
    borderRadius: 12,
    backgroundColor: COLORS.cardBackground,
    marginBottom: wp(4),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addLanguageText: {
    marginLeft: wp(1.5),
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: RF(16),
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: wp(3),
    margin: wp(1),
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: RF(14),
    fontWeight: '500',
  },
  chipIcon: {
    marginLeft: wp(1.5),
  }
});

// app/(modals)/diet.tsx - Implementacija kao standardni ekran

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  FlatList,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthContext } from '../../context/AuthContext';
import { useProfileContext } from '../../context/ProfileContext'; // <-- DODATO ZA AŽURIRANJE LOKALNOG CONTEXTA
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_B = process.env.EXPO_PUBLIC_API_BASE_URL;

const { width } = Dimensions.get('window');
const wp = (percentage: number) => (width * percentage) / 100;
const RF = (size: number) => size * (width / 375);

const COLORS = {
  primary: '#E91E63', // Akcentna ružičasta
  textPrimary: '#1A1A1A', // Tamni tekst
  textSecondary: '#6B7280', // Sekundarni sivi tekst
  background: '#F8F8F8', // Svetlo siva pozadina (opšti background)
  cardBackground: '#FFFFFF', // Bela pozadina za kartice/modale
  border: '#E0E0E0', // Svetla ivica
  white: '#FFFFFF', // Bela
  danger: '#DC3545', // Crvena za greške
  selectedChip: '#FFEBF1', // Svetlija nijansa primary boje za selektovane čipove
  selectedChipBorder: '#E91E63',
  headerShadow: 'rgba(0, 0, 0, 0.08)', // Definisana senka za header
};

const dietOptions = [
  { style: 'Svejed', description: 'Bez ograničenja u ishrani.' },
  { style: 'Vegetarijanac', description: 'Ne konzumira meso.' },
  { style: 'Vegan', description: 'Ne konzumira meso, mlečne proizvode i jaja.' },
  { style: 'Pesketarijanac', description: 'Konzumira ribu, ali ne i meso.' },
  { style: 'Fleksitarijanac', description: 'Pretežno vegetarijanac, povremeno konzumira meso.' },
  { style: 'Keto', description: 'Ishrana sa malo ugljenih hidrata, a mnogo masti.' },
  { style: 'Bez glutena', description: 'Izbegava gluten zbog alergije ili osetljivosti.' },
  { style: 'Halal', description: 'Po islamskim pravilima.' },
  { style: 'Kosher', description: 'Po jevrejskim pravilima.' },
  { style: 'Nije navedeno', description: 'Ne želim da navedem svoju ishranu.' },
];

// Tipizacija za ishranu
interface MutationPayload { field: string; value: any; }
type UpdateableProfileField = 'diet';
interface UserProfile { diet: string | null; [key: string]: any; }


export default function DietScreen() { // Preimenovano u DietScreen
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthContext();
  const { setProfileField } = useProfileContext(); // <-- DODATO ZA AŽURIRANJE LOKALNOG CONTEXTA
  const queryClient = useQueryClient();

  // Učitavanje početne opcije ishrane iz params-a
  const initialDiet: string = useMemo(() => {
    // Ako params.currentDiet postoji i string je, koristi ga, inače prazan string.
    return typeof params.currentDiet === 'string' ? params.currentDiet : '';
  }, [params.currentDiet]);

  const [selectedDiet, setSelectedDiet] = useState<string>(initialDiet);

  // Proverava da li je došlo do promene u odnosu na početnu opciju
  const hasChanges = useMemo(() => selectedDiet !== initialDiet, [selectedDiet, initialDiet]);

  // Resetuje stanje kada se ekran inicijalizuje ili kada se initialDiet promeni (mada se ne bi trebalo menjati)
  useEffect(() => {
    setSelectedDiet(initialDiet);
  }, [initialDiet]);

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: MutationPayload) => {
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
      const fieldName = 'diet' as const; // Eksplicitno kastovanje
      const newValue = variables.value;

      // KORAK A: AŽURIRANJE LOKALNOG CONTEXTA (Brza sinhronizacija)
      setProfileField(fieldName, newValue);
      
      // KORAK B: DIREKTNO AŽURIRANJE QUERY KEŠA (Optimistično ažuriranje)
      queryClient.setQueryData(['userProfile', user?.id], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          [fieldName]: newValue,
        };
      });

      // KORAK C: TRENUTNO AŽURIRANJE LOKALNOG STANJA MODALA (Vizuelna potvrda)
      setSelectedDiet(newValue);

      // KORAK D: Zatvaranje modala
      router.back();
    },
    onError: (error: any) => {
      console.error('Greška pri čuvanju opcije ishrane:', error.response?.data || error.message);
      Alert.alert('Greška', `Došlo je do greške prilikom čuvanja opcije ishrane: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleSave = () => {
    if (!selectedDiet) {
      Alert.alert('Greška', 'Molimo odaberite opciju za ishranu pre nego što sačuvate.');
      return;
    }
    if (!hasChanges || updateProfileMutation.isPending) return;
    updateProfileMutation.mutate({ field: 'diet', value: selectedDiet });
  };

  const renderItem = ({ item }: { item: { style: string; description: string } }) => {
    const isSelected = item.style === selectedDiet;
    return (
      <TouchableOpacity
        style={[
          styles.itemContainer,
          isSelected && styles.itemContainerSelected,
          updateProfileMutation.isPending && styles.itemContainerDisabled // Onemogući vizuelno tokom čuvanja
        ]}
        onPress={() => setSelectedDiet(item.style)}
        disabled={updateProfileMutation.isPending} // Onemogući klik tokom čuvanja
      >
        <Text style={[styles.itemTitle, isSelected && styles.itemTitleSelected]}>
          {item.style}
        </Text>
        <Text style={[styles.itemDescription, isSelected && styles.itemDescriptionSelected]}>
          {item.description}
        </Text>
        {isSelected && (
          <Ionicons
            name="checkmark-circle"
            size={RF(24)} // Responzivna veličina ikone
            color={COLORS.primary}
            style={styles.checkmarkIcon}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cardBackground} />

      {/* Header View */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} disabled={updateProfileMutation.isPending}>
          <Ionicons name="close-outline" size={RF(30)} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Način ishrane</Text>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={!hasChanges || updateProfileMutation.isPending || !selectedDiet} // Dodatno onemogućeno ako nema odabrane opcije
        >
          {updateProfileMutation.isPending ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Text style={[
              styles.saveBtnText,
              { color: (!hasChanges || !selectedDiet) ? COLORS.textSecondary : COLORS.primary } // Boja teksta
            ]}>
              Sačuvaj
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Content View */}
      <FlatList
        data={dietOptions}
        renderItem={renderItem}
        keyExtractor={(item) => item.style}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background, // Pozadina celog ekrana
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
  closeBtn: {
    padding: wp(1.5),
  },
  saveBtn: {
    padding: wp(1.5),
  },
  saveBtnText: {
    fontSize: RF(16),
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: RF(18),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: wp(2),
  },
  container: {
    padding: wp(5), // Responzivni padding
    paddingBottom: wp(10), // Malo više paddinga na dnu za FlatList
    backgroundColor: COLORS.background,
  },
  itemContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RF(15), // Responzivni border radius
    padding: wp(5), // Responzivni padding
    marginBottom: wp(3), // Responzivni margin
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
    shadowColor: '#000', // Diskretna senka
    shadowOffset: { width: 0, height: RF(1) },
    shadowOpacity: 0.05,
    shadowRadius: RF(3),
    elevation: 2,
  },
  itemContainerSelected: {
    borderColor: COLORS.selectedChipBorder,
    backgroundColor: COLORS.selectedChip,
    shadowColor: COLORS.selectedChipBorder,
    shadowOffset: { width: 0, height: RF(4) }, // Jača senka
    shadowOpacity: 0.1,
    shadowRadius: RF(10),
    elevation: 5,
  },
  itemContainerDisabled: {
    opacity: 0.6, // Smanjena neprozirnost kada je onemogućeno
  },
  itemTitle: {
    fontSize: RF(18), // Responzivni font size
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  itemTitleSelected: {
    color: COLORS.primary,
  },
  itemDescription: {
    fontSize: RF(14), // Responzivni font size
    color: COLORS.textSecondary, // Sekundarna boja za opis
    marginTop: wp(1), // Responzivni margin
  },
  itemDescriptionSelected: {
    color: COLORS.textSecondary, // Ostaje ista boja za opis i kada je selektovano
  },
  checkmarkIcon: {
    position: 'absolute',
    right: wp(4), // Responzivna pozicija
    top: wp(4), // Responzivna pozicija
  },
});

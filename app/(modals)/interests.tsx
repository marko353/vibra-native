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
  FlatList, // Koristi se FlatList iz originalnog koda
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthContext } from '../../context/AuthContext';
import { useProfileContext } from '../../context/ProfileContext'; // DODATO
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// Konfiguracija i Konstante
const API_B = process.env.EXPO_PUBLIC_API_BASE_URL; 
const { width } = Dimensions.get('window');
const wp = (percentage: number) => (width * percentage) / 100;
const RF = (size: number) => size * (width / 375);

// Podaci o interesovanjima iz vašeg koda:
const interestsData = [
  {
    category: 'Društveni sadržaj',
    tags: [
      'Volontiranje', 'Edukacija', 'Politika', 'Aktivizam', 'Jednakost', 'Inkluzija', 'Zabava',
      'Podkast', 'Društvene mreže', 'Umetnost', 'Kultura', 'Karijera', 'Mentorstvo',
      'Networking', 'Kritičko razmišljanje', 'Filantropija', 'Humanitarni rad',
      'Timski rad', 'Debate', 'Društvene nauke',
    ],
  },
  {
    category: 'Hrana i piće',
    tags: [
      'Gurman/ka', 'Bezalkoholni kokteli', 'Slatkiši', 'Suši', 'Kuvarski kursevi',
      'Veganska kuhinja', 'Kafa', 'Čaj', 'Vino', 'Pivo', 'Zdrava ishrana', 'Fast Food',
      'Roštilj', 'Kuvanje', 'Pekara', 'Restorani', 'Miksologija', 'Domaća kuhinja',
      'Egzotična hrana', 'Hrana za dušu',
    ],
  },
  {
    category: 'Izlasci',
    tags: [
      'Izlasci', 'Barovi', 'Muzeji', 'Pozorište', 'Bioskop', 'Koncerti',
      'Noćni život', 'Festivali', 'Stand-up komedija', 'Kafane', 'Pubovi',
      'Karaoke', 'Plesni klubovi', 'Grupni izlasci', 'Spontani izlasci',
      'Brunch', 'Restorani', 'Umetničke galerije', 'Događaji', 'Žurke',
    ],
  },
  {
    category: 'Kreativnost',
    tags: [
      'Fotografija', 'Moda', 'Patike', 'Slikanje', 'Crtanje', 'Dizajn', 'Pisanje',
      'Keramika', 'DIY projekti', 'Digitalna umetnost', 'Grafički dizajn', 'Poezija',
      'Skulptura', 'Arhitektura', 'Web dizajn', 'Video produkcija', 'Animacija',
      'Tattoo umetnost', 'Kaligrafija', 'Origami',
    ],
  },
  {
    category: 'Muzika',
    tags: [
      'Rock', 'Pop', 'Soul', 'Techno', 'Hip-hop', 'Klasična muzika', 'Jazz',
      'Blues', 'Elektronska muzika', 'Indie', 'Pravljenje muzike', 'Punk',
      'Heavy metal', 'R&B', 'Latino', 'Reggae', 'Country', 'Folk', 'EDM',
      'Akustična muzika',
    ],
  },
  {
    category: 'Ostanak kod kuće',
    tags: [
      'Kućna varijanta', 'Čitanje', 'Kvizovi', 'Online kupovina', 'Društvene igre',
      'Filmovi i serije', 'Gaming', 'Kuvanje kod kuće', 'Organizacija doma',
      'Pletenje/Heklanje', 'Pravljenje koktela', 'Opusti se', 'Meditacija',
      'Slušanje muzike', 'Uređenje vrta', 'Čišćenje', 'Pisanje dnevnika',
      'Učenje novih veština', 'Pisanje',
    ],
  },
  {
    category: 'Priroda i avantura',
    tags: [
      'Priroda i avantura', 'Veslanje', 'Planinarenje', 'Jedrenje', 'Snoubording',
      'Kampovanje', 'Penjanje', 'Ronjenje', 'Biciklizam', 'Šetnja', 'Vožnja kajakom',
      'Lov', 'Ribolov', 'Istraživanje', 'Ekstremni sportovi', 'Surfing', 'Skijanje',
      'Jahanje konja', 'Speleologija', 'Geocaching',
    ],
  },
  {
    category: 'Sport i fitnes',
    tags: [
      'Sport i fitnes', 'Atletika', 'Ragbi', 'Jogiranje', 'Tenis', 'Košarka',
      'Plivanje', 'Joga', 'Teretana', 'Fudbal', 'Borilačke veštine', 'Ples',
      'Gimnastika', 'Odbojka', 'Krosfit', 'Pilates', 'Treking', 'Boks',
      'Badminton',
    ],
  },
  {
    category: 'TV i Filmovi',
    tags: [
      'Akcioni', 'Dokumentarci', 'Serije', 'Rijaliti', 'Anime', 'Horor', 'Komedija',
      'Drama', 'Triler', 'SF', 'Fantazija', 'Crtani filmovi', 'Misterija',
      'Krimi', 'Romantični', 'Klasični filmovi', 'Špijunski', 'Istorijski',
      'Western', 'Muzički',
    ],
  },
  {
    category: 'Vrednosti i ciljevi',
    tags: [
      'Mentalno zdravlje', 'Feminizam', 'Pride', 'Samopomoć', 'Lični razvoj',
      'Spiritualnost', 'Minimalizam', 'Održivi život', 'Zdravlje', 'Fizičko zdravlje',
      'Terapija', 'Mindfulness', 'Filozofija', 'Politički stavovi', 'Religija',
      'Prava životinja', 'Ekološka svest', 'Ekonomija', 'Finansijska pismenost',
      'Sloboda izražavanja',
    ],
  },
  {
    category: 'Zdravlje i blagostanje',
    tags: [
      'Nega kože', 'Astrologija', 'Svesnost', 'Meditacija', 'Ishrana',
      'Alternativna medicina', 'Trening snage', 'Fleksibilnost', 'Joga',
      'Pilates', 'Trčanje', 'Šetnja', 'Kvalitetan san', 'Hidratacija',
      'Vežbe disanja', 'Dijetologija', 'Dermatologija', 'Masaža',
      'Psihoterapija', 'Wellness',
    ],
  },
];

const MAX_INTERESTS_PER_CATEGORY = 5;
const MAX_TOTAL_INTERESTS = 15; // Možete postaviti i ukupan limit ako želite

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

// Tipizacija
interface MutationPayload { field: string; value: any; }
type UpdateableProfileField = 'languages' | 'bio' | 'interests'; 
interface UserProfile { interests: string[]; [key: string]: any; } // Dodato za setQueryData

export default function InterestsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthContext();
  const { setProfileField } = useProfileContext(); // Korišćenje za trenutno ažuriranje
  const queryClient = useQueryClient();

  // 1. Inicijalizacija iz params
  const initialInterests: string[] = useMemo(() => {
    if (typeof params.currentInterests === 'string') {
      try {
        const parsed = JSON.parse(params.currentInterests);
        return Array.isArray(parsed) ? (parsed as string[]).map(String) : [];
      } catch (e) {
        console.error("Failed to parse currentInterests param:", e);
        return [];
      }
    }
    if (Array.isArray(params.currentInterests)) {
      return (params.currentInterests as string[]).map(String);
    }
    return [];
  }, [params.currentInterests]);

  const [selectedTags, setSelectedTags] = useState<string[]>(initialInterests);

  // 2. Provera promena
  const hasChanges = useMemo(() => {
    const sortedInitial = [...initialInterests].sort();
    const sortedSelected = [...selectedTags].sort();
    return JSON.stringify(sortedInitial) !== JSON.stringify(sortedSelected);
  }, [initialInterests, selectedTags]);

  // 3. Mutacija sa optimističnim ažuriranjem
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
      const fieldName = variables.field as UpdateableProfileField;
      const newValue = variables.value;
      
      // KORAK A: DIREKTNO AŽURIRANJE QUERY KEŠA (OPTIMISTIČNO)
      queryClient.setQueryData(['userProfile', user?.id], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          [fieldName]: newValue,
        };
      });

      // KORAK B: AŽURIRANJE LOKALNOG CONTEXTA
      setProfileField(fieldName, newValue as UserProfile['interests']); 

      // KORAK C: TRENUTNO AŽURIRANJE LOKALNOG STANJA MODALA (vizuelna potvrda)
      setSelectedTags(newValue as string[]);

      // KORAK D: Zatvaranje modala
      router.back();
    },
    onError: (error: any) => {
      console.error('Greška pri čuvanju interesovanja:', error.response?.data || error.message);
      Alert.alert('Greška', `Došlo je do greške prilikom čuvanja interesovanja: ${error.response?.data?.message || error.message}`);
    },
  });

  const toggleTag = (tag: string, category: string) => {
    if (updateProfileMutation.isPending) return;
    setSelectedTags((prev) => {
      const isSelected = prev.includes(tag);
      let newState: string[];

      if (isSelected) {
        newState = prev.filter((t) => t !== tag);
      } else {
        // Logika ograničenja po kategoriji
        const categoryTags = interestsData.find(c => c.category === category)?.tags || [];
        const selectedInCategory = prev.filter(t => categoryTags.includes(t));

        if (selectedInCategory.length >= MAX_INTERESTS_PER_CATEGORY) {
          Alert.alert(
            'Limit je dostignut',
            `Možete odabrati maksimalno ${MAX_INTERESTS_PER_CATEGORY} interesovanja u kategoriji "${category}".`
          );
          return prev;
        }

        // Provera ukupnog limita
        if (prev.length >= MAX_TOTAL_INTERESTS) {
             Alert.alert(
              'Ukupan limit je dostignut',
              `Možete odabrati maksimalno ${MAX_TOTAL_INTERESTS} interesovanja ukupno.`
            );
            return prev;
        }

        newState = [...prev, tag];
      }
      return newState;
    });
  };

  const handleSave = () => {
    if (!hasChanges || updateProfileMutation.isPending) return;
    updateProfileMutation.mutate({ field: 'interests', value: selectedTags });
  };

  const renderTagItem = (tag: string, category: string) => {
    const isSelected = selectedTags.includes(tag);
    return (
      <TouchableOpacity
        key={tag}
        style={[
          styles.interestChip,
          isSelected && styles.interestChipSelected,
          updateProfileMutation.isPending && styles.interestChipDisabled
        ]}
        onPress={() => toggleTag(tag, category)}
        disabled={updateProfileMutation.isPending}
      >
        <Text
          style={[
            styles.chipText,
            isSelected && styles.chipTextSelected,
          ]}
        >
          {tag}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark-circle-outline" size={RF(18)} color={COLORS.primary} style={styles.chipIcon} />
        )}
      </TouchableOpacity>
    );
  };

  const renderCategory = ({
    item,
  }: {
    item: { category: string; tags: string[] }
  }) => {
    const selectedInCategoryCount = selectedTags.filter(t => item.tags.includes(t)).length;
    return (
      <View key={item.category} style={styles.categorySection}>
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryTitle}>{item.category}</Text>
          <Text style={styles.selectedInCategoryCount}>
            ({selectedInCategoryCount}/{MAX_INTERESTS_PER_CATEGORY})
          </Text>
        </View>
        <View style={styles.tagsContainer}>
          {item.tags.map((tag) => renderTagItem(tag, item.category))}
        </View>
      </View>
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
        <Text style={styles.headerTitle}>Interesovanja</Text>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={!hasChanges || updateProfileMutation.isPending}
        >
          {updateProfileMutation.isPending ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Text style={[
              styles.saveBtnText,
              { color: (!hasChanges) ? COLORS.textSecondary : COLORS.primary }
            ]}>
              Sačuvaj
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Content View */}
      <FlatList
        data={interestsData}
        renderItem={renderCategory}
        keyExtractor={(item) => item.category}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      />
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
    padding: wp(5),
    paddingBottom: wp(10),
    backgroundColor: COLORS.background,
  },
  categorySection: {
    marginBottom: wp(5),
    backgroundColor: COLORS.cardBackground,
    borderRadius: RF(12),
    padding: wp(4),
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: wp(3),
  },
  categoryTitle: {
    fontSize: RF(18),
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  selectedInCategoryCount: {
    fontSize: RF(14),
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
  },
  interestChip: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RF(20),
    paddingHorizontal: wp(4),
    paddingVertical: wp(3),
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.textPrimary,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  interestChipSelected: {
    backgroundColor: COLORS.selectedChip,
    borderColor: COLORS.selectedChipBorder,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  interestChipDisabled: {
    opacity: 0.6,
  },
  chipText: {
    color: COLORS.textPrimary,
    fontSize: RF(14),
    fontWeight: '500',
  },
  chipTextSelected: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  chipIcon: {
    marginLeft: wp(1.5),
  },
});

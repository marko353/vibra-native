// app/(modals)/drinks.tsx - Implementacija kao standardni ekran (bez react-native-modal)

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
import { useProfileContext } from '../../context/ProfileContext';
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

const drinkOptions = [
  { style: 'Pivopija', description: 'Uživam u različitim vrstama piva.' },
  { style: 'Ljubitelj vina', description: 'Preferiram čašu dobrog vina.' },
  { style: 'Koktel majstor', description: 'Volim mešane koktele i eksperimentisanje.' },
  { style: 'Samo kafa', description: 'Kafa je jedino piće koje mi treba.' },
  { style: 'Bezalkoholna pića', description: 'Uglavnom konzumiram sokove, čajeve i vodu.' },
  { style: 'Sve i svašta', description: 'Otvoren/a sam za sve vrste pića.' },
  { style: 'Ne pijem', description: 'Uopšte ne konzumiram alkohol.' },
];

interface MutationPayload { field: string; value: any; }
type UpdateableProfileField = 'drinks';
interface UserProfile { drinks: string | null; [key: string]: any; }


export default function DrinksScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthContext();
  const { setProfileField } = useProfileContext();
  const queryClient = useQueryClient();

  const initialDrinks: string = useMemo(() => {
    return typeof params.currentDrinks === 'string' ? params.currentDrinks : '';
  }, [params.currentDrinks]);

  const [selectedDrinks, setSelectedDrinks] = useState<string>(initialDrinks);

  const hasChanges = useMemo(() => selectedDrinks !== initialDrinks, [selectedDrinks, initialDrinks]);

  useEffect(() => {
    setSelectedDrinks(initialDrinks);
  }, [initialDrinks]);

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
      const fieldName = 'drinks' as const;
      const newValue = variables.value;

      setProfileField(fieldName, newValue);

      queryClient.setQueryData(['userProfile', user?.id], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          [fieldName]: newValue,
        };
      });

      setSelectedDrinks(newValue);

      router.back();
    },
    onError: (error: any) => {
      console.error('Greška pri čuvanju preferencija za piće:', error.response?.data || error.message);
      Alert.alert('Greška', `Došlo je do greške prilikom čuvanja preferencija za piće: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleSave = () => {
    if (!selectedDrinks) {
      Alert.alert('Greška', 'Molimo odaberite opciju za piće pre nego što sačuvate.');
      return;
    }
    if (!hasChanges || updateProfileMutation.isPending) return;
    updateProfileMutation.mutate({ field: 'drinks', value: selectedDrinks });
  };

  const renderItem = ({ item }: { item: { style: string; description: string } }) => {
    const isSelected = item.style === selectedDrinks;
    return (
      <TouchableOpacity
        style={[
          styles.itemContainer,
          isSelected && styles.itemContainerSelected,
          updateProfileMutation.isPending && styles.itemContainerDisabled
        ]}
        onPress={() => setSelectedDrinks(item.style)}
        disabled={updateProfileMutation.isPending}
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
            size={RF(24)}
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

      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} disabled={updateProfileMutation.isPending}>
          <Ionicons name="close-outline" size={RF(30)} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Piće</Text>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={!hasChanges || updateProfileMutation.isPending || !selectedDrinks}
        >
          {updateProfileMutation.isPending ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Text style={[
              styles.saveBtnText,
              { color: (!hasChanges || !selectedDrinks) ? COLORS.textSecondary : COLORS.primary }
            ]}>
              Sačuvaj
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={drinkOptions}
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
    padding: wp(5),
    paddingBottom: wp(10),
    backgroundColor: COLORS.background,
  },
  itemContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RF(15),
    padding: wp(5),
    marginBottom: wp(3),
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: RF(1) },
    shadowOpacity: 0.05,
    shadowRadius: RF(3),
    elevation: 2,
  },
  itemContainerSelected: {
    borderColor: COLORS.selectedChipBorder,
    backgroundColor: COLORS.selectedChip,
    shadowColor: COLORS.selectedChipBorder,
    shadowOffset: { width: 0, height: RF(4) },
    shadowOpacity: 0.1,
    shadowRadius: RF(10),
    elevation: 5,
  },
  itemContainerDisabled: {
    opacity: 0.6,
  },
  itemTitle: {
    fontSize: RF(18),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  itemTitleSelected: {
    color: COLORS.primary,
  },
  itemDescription: {
    fontSize: RF(14),
    color: COLORS.textSecondary,
    marginTop: wp(1),
  },
  itemDescriptionSelected: {
    color: COLORS.textSecondary,
  },
  checkmarkIcon: {
    position: 'absolute',
    right: wp(4),
    top: wp(4),
  },
});

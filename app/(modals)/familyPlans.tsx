// app/(modals)/familyPlans.tsx - Implementacija kao standardni ekran
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_B = process.env.EXPO_PUBLIC_API_BASE_URL;

const { width } = Dimensions.get('window');
const wp = (percentage: number) => (width * percentage) / 100;
const RF = (size: number) => size * (width / 375);

const COLORS = {
  primary: '#E91E63', // Akcentna ružičasta
  textPrimary: '#1E1E1E', // Tamni tekst
  textSecondary: '#666666', // Sekundarni sivi tekst
  background: '#F0F2F5', // Svetlo siva pozadina
  cardBackground: '#FFFFFF', // Bela pozadina za kartice
  border: '#E0E0E0', // Svetla ivica
  white: '#FFFFFF',
  selectedChip: '#FFEBF1', // Svetlija nijansa primary boje za selektovane čipove
  selectedChipBorder: '#E91E63',
  headerShadow: 'rgba(0, 0, 0, 0.08)', // Definisana senka za header
};

const familyPlanOptions = [
  { style: 'Želim decu', description: 'Jasna želja da imam decu u budućnosti.' },
  { style: 'Ne želim decu', description: 'Jasna odluka da ne želim decu.' },
  { style: 'Nisam siguran/na', description: 'Nisam još doneo/donela odluku.' },
  { style: 'Imam decu', description: 'Već imam decu.' },
];

export default function FamilyPlansScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const initialFamilyPlans: string = useMemo(() => {
    return typeof params.currentFamilyPlans === 'string' ? params.currentFamilyPlans : '';
  }, [params.currentFamilyPlans]);

  const [selectedFamilyPlans, setSelectedFamilyPlans] = useState<string>(initialFamilyPlans);

  const hasChanges = useMemo(() => selectedFamilyPlans !== initialFamilyPlans, [selectedFamilyPlans, initialFamilyPlans]);

  useEffect(() => {
    setSelectedFamilyPlans(initialFamilyPlans);
  }, [initialFamilyPlans]);

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
      console.error('Greška pri čuvanju porodičnih planova:', error.response?.data || error.message);
      Alert.alert('Greška', `Došlo je do greške prilikom čuvanja porodičnih planova: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleSave = () => {
    if (!selectedFamilyPlans) {
      Alert.alert('Greška', 'Molimo odaberite opciju za porodične planove pre nego što sačuvate.');
      return;
    }
    if (!hasChanges || updateProfileMutation.isPending) return;
    updateProfileMutation.mutate({ field: 'familyPlans', value: selectedFamilyPlans });
  };

  const renderItem = ({ item }: { item: { style: string; description: string } }) => {
    const isSelected = item.style === selectedFamilyPlans;
    return (
      <TouchableOpacity
        style={[
          styles.itemContainer,
          isSelected && styles.itemContainerSelected,
          updateProfileMutation.isPending && styles.itemContainerDisabled
        ]}
        onPress={() => setSelectedFamilyPlans(item.style)}
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

      {/* Header View */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} disabled={updateProfileMutation.isPending}>
          <Ionicons name="close-outline" size={RF(30)} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Porodični planovi</Text>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={!hasChanges || updateProfileMutation.isPending || !selectedFamilyPlans}
        >
          {updateProfileMutation.isPending ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Text style={[
              styles.saveBtnText,
              { color: (!hasChanges || !selectedFamilyPlans) ? COLORS.textSecondary : COLORS.primary }
            ]}>
              Sačuvaj
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Content View */}
      <FlatList
        data={familyPlanOptions}
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
    color: COLORS.textPrimary,
  },
  checkmarkIcon: {
    position: 'absolute',
    right: wp(4),
    top: wp(4),
  },
});
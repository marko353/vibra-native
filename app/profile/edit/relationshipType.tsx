import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const preferences = [
  {
    id: 'fun',
    label: 'Kratka zabava',
    emoji: '🎉',
    color: '#FFD166',
  },
  {
    id: 'serious',
    label: 'Ozbiljna veza',
    emoji: '❤️',
    color: '#EF476F',
  },
  {
    id: 'friends',
    label: 'Novi prijatelji',
    emoji: '🧑‍🤝‍🧑',
    color: '#06D6A0',
  },
  {
    id: 'unknown',
    label: 'Još ne znam',
    emoji: '🤔',
    color: '#118AB2',
  },
];

export default function RelationshipTypeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedRelationshipType, setSelectedRelationshipType] = useState<string | null>(null);

  useEffect(() => {
    if (params.currentRelationshipType) {
      setSelectedRelationshipType(String(params.currentRelationshipType));
    }
  }, [params.currentRelationshipType]);

  const handleSelect = (item: typeof preferences[0]) => {
    setSelectedRelationshipType(item.label);
  };

  const handleSave = () => {
    if (selectedRelationshipType !== null) {
      // PROMENA: Umesto setParams/back, koristi se direktan push sa parametrima
      router.push({
        pathname: '/profile/edit-profile',
        params: { updatedRelationshipType: selectedRelationshipType },
      });
    }
  };

  const renderItem = ({ item }: { item: typeof preferences[0] }) => (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: item.color },
        selectedRelationshipType === item.label && styles.selectedCard,
      ]}
      onPress={() => handleSelect(item)}
    >
      <Text style={styles.emoji}>{item.emoji}</Text>
      <Text style={styles.label}>{item.label}</Text>
      {selectedRelationshipType === item.label && (
        <Ionicons name="checkmark-circle" size={24} color="white" style={styles.checkmarkIcon} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color="#ff2f06" />
      </TouchableOpacity>

      <Text style={styles.title}>Šta tražiš na ovoj aplikaciji?</Text>
      <FlatList
        data={preferences}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Sačuvaj</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? 50 : 0,
  },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 30 : 50,
    left: 20,
    zIndex: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    marginTop: 20,
  },
  list: {
    justifyContent: 'center',
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedCard: {
    borderWidth: 3,
    borderColor: '#3498db',
  },
  emoji: {
    fontSize: 42,
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#fff',
  },
  checkmarkIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  saveButton: {
    backgroundColor: '#ff2f06',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 'auto',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
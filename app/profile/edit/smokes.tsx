import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Opcije za status pušenja
const smokeOptions = [
  'Nepušač',
  'Pušač',
  'Povremeni pušač',
  'Prestanak',
];

export default function SmokesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // Inicijalizacija stanja sa primljenim parametrima
  useEffect(() => {
    if (params.currentSmokes) {
      const status = params.currentSmokes as string;
      if (smokeOptions.includes(status)) {
        setSelectedStatus(status);
      }
    }
  }, [params.currentSmokes]);

  const handleSave = () => {
    if (selectedStatus) {
      // Koristimo router.replace za povratak i prenošenje podataka
      router.replace({
        pathname: '/profile/edit-profile',
        params: { updatedSmokes: selectedStatus },
      });
    } else {
      router.back();
    }
  };

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

      <Text style={styles.title}>Pušenje</Text>
      <Text style={styles.subtitle}>Kako biste opisali svoje navike pušenja?</Text>

      <View style={styles.optionsContainer}>
        {smokeOptions.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.optionButton,
              selectedStatus === option && styles.selectedOptionButton,
            ]}
            onPress={() => setSelectedStatus(option)}
          >
            <Text
              style={[
                styles.optionText,
                selectedStatus === option && styles.selectedOptionText,
              ]}
            >
              {option}
            </Text>
            {selectedStatus === option && (
              <Ionicons name="checkmark-circle" size={24} color="#ff2f06" />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
      >
        <Text style={styles.saveButtonText}>Sačuvaj</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    paddingTop: Platform.OS === 'android' ? 50 : 0,
  },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 30 : 50,
    left: 20,
    zIndex: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    marginTop: 20,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  optionsContainer: {
    paddingHorizontal: 20,
    flex: 1,
  },
  optionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedOptionButton: {
    borderWidth: 2,
    borderColor: '#ff2f06',
  },
  optionText: {
    fontSize: 18,
    color: '#333',
  },
  selectedOptionText: {
    fontWeight: 'bold',
    color: '#ff2f06',
  },
  saveButton: {
    backgroundColor: '#ff2f06',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: Platform.OS === 'android' ? 20 : 30,
    marginTop: 'auto',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
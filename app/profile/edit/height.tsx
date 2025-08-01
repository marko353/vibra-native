import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

export default function HeightScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedHeight, setSelectedHeight] = useState<number>(
    params.currentHeight ? parseInt(String(params.currentHeight)) : 170
  );

  useEffect(() => {
    if (params.currentHeight && typeof params.currentHeight === 'string') {
      const height = parseInt(params.currentHeight);
      if (!isNaN(height)) {
        setSelectedHeight(height);
      }
    }
  }, [params.currentHeight]);

  const handleSave = () => {
    if (selectedHeight < 120 || selectedHeight > 220) {
      Alert.alert('Greška', 'Molimo unesite validnu visinu (npr. između 120 i 220 cm).');
      return;
    }

    // Sada koristimo router.back() sa parametrima
    // Ovo će se vratiti na prethodnu stranu (edit-profile)
    // i preneti updatedHeight kao parametar
    router.replace({
      pathname: '/profile/edit-profile', // Ispravljena putanja
      params: { updatedHeight: selectedHeight.toString() },
    });
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

      <Text style={styles.title}>Koliko si visok/a?</Text>

      <View style={styles.contentContainer}>
        <Text style={styles.heightValue}>{selectedHeight} cm</Text>
        <Slider
          style={styles.slider}
          minimumValue={120}
          maximumValue={220}
          step={1}
          value={selectedHeight}
          onValueChange={setSelectedHeight}
          minimumTrackTintColor="#ff2f06"
          maximumTrackTintColor="#d3d3d3"
          thumbTintColor="#ff2f06"
        />
        <Text style={styles.sliderLabel}>Pomeri klizač da odabereš visinu</Text>
      </View>

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
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  heightValue: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#ff2f06',
    marginBottom: 30,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabel: {
    fontSize: 16,
    color: '#888',
    marginTop: 10,
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
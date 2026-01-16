import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Slider from '@react-native-community/slider';

interface LikeFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: { ageRange: [number, number]; distance: number; gender: string }) => void;
  initialFilters?: { ageRange: [number, number]; distance: number; gender: string };
}

export default function LikeFilterModal({ visible, onClose, onApply, initialFilters }: LikeFilterModalProps) {
  const [ageRange, setAgeRange] = useState<[number, number]>(initialFilters?.ageRange || [18, 99]);
  const [distance, setDistance] = useState<number>(initialFilters?.distance || 50);
  const [gender, setGender] = useState<string>(initialFilters?.gender || 'any');

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Filter</Text>

          <Text style={styles.label}>Godine</Text>
          <View style={styles.row}>
            <Text>{ageRange[0]}</Text>
            <Slider
              style={{ flex: 1 }}
              minimumValue={18}
              maximumValue={99}
              value={ageRange[0]}
              onValueChange={(val: number) => setAgeRange([Math.round(val), ageRange[1]])}
            />
            <Text>{ageRange[1]}</Text>
            <Slider
              style={{ flex: 1 }}
              minimumValue={18}
              maximumValue={99}
              value={ageRange[1]}
              onValueChange={(val: number) => setAgeRange([ageRange[0], Math.round(val)])}
            />
          </View>

          <Text style={styles.label}>Udaljenost (km)</Text>
          <Slider
            minimumValue={1}
            maximumValue={200}
            value={distance}
            onValueChange={(val: number) => setDistance(Math.round(val))}
          />
          <Text>{distance} km</Text>

          <Text style={styles.label}>Pol</Text>
          <Picker
            selectedValue={gender}
            onValueChange={val => setGender(val)}
            style={styles.picker}
          >
            <Picker.Item label="Bilo koji" value="any" />
            <Picker.Item label="Muški" value="male" />
            <Picker.Item label="Ženski" value="female" />
          </Picker>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text>Odustani</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.applyButton]}
              onPress={() => onApply({ ageRange, distance, gender })}
            >
              <Text style={{ color: '#fff' }}>Primeni</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    elevation: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  picker: {
    marginVertical: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#eee',
    minWidth: 100,
    alignItems: 'center',
  },
  applyButton: {
    backgroundColor: '#FF6B6B',
  },
});

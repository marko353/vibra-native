// app/components/LocationToggleCard.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#5B41F5',
  background: '#F0F2F5',
  cardBackground: '#FFFFFF',
  textPrimary: '#1E1E1E',
  textSecondary: '#666666',
  placeholder: '#A0A0A0',
  border: '#E0E0E0',
  onColor: '#4CAF50', // Zelena boja za "On"
  offColor: '#9E9E9E', // Siva boja za "Off"
};

interface LocationToggleCardProps {
  onToggle: () => void;
  isToggleEnabled: boolean;
  value: string | null;
}

const LocationToggleCard: React.FC<LocationToggleCardProps> = ({ onToggle, isToggleEnabled, value }) => {
  return (
    <TouchableOpacity onPress={onToggle} style={styles.sectionCard}>
      <View style={styles.infoCard}>
        <View style={styles.subSectionContent}>
          <View style={styles.subSectionLeft}>
            <Ionicons name="location-outline" size={20} color={COLORS.textPrimary} style={styles.subSectionItemIcon} />
            <Text style={styles.subSectionItemText}>Živi u</Text>
          </View>
          <View style={styles.subSectionRight}>
            <Text style={styles.subSectionValueText}>
              {value || 'Dodaj'}
            </Text>
            <Text style={[styles.statusText, isToggleEnabled ? styles.onText : styles.offText]}>
              {isToggleEnabled ? 'On' : 'Off'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} style={styles.chevronIcon} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 15,
    paddingVertical: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  subSectionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subSectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subSectionRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subSectionItemIcon: {
    marginRight: 10,
  },
  subSectionItemText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  subSectionValueText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginRight: 5,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
    marginRight: 5,
  },
  onText: {
    color: COLORS.onColor,
  },
  offText: {
    color: COLORS.offColor,
  },
  chevronIcon: {
    marginLeft: 5,
    color: COLORS.textSecondary,
  },
});

export default LocationToggleCard;
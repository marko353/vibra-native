import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#E91E63',
  accent: '#007AFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  background: '#F8F8F8',
  cardBackground: '#FFFFFF',
  border: '#E0E0E0',
  placeholder: '#A0A0A0',
  shadow: 'rgba(0,0,0,0.08)',
  onColor: '#4CAF50',
  offColor: '#9E9E9E',
};

interface LocationToggleCardProps {
  onToggle: () => void;
  isToggleEnabled: boolean;
  value: string | null;
}

const LocationToggleCard: React.FC<LocationToggleCardProps> = ({ onToggle, isToggleEnabled, value }) => {
  // Pomoćna funkcija za renderovanje vrednosti lokacije i statusa
  const renderLocationValue = () => {
    if (isToggleEnabled) {
      return (
        <>
          <Text style={styles.cardValue}>
            {value || 'Nepoznat grad'}
          </Text>
          <Text style={[styles.statusText, styles.onText]}>On</Text>
        </>
      );
    } else {
      return (
        <>
          <Text style={styles.cardValue}>Isključeno</Text>
          <Text style={[styles.statusText, styles.offText]}>Off</Text>
        </>
      );
    }
  };

  return (
    <TouchableOpacity
      onPress={onToggle}
      style={styles.cardContainer}
    >
      <View style={styles.cardIconAndContent}>
        <Ionicons name="location-outline" size={22} color={COLORS.textSecondary} style={styles.cardIcon} />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Živi u</Text>
          <View style={styles.valueRow}>
            {renderLocationValue()}
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderColor: COLORS.border,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  cardIconAndContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardIcon: {
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cardValue: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginRight: 5,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  onText: {
    color: COLORS.onColor,
  },
  offText: {
    color: COLORS.offColor,
  },
});

export default LocationToggleCard;

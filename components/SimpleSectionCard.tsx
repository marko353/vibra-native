import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  textPrimary: '#2c3e50',
  textSecondary: '#7f8c8d',
  cardBackground: '#ffffff',
  border: '#dddddd',
};

type IconNames = keyof typeof Ionicons.glyphMap;

interface SimpleSectionCardProps {
  iconName: IconNames;
  iconColor: string;
  title: string;
  value?: string | null | number | string[];
  onPress?: () => void;
  mode: 'edit' | 'view';
}

const SimpleSectionCard: React.FC<SimpleSectionCardProps> = ({ iconName, iconColor, title, value, onPress, mode }) => {
  const CardContent = (
    <View style={styles.infoCard}>
      <View style={styles.subSectionContent}>
        <View style={styles.subSectionLeft}>
          <Ionicons name={iconName} size={20} color={iconColor} style={styles.subSectionItemIcon} />
          <Text style={styles.subSectionItemText}>{title}</Text>
        </View>
        <View style={styles.subSectionRight}>
          <Text style={styles.subSectionValueText}>
            {Array.isArray(value) ? (value.length > 0 ? value.join(', ') : "Dodaj") : (value ? (typeof value === 'number' ? `${value} cm` : value) : "Dodaj")}
          </Text>
          {mode === 'edit' && <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} style={styles.chevronIcon} />}
        </View>
      </View>
    </View>
  );

  return (
    <TouchableOpacity onPress={onPress} style={styles.sectionCard}>
      {CardContent}
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
  chevronIcon: {
    marginLeft: 5,
    color: COLORS.textSecondary,
  },
});

export default SimpleSectionCard;
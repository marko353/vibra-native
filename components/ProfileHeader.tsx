import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Opcionalno: Možeš prebaciti ove boje u poseban fajl i uvoziti ih
const COLORS = {
  primary: '#E91E63',
  textPrimary: '#2c3e50',
  textSecondary: '#7f8c8d',
  cardBackground: '#ffffff',
  border: '#dddddd',
};

interface ProfileHeaderProps {
  title: string;
  onPressBack: () => void;
  mode?: 'edit' | 'view';
  onToggleEdit?: () => void;
  onToggleView?: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  title,
  onPressBack,
  mode,
  onToggleEdit,
  onToggleView
}) => {
  return (
    <View style={styles.fixedHeader}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={onPressBack}
      >
        <Ionicons name="arrow-back" size={28} color={COLORS.primary} />
      </TouchableOpacity>

      <View style={styles.headerContentContainer}>
        <Text style={styles.title}>{title}</Text>
        
        {mode && onToggleEdit && onToggleView && (
          <View style={styles.toggleButtons}>
            <TouchableOpacity onPress={onToggleEdit} style={styles.toggleBtn}>
              <Text style={[styles.toggleText, mode === 'edit' && styles.activeToggleText]}>
                Uredi
              </Text>
            </TouchableOpacity>
            <View style={styles.separator} />
            {/* Ovde je bila greska: dodata je zatvarajuca tag za TouchableOpacity */}
            <TouchableOpacity onPress={onToggleView} style={styles.toggleBtn}>
              <Text style={[styles.toggleText, mode === 'view' && styles.activeToggleText]}>
                Pregled
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fixedHeader: {
    backgroundColor: COLORS.cardBackground,
    paddingTop: Platform.OS === 'android' ? 10 : 50,
    paddingBottom: 10,
    paddingHorizontal: 20,
    zIndex: 1,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerContentContainer: {
    flex: 1,
    alignItems: 'center',
  },
  backBtn: {
    paddingVertical: 10,
    position: 'absolute',
    left: 20,
    top: Platform.OS === 'android' ? 10 : 50,
    zIndex: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 5,
  },
  toggleButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleBtn: {
    paddingVertical: 5,
    paddingHorizontal: 20,
  },
  toggleText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  activeToggleText: {
    color: COLORS.primary,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.primary,
  },
  separator: {
    height: 20,
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 10,
  },
});

export default ProfileHeader;
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  primary: '#E91E63',
  white: '#FFFFFF',
  textPrimary: '#1E1E1E',
  textSecondary: '#666666',
};

interface ProfileHeaderProps {
  onBackPress: () => void;
  mode: 'edit' | 'view';
  setMode: (mode: 'edit' | 'view') => void;
  onSettingsPress: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  onBackPress,
  mode,
  setMode,
  onSettingsPress,
}) => {
  const iconColor = mode === 'view' ? COLORS.white : COLORS.textPrimary;
  const toggleTextColor = mode === 'view' ? COLORS.white : COLORS.textSecondary;
  const activeToggleTextColor = COLORS.primary;

  // Izdvojena komponenta za dugmad da se ne ponavlja kod
  const ToggleButtons = () => (
    <View style={[styles.toggleButtonsContainer, mode === 'view' && styles.toggleButtonsTransparent]}>
      <TouchableOpacity
        onPress={() => setMode('edit')}
        style={[styles.toggleBtn, mode === 'edit' && styles.activeToggleBtn]}
      >
        <Text style={[styles.toggleText, { color: toggleTextColor }, mode === 'edit' && { color: activeToggleTextColor }]}>
          Uredi
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setMode('view')}
        style={[styles.toggleBtn, mode === 'view' && styles.activeToggleBtn]}
      >
        <Text style={[styles.toggleText, { color: toggleTextColor }, mode === 'view' && { color: activeToggleTextColor }]}>
          Pregled
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        {/* Levi deo hedera */}
        <View style={styles.sideContainer}>
          <TouchableOpacity style={styles.iconBtn} onPress={onBackPress}>
            <Ionicons name="arrow-back" size={28} color={iconColor} />
          </TouchableOpacity>
        </View>

        {/* Srednji, centralni deo hedera */}
        <View style={styles.centerContainer}>
          {mode === 'edit' && <ToggleButtons />}
        </View>

        {/* Desni deo hedera */}
        <View style={[styles.sideContainer, styles.alignRight]}>
          {mode === 'edit' ? (
            <TouchableOpacity style={styles.iconBtn} onPress={onSettingsPress}>
              <Ionicons name="settings-outline" size={24} color={iconColor} />
            </TouchableOpacity>
          ) : (
            <ToggleButtons />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56, // AŽURIRANO: Malo smanjena visina da se sve podigne
  },
  sideContainer: {
    width: 60,
    justifyContent: 'center',
  },
  alignRight: {
    alignItems: 'flex-end',
    width: 'auto',
    minWidth: 60,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtn: {
    padding: 8,
  },
  toggleButtonsContainer: {
    flexDirection: 'row',
    backgroundColor: '#EAEAEA',
    borderRadius: 20,
    padding: 3, // AŽURIRANO: Malo smanjen padding
  },
  toggleButtonsTransparent: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  toggleBtn: {
    paddingVertical: 4, // AŽURIRANO: Smanjen vertikalni padding
    paddingHorizontal: 10, // AŽURIRANO: Smanjen horizontalni padding
    borderRadius: 16,
  },
  activeToggleBtn: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  toggleText: {
    fontSize: 13, // AŽURIRANO: Malo smanjen font
    fontWeight: '600',
  },
});

export default ProfileHeader;


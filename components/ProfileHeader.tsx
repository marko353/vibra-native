import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  primary: '#ff7f00',
  white: '#FFFFFF',
  textPrimary: '#1a1a1a',
  textSecondary: '#999',
  border: '#ECECEC',
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
  const isView = mode === 'view';
  const iconColor = isView ? COLORS.white : COLORS.textPrimary;

  const ToggleButtons = () => (
    <View style={[styles.toggleContainer, isView && styles.toggleContainerView]}>
      <TouchableOpacity
        onPress={() => setMode('edit')}
        style={[styles.toggleBtn, mode === 'view' && styles.toggleBtnActive]}
        activeOpacity={0.8}
      >
        <Text style={[styles.toggleText, mode === 'view' && styles.toggleTextActive]}>
          Edit
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setMode('view')}
        style={[styles.toggleBtn, mode === 'edit' && styles.toggleBtnActive]}
        activeOpacity={0.8}
      >
        <Text style={[styles.toggleText, mode === 'edit' && styles.toggleTextActive]}>
          Preview
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
<SafeAreaView style={[styles.safeArea, { backgroundColor: mode === 'view' ? 'transparent' : 'transparent' }]}>
      <View style={styles.header}>

        <View style={styles.sideContainer}>
          <TouchableOpacity
            style={[styles.backBtn, isView && styles.backBtnView]}
            onPress={onBackPress}
            activeOpacity={0.8}
          >
            <AntDesign name="arrow-left" size={20} color={iconColor} />
          </TouchableOpacity>
        </View>

        <View style={styles.centerContainer}>
          {mode === 'edit' && <ToggleButtons />}
        </View>

        <View style={[styles.sideContainer, styles.alignRight]}>
          {mode === 'edit' ? (
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={onSettingsPress}
              activeOpacity={0.8}
            >
              <Ionicons name="settings-outline" size={20} color={COLORS.textPrimary} />
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
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 0,
    height: 56,
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
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  backBtnView: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toggleContainerView: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  toggleBtn: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 9,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  toggleTextActive: {
    color: COLORS.primary,
  },
});

export default ProfileHeader;
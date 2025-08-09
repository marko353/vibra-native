import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = {
  primary: '#E91E63',
  white: '#FFFFFF',
  black: '#000000',
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent']}
        style={styles.gradientOverlay}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={onPressBack}>
            <Ionicons name="arrow-back" size={28} color={COLORS.white} />
          </TouchableOpacity>
          
          {/* AŽURIRANI USLOV: Prikazuje tastere samo kada je mode 'edit'. */}
          {mode === 'edit' && onToggleEdit && onToggleView && (
            <View style={styles.toggleButtonsContainer}>
              <TouchableOpacity
                onPress={onToggleEdit}
                style={[styles.toggleBtn, mode === 'edit' && styles.activeToggleBtn]}
              >
                <Text style={[styles.toggleText, mode === 'edit' && styles.activeToggleText]}>
                  Uredi
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onToggleView}
                style={[styles.toggleBtn]}
              >
                <Text style={[styles.toggleText]}>
                  Pregled
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    top: 24,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  gradientOverlay: {
    height: 100,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 60,
  },
  iconBtn: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  toggleButtonsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 4,
  },
  toggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  activeToggleBtn: {
    backgroundColor: COLORS.white,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  activeToggleText: {
    color: COLORS.primary,
  },
});

export default ProfileHeader;
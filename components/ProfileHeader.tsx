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
  onBackPress: () => void;
  mode: 'edit' | 'view';
  onToggleMode: () => void;
  onSettingsPress: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  onBackPress,
  mode,
  onToggleMode,
  onSettingsPress,
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent']}
        style={styles.gradientOverlay}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={onBackPress}>
            <Ionicons name="arrow-back" size={28} color={COLORS.white} />
          </TouchableOpacity>

          {/* Dinamički kontejner za dugmad na desnoj strani */}
          <View style={[styles.rightSideContainer, mode === 'view' && styles.viewRightSideContainer]}>
            <View style={styles.toggleButtonsContainer}>
              <TouchableOpacity
                onPress={() => onToggleMode()}
                style={[styles.toggleBtn, mode === 'edit' && styles.activeToggleBtn]}
              >
                <Text style={[styles.toggleText, mode === 'edit' && styles.activeToggleText]}>
                  Uredi
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onToggleMode()}
                style={[styles.toggleBtn, mode === 'view' && styles.activeToggleBtn]}
              >
                <Text style={[styles.toggleText, mode === 'view' && styles.activeToggleText]}>
                  Pregled
                </Text>
              </TouchableOpacity>
            </View>

            {/* Dugme za podešavanja se prikazuje samo u "uredi" modu */}
            {mode === 'edit' && (
              <TouchableOpacity style={styles.iconBtn} onPress={onSettingsPress}>
                <Ionicons name="settings-outline" size={28} color={COLORS.white} />
              </TouchableOpacity>
            )}

            {/* OVAJ BLOK KODA JE IZBRISAN JER JE UZROKOVAO PRAZAN KRUG */}
            {/* {mode === 'view' && (
              <View style={styles.iconBtn} />
            )} */}
          </View>
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
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightSideContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewRightSideContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    marginRight: -10,
  },
  toggleButtonsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 3,
    marginRight: 10,
  },
  toggleBtn: {
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 16,
  },
  activeToggleBtn: {
    backgroundColor: COLORS.white,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  activeToggleText: {
    color: COLORS.primary,
  },
});

export default ProfileHeader;
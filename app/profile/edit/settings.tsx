import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthContext } from '../../../context/AuthContext';

// Definisanje palete boja za doslednost sa ostalim delovima aplikacije
const COLORS = {
  primary: '#E91E63',
  textPrimary: '#1E1E1E',
  textSecondary: '#666666',
  background: '#F0F2F5',
  cardBackground: '#FFFFFF',
  border: '#E0E0E0',
};

// Funkcionalna komponenta za ekran sa podešavanjima
export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuthContext();

  // Funkcija za navigaciju nazad
  const handleBackPress = () => {
    router.back();
  };

  // Asinhrona funkcija za odjavu korisnika
  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login'); // Preusmerava korisnika na ekran za prijavu
    } catch (error) {
      console.error("Greška prilikom odjave:", error);
    }
  };

  // Komponenta za pojedinačnu stavku u meniju podešavanja
  const SettingsItem = ({ title, onPress, iconName }: { title: string; onPress: () => void; iconName: keyof typeof Ionicons.glyphMap }) => (
    <TouchableOpacity style={styles.itemContainer} onPress={onPress}>
      <Ionicons name={iconName} size={24} color={COLORS.textPrimary} />
      <Text style={styles.itemTitle}>{title}</Text>
      <Ionicons name="chevron-forward-outline" size={24} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Podešavanja</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView style={styles.container}>
        
        {/* Sekcija za opšta podešavanja */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Opšte</Text>
          <View style={styles.card}>
            <SettingsItem title="Obaveštenja" onPress={() => console.log('Podešavanja obaveštenja')} iconName="notifications-outline" />
            <View style={styles.separator} />
            <SettingsItem title="Jezik aplikacije" onPress={() => console.log('Podešavanja jezika')} iconName="language-outline" />
          </View>
        </View>

        {/* Sekcija za privatnost */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privatnost</Text>
          <View style={styles.card}>
            <SettingsItem title="Ko može da me vidi" onPress={() => console.log('Podešavanja privatnosti')} iconName="eye-outline" />
            <View style={styles.separator} />
            <SettingsItem title="Blokirani korisnici" onPress={() => console.log('Lista blokiranih')} iconName="person-remove-outline" />
          </View>
        </View>

        {/* Sekcija za nalog */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nalog</Text>
          <View style={styles.card}>
            <SettingsItem title="Promeni lozinku" onPress={() => console.log('Promena lozinke')} iconName="lock-closed-outline" />
            <View style={styles.separator} />
            <SettingsItem title="Obriši nalog" onPress={() => console.log('Brisanje naloga')} iconName="trash-outline" />
          </View>
        </View>

        {/* Dugme za odjavu */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Odjavi se</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.cardBackground,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 15,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  itemTitle: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  logoutButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: COLORS.cardBackground,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

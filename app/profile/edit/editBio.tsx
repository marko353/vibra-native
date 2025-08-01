import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = {
  primary: '#FF5733',
  background: '#F0F2F5',
  cardBackground: '#FFFFFF',
  textPrimary: '#2C3E50',
  textSecondary: '#7F8C8D',
  border: '#E8E8E8',
};

export default function EditBioScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // ISPRAVKA: Explicitno proveravamo tip i konvertujemo u string ako je potrebno.
  // params.currentBio može biti string, string[] ili undefined.
  // TextInputu je potreban samo string.
  let initialBio = '';
  if (Array.isArray(params.currentBio)) {
    initialBio = params.currentBio.join(' ');
  } else if (typeof params.currentBio === 'string') {
    initialBio = params.currentBio;
  }
  const [bioText, setBioText] = useState(initialBio);

  const handleSave = () => {
    // Slanje ažurirane biografije nazad na glavni ekran za uređivanje
    router.push({
      pathname: '/profile/edit-profile',
      params: { updatedBio: bioText },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Uredi biografiju</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Sačuvaj</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.label}>Napiši nešto o sebi</Text>
          <LinearGradient
            colors={['#F7F9FB', '#ECF0F3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.inputContainer}
          >
            <TextInput
              style={styles.inputBox}
              placeholder="Npr. Volim prirodu, aktivna sam i obožavam dobru kafu..."
              placeholderTextColor={COLORS.textSecondary}
              multiline
              value={bioText}
              onChangeText={setBioText}
              maxLength={150}
              autoFocus={true}
            />
          </LinearGradient>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingTop: Platform.OS === 'android' ? 30 : 30,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  backButton: {
    padding: 5,
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    color: COLORS.cardBackground,
    fontWeight: 'bold',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  inputContainer: {
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputBox: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 15,
    padding: 15,
    minHeight: 200, // Veće polje za unos
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 16,
    color: COLORS.textPrimary,
    textAlignVertical: 'top',
  },
});

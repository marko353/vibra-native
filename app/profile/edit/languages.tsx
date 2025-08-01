import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  FlatList,
  TextInput,
  Keyboard,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const allAvailableLanguages = [
  'Srpski', 'Engleski', 'Nemački', 'Španski', 'Francuski', 'Italijanski',
  'Ruski', 'Kineski (mandarinski)', 'Arapski', 'Portugalski', 'Japanski',
  'Korejski', 'Turski', 'Grčki', 'Mađarski', 'Rumunski', 'Bugarski',
  'Hrvatski', 'Bosanski', 'Makedonski', 'Slovenački', 'Češki', 'Poljski',
  'Švedski', 'Norveški', 'Danski', 'Finski', 'Holandski', 'Albanski',
  'Ukrajinski', 'Hindi', 'Urdu', 'Bengalski', 'Vietnamski', 'Filipinski (Tagalog)',
  'Tajlandski', 'Indonežanski', 'Malajski', 'Hebrejski', 'Afrikans', 'Slovački',
  'Litvanski', 'Letonski', 'Estonski', 'Islandski', 'Irski', 'Velški',
  'Esperanto', 'Svahili', 'Amharski', 'Hausa', 'Joruba', 'Zulu',
  'Kazahstanski', 'Uzbekistanski', 'Tadžički', 'Kirgiski', 'Azerbejdžanski',
];

export default function LanguagesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filteredLanguages, setFilteredLanguages] = useState<string[]>(allAvailableLanguages);

  useEffect(() => {
    if (params.currentLanguages) {
      try {
        const parsedLanguages = JSON.parse(params.currentLanguages as string);
        if (Array.isArray(parsedLanguages)) {
          setSelectedLanguages(parsedLanguages);
        }
      } catch (e) {
        console.error("Failed to parse currentLanguages:", e);
      }
    }
  }, [params.currentLanguages]);

  useEffect(() => {
    if (searchText === '') {
      setFilteredLanguages(allAvailableLanguages);
    } else {
      setFilteredLanguages(
        allAvailableLanguages.filter((lang) =>
          lang.toLowerCase().includes(searchText.toLowerCase())
        )
      );
    }
  }, [searchText]);

  const toggleLanguage = (language: string) => {
    setSelectedLanguages((prevLanguages) => {
      if (prevLanguages.includes(language)) {
        return prevLanguages.filter((lang) => lang !== language);
      } else {
        return [...prevLanguages, language];
      }
    });
  };

  const handleSave = () => {
    Keyboard.dismiss();

    // PROMENA: Koristimo router.replace umesto router.navigate
    // i putanju 'profile/edit-profile'
    router.replace({
      pathname: '/profile/edit-profile',
      params: { updatedLanguages: JSON.stringify(selectedLanguages) },
    });
  };

  const renderChip = (language: string) => (
    <TouchableOpacity
      key={language}
      style={styles.selectedChip}
      onPress={() => toggleLanguage(language)}
    >
      <Text style={styles.selectedChipText}>{language}</Text>
      <Ionicons name="close-circle" size={16} color="#fff" style={styles.chipCloseIcon} />
    </TouchableOpacity>
  );

  const renderLanguageItem = ({ item }: { item: string }) => {
    const isSelected = selectedLanguages.includes(item);
    return (
      <TouchableOpacity
        style={[styles.languageListItem, isSelected && styles.selectedLanguageListItem]}
        onPress={() => toggleLanguage(item)}
      >
        <Text style={[styles.languageListItemText, isSelected && styles.selectedLanguageListItemText]}>
          {item}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color="#ff2f06" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color="#ff2f06" />
      </TouchableOpacity>

      <Text style={styles.title}>Jezici koje govorite</Text>
      <Text style={styles.subtitle}>Odaberi jezike koje govoriš</Text>

      <View style={styles.searchBarContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Pretraži jezike..."
          placeholderTextColor="#888"
          value={searchText}
          onChangeText={setSearchText}
          autoCapitalize="words"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearSearchBtn}>
            <Ionicons name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {selectedLanguages.length > 0 && (
        <View style={styles.selectedChipsContainer}>
          <Text style={styles.selectedChipsLabel}>Odabrani:</Text>
          <View style={styles.chipsWrapper}>
            {selectedLanguages.map(renderChip)}
          </View>
        </View>
      )}

      <FlatList
        data={filteredLanguages}
        keyExtractor={(item) => item}
        renderItem={renderLanguageItem}
        contentContainerStyle={styles.listContainer}
        keyboardShouldPersistTaps="handled"
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Sačuvaj</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    paddingTop: Platform.OS === 'android' ? 50 : 0,
  },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 30 : 50,
    left: 20,
    zIndex: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    marginTop: 20,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 15,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearSearchBtn: {
    marginLeft: 10,
  },
  selectedChipsContainer: {
    marginHorizontal: 20,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  selectedChipsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 10,
  },
  chipsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  selectedChip: {
    backgroundColor: '#ff2f06',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedChipText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  chipCloseIcon: {
    marginLeft: 5,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  languageListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedLanguageListItem: {
    borderWidth: 2,
    borderColor: '#ff2f06',
  },
  languageListItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  selectedLanguageListItemText: {
    fontWeight: 'bold',
    color: '#ff2f06',
  },
  saveButton: {
    backgroundColor: '#ff2f06',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: Platform.OS === 'android' ? 20 : 30,
    marginTop: 'auto',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
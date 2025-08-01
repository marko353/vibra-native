import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Podaci za interesovanja
const interestsData = [
  {
    category: 'Društveni sadržaj',
    tags: [
      'Volontiranje', 'Edukacija', 'Politika', 'Aktivizam', 'Jednakost', 'Inkluzija',
      'Zabava', 'Podkast', 'Društvene mreže', 'Umetnost', 'Kultura', 'Karijera',
      'Mentorstvo', 'Networking', 'Kritičko razmišljanje', 'Filantropija', 'Humanitarni rad',
      'Timski rad', 'Debate', 'Društvene nauke'
    ],
  },
  {
    category: 'Hrana i piće',
    tags: [
      'Gurman/ka', 'Bezalkoholni kokteli', 'Slatkiši', 'Suši', 'Kuvarski kursevi', 'Veganska kuhinja',
      'Kafa', 'Čaj', 'Vino', 'Pivo', 'Zdrava ishrana', 'Fast Food', 'Roštilj', 'Kuvanje',
      'Pekara', 'Restorani', 'Miksologija', 'Domaća kuhinja', 'Egzotična hrana', 'Hrana za dušu'
    ],
  },
  {
    category: 'Izlasci',
    tags: [
      'Izlasci', 'Barovi', 'Muzeji', 'Pozorište', 'Bioskop', 'Koncerti', 'Noćni život',
      'Festivali', 'Stand-up komedija', 'Kafane', 'Pubovi', 'Karaoke', 'Plesni klubovi',
      'Grupni izlasci', 'Spontani izlasci', 'Brunch', 'Restorani', 'Umetničke galerije',
      'Događaji', 'Žurke'
    ],
  },
  {
    category: 'Kreativnost',
    tags: [
      'Fotografija', 'Moda', 'Patike', 'Slikanje', 'Crtanje', 'Dizajn', 'Pisanje',
      'Keramika', 'DIY projekti', 'Digitalna umetnost', 'Grafički dizajn', 'Poezija',
      'Skulptura', 'Arhitektura', 'Web dizajn', 'Video produkcija', 'Animacija',
      'Tattoo umetnost', 'Kaligrafija', 'Origami'
    ],
  },
  {
    category: 'Muzika',
    tags: [
      'Rock', 'Pop', 'Soul', 'Techno', 'Hip-hop', 'Klasična muzika', 'Jazz', 'Blues',
      'Elektronska muzika', 'Indie', 'Pravljenje muzike', 'Punk', 'Heavy metal',
      'R&B', 'Latino', 'Reggae', 'Country', 'Folk', 'EDM', 'Akustična muzika'
    ],
  },
  {
    category: 'Ostanak kod kuće',
    tags: [
      'Kućna varijanta', 'Čitanje', 'Kvizovi', 'Online kupovina', 'Društvene igre',
      'Filmovi i serije', 'Gaming', 'Kuvanje kod kuće', 'Organizacija doma', 'Pletenje/Heklanje',
      'Pravljenje koktela', 'Opusti se', 'Meditacija', 'Slušanje muzike',
      'Uređenje vrta', 'Čišćenje', 'Pisanje dnevnika', 'Učenje novih veština', 'Pisanje'
    ],
  },
  {
    category: 'Priroda i avantura',
    tags: [
      'Priroda i avantura', 'Veslanje', 'Planinarenje', 'Jedrenje', 'Snoubording', 'Kampovanje',
      'Penjanje', 'Ronjenje', 'Biciklizam', 'Šetnja', 'Vožnja kajakom', 'Lov',
      'Ribolov', 'Istraživanje', 'Ekstremni sportovi', 'Surfing', 'Skijanje',
      'Jahanje konja', 'Speleologija', 'Geocaching'
    ],
  },
  {
    category: 'Sport i fitnes',
    tags: [
      'Sport i fitnes', 'Atletika', 'Ragbi', 'Jogiranje', 'Tenis', 'Košarka', 'Plivanje',
      'Joga', 'Teretana', 'Fudbal', 'Borilačke veštine', 'Ples', 'Gimnastika', 'Odbojka',
      'Krosfit', 'Pilates', 'Treking', 'Boks', 'Badminton'
    ],
  },
  {
    category: 'TV i Filmovi',
    tags: [
      'Akcioni', 'Dokumentarci', 'Serije', 'Rijaliti', 'Anime', 'Horor', 'Komedija',
      'Drama', 'Triler', 'SF', 'Fantazija', 'Crtani filmovi', 'Misterija', 'Krimi',
      'Romantični', 'Klasični filmovi', 'Špijunski', 'Istorijski', 'Western', 'Muzički'
    ],
  },
  {
    category: 'Vrednosti i ciljevi',
    tags: [
      'Mentalno zdravlje', 'Feminizam', 'Pride', 'Samopomoć', 'Lični razvoj', 'Spiritualnost',
      'Minimalizam', 'Održivi život', 'Zdravlje', 'Fizičko zdravlje', 'Terapija', 'Mindfulness',
      'Filozofija', 'Politički stavovi', 'Religija', 'Prava životinja', 'Ekološka svest',
      'Ekonomija', 'Finansijska pismenost', 'Sloboda izražavanja'
    ],
  },
  {
    category: 'Zdravlje i blagostanje',
    tags: [
      'Nega kože', 'Astrologija', 'Svesnost', 'Meditacija', 'Ishrana', 'Alternativna medicina',
      'Trening snage', 'Fleksibilnost', 'Joga', 'Pilates', 'Trčanje', 'Šetnja',
      'Kvalitetan san', 'Hidratacija', 'Vežbe disanja', 'Dijetologija', 'Dermatologija',
      'Masaža', 'Psihoterapija', 'Wellness'
    ],
  },
];

export default function InterestsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    if (params.currentInterests) {
      try {
        const currentInterests = JSON.parse(params.currentInterests as string);
        if (Array.isArray(currentInterests)) {
          setSelectedTags(currentInterests);
        }
      } catch (e) {
        console.error("Failed to parse current interests from params:", e);
      }
    }
  }, [params.currentInterests]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      }
      return [...prev, tag];
    });
  };

  const TagItem = ({ tag, selected, onToggle }: { tag: string; selected: boolean; onToggle: (tag: string) => void }) => {
    const tagStyle = selected ? styles.selectedTag : styles.unselectedTag;
    const textStyle = selected ? styles.selectedTagText : styles.unselectedTagText;
    const closeIconStyle = selected ? { opacity: 1 } : { opacity: 0 };

    return (
      <TouchableOpacity
        style={[styles.interestTag, tagStyle]}
        onPress={() => onToggle(tag)}
      >
        <Text style={[styles.interestText, textStyle]}>
          {tag}
        </Text>
        <View style={closeIconStyle}>
          {selected && (
            <Ionicons
              name="close"
              size={14}
              color="#fff"
              style={styles.closeIcon}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const handleSave = () => {
    router.push({
      pathname: '/profile/edit-profile',
      params: { selectedInterests: JSON.stringify(selectedTags) },
    });
  };

  const renderCategory = ({ item }: { item: { category: string; tags: string[] } }) => (
    <View key={item.category} style={styles.categorySection}>
      <Text style={styles.categoryTitle}>{item.category}</Text>
      <View style={styles.tagsContainer}>
        {item.tags.map((tag) => (
          <TagItem
            key={tag}
            tag={tag}
            selected={selectedTags.includes(tag)}
            onToggle={toggleTag}
          />
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Interesovanja</Text>
      </View>

      <FlatList
        data={interestsData}
        renderItem={renderCategory}
        keyExtractor={item => item.category}
        contentContainerStyle={styles.container}
      />

      {selectedTags.length > 0 && (
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>
              Sačuvaj interesovanja ({selectedTags.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 5,
  },
  backBtn: {
    marginRight: 15,
    padding: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  container: {
    padding: 20,
    paddingBottom: 100,
  },
  categorySection: {
    marginBottom: 30,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  interestTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
  },
  selectedTag: {
    backgroundColor: '#FF4081',
    borderColor: '#FF4081',
  },
  unselectedTag: {
    backgroundColor: '#E0E0E0',
    borderColor: '#C0C0C0',
  },
  interestText: {
    fontSize: 15,
    fontWeight: '500',
  },
  selectedTagText: {
    color: '#fff',
  },
  unselectedTagText: {
    color: '#555',
  },
  closeIcon: {
    marginLeft: 8,
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  saveButton: {
    backgroundColor: '#FF4081',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF4081',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
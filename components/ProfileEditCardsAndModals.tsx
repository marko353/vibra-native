import { AntDesign, Ionicons } from "@expo/vector-icons";
import React, { Dispatch, SetStateAction } from "react";
import {
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { UserProfile } from "../context/ProfileContext";

function getGenderLabel(gender: string | null | undefined) {
    if (gender === 'male') return 'Muški';
    if (gender === 'female') return 'Ženski';
    if (gender === 'other') return 'Ostali';
    return '';
}

const COLORS = {
  primary: '#ff7f00',
  textPrimary: '#1a1a1a',
  textSecondary: '#999',
  textPlaceholder: '#C8C8C8',
  background: '#fff',
  border: '#ECECEC',
  iconBg: '#fff5ec',
  iconBorder: '#ffd0a8',
};

const screens = {
  languages: "/(modals)/languages",
  interests: "/(modals)/interests",
  height: "/(modals)/height",
  location: "/(modals)/location",
  bio: "/(modals)/bio",
  communicationStyle: "/(modals)/communicationStyle",
  diet: "/(modals)/diet",
  drinks: "/(modals)/drinks",
  education: "/(modals)/education",
  familyPlans: "/(modals)/familyPlans",
  gender: "/(modals)/gender",
  horoscope: "/(modals)/horoscope",
  job: "/(modals)/job",
  relationshipType: "/(modals)/relationshipType",
  loveStyle: "/(modals)/loveStyle",
  pets: "/(modals)/pets",
  smokes: "/(modals)/smokes",
  workout: "/(modals)/workout",
  sexualOrientation: "/(modals)/sexualOrientation",
  religion: "/(modals)/religion",
};

interface ProfileEditCardsAndModalsProps {
  profile: UserProfile;
  setProfileField: (field: keyof UserProfile, value: any) => void;
  setPendingUpdates: Dispatch<SetStateAction<{ field: string; value: any }[]>>;
  locationCity?: string | null;
  onOpenModal: (screenName: keyof typeof screens, params?: any) => void;
}

// Grupe kartica za sekcije
const SECTIONS = [
  {
    title: 'About me',
    items: ['bio', 'languages', 'interests', 'height', 'gender', 'sexualOrientation'],
  },
  {
    title: 'Lifestyle',
    items: ['workout', 'diet', 'drinks', 'smokes', 'pets'],
  },
  {
    title: 'Relationships',
    items: ['relationshipType', 'loveStyle', 'familyPlans', 'communicationStyle'],
  },
  {
    title: 'Background',
    items: ['education', 'job', 'horoscope', 'religion'],
  },
  {
    title: 'Location',
    items: ['location'],
  },
];

const ProfileEditCardsAndModals = ({
  profile,
  setProfileField,
  setPendingUpdates,
  locationCity,
  onOpenModal,
}: ProfileEditCardsAndModalsProps) => {

  const handleCardPress = (screen: keyof typeof screens, params?: any) => {
    onOpenModal(screen, params);
  };

  const getCardData = (key: string): {
    title: string;
    value: string | null | undefined;
    screenKey: keyof typeof screens;
    params?: any;
    icon: keyof typeof Ionicons.glyphMap;
  } | null => {
    switch (key) {
      case 'bio': return { title: 'About me', value: profile.bio, screenKey: 'bio', params: { currentBio: profile.bio || '' }, icon: 'person-outline' };
      case 'languages': return { title: 'Languages', value: profile.languages?.length ? profile.languages.join(', ') : null, screenKey: 'languages', params: { currentLanguages: JSON.stringify(profile.languages) }, icon: 'language-outline' };
      case 'interests': return { title: 'Interests', value: profile.interests?.length ? profile.interests.join(', ') : null, screenKey: 'interests', params: { currentInterests: JSON.stringify(profile.interests) }, icon: 'bulb-outline' };
      case 'height': return { title: 'Height', value: profile.height ? `${profile.height} cm` : null, screenKey: 'height', params: { currentHeight: profile.height?.toString() || '' }, icon: 'body-outline' };
      case 'gender': return { title: 'Gender', value: getGenderLabel(profile.gender), screenKey: 'gender', params: { currentGender: profile.gender || '' }, icon: 'male-female-outline' };
      case 'sexualOrientation': return { title: 'Orientation', value: profile.sexualOrientation || null, screenKey: 'sexualOrientation', params: { currentOrientation: profile.sexualOrientation || '' }, icon: 'transgender-outline' };
      case 'workout': return { title: 'Workout', value: profile.workout || null, screenKey: 'workout', params: { currentWorkout: profile.workout || '' }, icon: 'barbell-outline' };
      case 'diet': return { title: 'Diet', value: profile.diet || null, screenKey: 'diet', params: { currentDiet: profile.diet || '' }, icon: 'nutrition-outline' };
      case 'drinks': return { title: 'Drinks', value: profile.drinks || null, screenKey: 'drinks', params: { currentDrinks: profile.drinks || '' }, icon: 'beer-outline' };
      case 'smokes': return { title: 'Smoking', value: profile.smokes || null, screenKey: 'smokes', params: { currentSmokes: profile.smokes || '' }, icon: 'bonfire-outline' };
      case 'pets': return { title: 'Pets', value: profile.pets || null, screenKey: 'pets', params: { currentPets: profile.pets || '' }, icon: 'paw-outline' };
      case 'relationshipType': return { title: 'Relationship type', value: profile.relationshipType || null, screenKey: 'relationshipType', params: { currentType: profile.relationshipType || '' }, icon: 'heart-outline' };
      case 'loveStyle': return { title: 'Love language', value: profile.loveStyle || null, screenKey: 'loveStyle', params: { currentStyle: profile.loveStyle || '' }, icon: 'flower-outline' };
      case 'familyPlans': return { title: 'Family plans', value: profile.familyPlans || null, screenKey: 'familyPlans', params: { currentFamilyPlans: profile.familyPlans || '' }, icon: 'people-outline' };
      case 'communicationStyle': return { title: 'Communication style', value: profile.communicationStyle || null, screenKey: 'communicationStyle', params: { currentStyle: profile.communicationStyle || '' }, icon: 'chatbubbles-outline' };
      case 'education': return { title: 'Education', value: profile.education?.length ? profile.education.join(', ') : null, screenKey: 'education', params: { currentEducation: JSON.stringify(profile.education) }, icon: 'school-outline' };
      case 'job': return { title: 'Job', value: profile.jobTitle || null, screenKey: 'job', params: { currentJobTitle: profile.jobTitle || '' }, icon: 'briefcase-outline' };
      case 'horoscope': return { title: 'Horoscope', value: profile.horoscope || null, screenKey: 'horoscope', params: { currentHoroscope: profile.horoscope || '' }, icon: 'planet-outline' };
      case 'religion': return { title: 'Religion', value: (profile as any).religion || null, screenKey: 'religion', params: {}, icon: 'sparkles-outline' };
      default: return null;
    }
  };

  const renderCard = (key: string, isLast: boolean) => {
    if (key === 'location') {
      const showLocation = profile?.showLocation ?? false;
      const cityToShow = locationCity || (profile.location as any)?.locationCity || '';
      let locationValue = 'Disabled';
      if (showLocation) locationValue = cityToShow ? cityToShow : 'Location enabled';

      return (
        <TouchableOpacity
          key="location"
          onPress={() => handleCardPress('location', {
            isLocationEnabled: showLocation,
            currentLocationCity: locationCity || '',
          })}
          style={[styles.card, isLast && styles.cardLast]}
          activeOpacity={0.7}
        >
          <View style={styles.iconBox}>
            <Ionicons name="location-outline" size={18} color={COLORS.primary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Location</Text>
            <Text style={[styles.cardValue, !showLocation && styles.cardValueEmpty]}>
              {locationValue}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textPlaceholder} />
        </TouchableOpacity>
      );
    }

    const data = getCardData(key);
    if (!data) return null;
    const isEmpty = !data.value;

    return (
      <TouchableOpacity
        key={key}
        onPress={() => handleCardPress(data.screenKey, data.params)}
        style={[styles.card, isLast && styles.cardLast]}
        activeOpacity={0.7}
      >
        <View style={styles.iconBox}>
          <Ionicons name={data.icon} size={18} color={COLORS.primary} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{data.title}</Text>
          <Text
            style={[styles.cardValue, isEmpty && styles.cardValueEmpty]}
            numberOfLines={key === 'bio' ? 2 : 1}
            ellipsizeMode="tail"
          >
            {data.value || `Add ${data.title.toLowerCase()}`}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textPlaceholder} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionCard}>
            {section.items.map((key, idx) =>
              renderCard(key, idx === section.items.length - 1)
            )}
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    backgroundColor: '#fff',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: '#fff',
    gap: 12,
  },
  cardLast: {
    borderBottomWidth: 0,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.iconBg,
    borderWidth: 1,
    borderColor: COLORS.iconBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
  cardValueEmpty: {
    color: COLORS.textPlaceholder,
    fontStyle: 'italic',
  },
});

export default ProfileEditCardsAndModals;
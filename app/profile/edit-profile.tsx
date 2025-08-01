import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Platform,
  TextInput,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAuthContext } from '../../context/AuthContext';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import axios from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ProfileCarousel from '../../components/ProfileCarousel';
import Animated from 'react-native-reanimated';

// Ažurirana paleta boja za moderniji izgled
const COLORS = {
  primary: '#FF5733', // Topla narandžasta za naglaske
  secondary: '#FFC300', // Zlatna za akcente
  background: '#F0F2F5', // Svetlo siva pozadina
  cardBackground: '#FFFFFF', // Bela pozadina kartica
  textPrimary: '#2C3E50', // Tamno plava za glavni tekst
  textSecondary: '#7F8C8D', // Siva za pomoćni tekst
  border: '#E8E8E8', // Svetla siva za granice
  gradientStart: '#FF6B6B',
  gradientEnd: '#F9A826',
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

interface SimpleSectionCardProps {
  iconName: string;
  iconColor: string;
  title: string;
  value: string | null;
  gradientColors: [string, string, ...string[]];
  onPress: () => void;
}

const calculateAge = (birthDateString?: string | null): number | null => {
  if (!birthDateString) return null;
  const birthDate = new Date(birthDateString);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

function compressImagesArray(images: (string | null)[]) {
  const filtered = images.filter((img) => img !== null);
  const nullsCount = images.length - filtered.length;
  return [...filtered, ...Array(nullsCount).fill(null)];
}

const { width } = Dimensions.get('window');

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function EditProfileScreen() {
  const { user } = useAuthContext();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [mode, setMode] = useState<'edit' | 'view'>('edit');
  const [userRelationshipType, setUserRelationshipType] = useState<string | null>(null);
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [userHeight, setUserHeight] = useState<number | null>(null);
  const [userLanguages, setUserLanguages] = useState<string[]>([]);
  const [userHoroscope, setUserHoroscope] = useState<string | null>(null);
  const [userFamilyPlans, setUserFamilyPlans] = useState<string | null>(null);
  const [userCommunicationStyle, setUserCommunicationStyle] = useState<string | null>(null);
  const [userLoveStyle, setUserLoveStyle] = useState<string | null>(null);
  const [userPets, setUserPets] = useState<string | null>(null);
  const [userDrinks, setUserDrinks] = useState<string | null>(null);
  const [userSmokes, setUserSmokes] = useState<string | null>(null);
  const [userWorkout, setUserWorkout] = useState<string | null>(null);
  const [userDiet, setUserDiet] = useState<string | null>(null);
  const [userJob, setUserJob] = useState<string | null>(null);
  const [userEducation, setUserEducation] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [userGender, setUserGender] = useState<string | null>(null);
  const [userSexualOrientation, setUserSexualOrientation] = useState<string | null>(null);
  const [userBio, setUserBio] = useState<string | null>(null);

  const userAge = calculateAge(user?.birthDate);
  const params = useLocalSearchParams();

  const { data: userData, isLoading: isUserLoading } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/user/${user?.id}`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        return res.data;
      } catch (error) {
        console.error("Greška pri učitavanju korisničkih podataka:", error);
        return null;
      }
    },
    enabled: !!user?.token,
  });
   const ListHeader = useCallback(() => (
<View style={styles.photosHeaderContainer}>
 <Text style={styles.photosTitle}>Dodajte svoje fotografije</Text>
 </View>
 ), []);

  const { data: images = Array(9).fill(null), isLoading: isImagesLoading } = useQuery({
    queryKey: ['userProfilePhotos', user?.id],
    queryFn: async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/user/profile-pictures`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        const filledImages = Array(9).fill(null);
        if (Array.isArray(res.data.profilePictures)) {
          res.data.profilePictures.forEach((url: string, i: number) => {
            if (i < 9) filledImages[i] = url;
          });
        }
        return filledImages;
      } catch (error) {
        console.error("Greška pri učitavanju slika profila:", error);
        return Array(9).fill(null);
      }
    },
    enabled: !!user?.token,
  });

  const ListFooter = useCallback(() => (
    <View style={styles.footerContainer}>
      <View style={styles.sectionContainer}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="information-circle-outline" size={28} color={COLORS.primary} style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>O meni</Text>
        </View>
        <TouchableOpacity onPress={navigateToBioEdit} style={styles.infoCard}>
          <View style={styles.infoContentContainer}>
            {userBio ? (
              <Text style={styles.bioText}>{userBio}</Text>
            ) : (
              <Text style={styles.placeholderTextWithIcon}>
                Dodaj nešto o sebi
              </Text>
            )}
            <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} style={styles.chevronIcon} />
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.sectionContainer}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="chatbubbles-outline" size={28} color={COLORS.secondary} style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Kakvu vezu želim</Text>
        </View>
        <SimpleSectionCard
          iconName="heart-outline"
          iconColor="#EF476F"
          title="Tip veze"
          value={userRelationshipType || "Odaberi tip veze"}
          gradientColors={['#FFEFEF', '#FFDADA']}
          onPress={navigateToRelationshipType}
        />
      </View>
      <View style={styles.sectionContainer}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="heart-circle-outline" size={28} color="#E91E63" style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Interesovanja</Text>
        </View>
        <TouchableOpacity onPress={navigateToInterests} style={styles.infoCard}>
          <View style={styles.infoContentContainer}>
            {userInterests.length > 0 ? (
              <View style={styles.tagsDisplayContainer}>
                {userInterests.slice(0, 3).map((tag, index) => (
                  <View key={index} style={styles.interestTag}>
                    <Text style={styles.interestText}>{tag}</Text>
                  </View>
                ))}
                {userInterests.length > 3 && (
                  <Text style={styles.seeAllText}>...</Text>
                )}
              </View>
            ) : (
              <Text style={styles.placeholderTextWithIcon}>
                Dodaj interesovanja
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.sectionContainer}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="resize-outline" size={28} color="#8A2BE2" style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Tvoja visina</Text>
        </View>
        <TouchableOpacity onPress={navigateToHeight} style={styles.infoCard}>
          <View style={styles.infoContentContainer}>
            {userHeight ? (
              <Text style={styles.selectedOptionText}>
                {userHeight} cm
              </Text>
            ) : (
              <Text style={styles.placeholderTextWithIcon}>
                Dodaj svoju visinu
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.sectionContainer}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="language-outline" size={28} color="#1E90FF" style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Jezici koje govorite</Text>
        </View>
        <TouchableOpacity onPress={navigateToLanguages} style={styles.infoCard}>
          <View style={styles.infoContentContainer}>
            {userLanguages.length > 0 ? (
              <View style={styles.tagsDisplayContainer}>
                {userLanguages.slice(0, 3).map((lang, index) => (
                  <View key={index} style={styles.interestTag}>
                    <Text style={styles.interestText}>{lang}</Text>
                  </View>
                ))}
                {userLanguages.length > 3 && (
                  <Text style={styles.seeAllText}>...</Text>
                )}
              </View>
            ) : (
              <Text style={styles.placeholderTextWithIcon}>
                Dodaj jezike
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.sectionContainer}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="information-circle-outline" size={28} color="#008080" style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Više o meni</Text>
        </View>
        <SimpleSectionCard
          iconName="star-outline"
          iconColor="#F1C40F"
          title="Horoskop"
          value={userHoroscope}
          gradientColors={['#FFF8E1', '#FFECB3']}
          onPress={navigateToHoroscope}
        />
        <SimpleSectionCard
          iconName="people-outline"
          iconColor="#3498DB"
          title="Porodični planovi"
          value={userFamilyPlans}
          gradientColors={['#E3F2FD', '#BBDEFB']}
          onPress={navigateToFamilyPlans}
        />
        <SimpleSectionCard
          iconName="chatbox-outline"
          iconColor="#2ECC71"
          title="Stil komunikacije"
          value={userCommunicationStyle}
          gradientColors={['#E8F5E9', '#C8E6C9']}
          onPress={navigateToCommunicationStyle}
        />
        <SimpleSectionCard
          iconName="heart-outline"
          iconColor="#E74C3C"
          title="Ljubavni stil"
          value={userLoveStyle}
          gradientColors={['#FDEBEC', '#FADBD8']}
          onPress={navigateToLoveStyle}
        />
      </View>
      <View style={styles.sectionContainer}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="bicycle-outline" size={28} color="#228B22" style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Životni stil</Text>
        </View>
        <SimpleSectionCard
          iconName="paw-outline"
          iconColor="#95A5A6"
          title="Ljubimci"
          value={userPets}
          gradientColors={['#F5F7F8', '#ECF0F1']}
          onPress={navigateToPets}
        />
        <SimpleSectionCard
          iconName="beer-outline"
          iconColor="#F1C40F"
          title="Piće"
          value={userDrinks}
          gradientColors={['#FFF8E1', '#FFECB3']}
          onPress={navigateToDrinks}
        />
        <SimpleSectionCard
          iconName="bonfire-outline"
          iconColor="#E67E22"
          title="Koliko često pušiš"
          value={userSmokes}
          gradientColors={['#FDF2E9', '#F9E7D9']}
          onPress={navigateToSmokes}
        />
        <SimpleSectionCard
          iconName="barbell-outline"
          iconColor="#34495E"
          title="Vežbanje"
          value={userWorkout}
          gradientColors={['#EAF2F8', '#D6EAF8']}
          onPress={navigateToWorkout}
        />
        <SimpleSectionCard
          iconName="nutrition-outline"
          iconColor="#27AE60"
          title="Ishrana"
          value={userDiet}
          gradientColors={['#E8F8F5', '#D1F2EB']}
          onPress={navigateToDiet}
        />
      </View>
      <View style={styles.sectionContainer}>
        <SimpleSectionCard
          iconName="briefcase-outline"
          iconColor="#7D3C98"
          title="Posao"
          value={userJob}
          gradientColors={['#E8DAEF', '#D2B4DE']}
          onPress={navigateToJob}
        />
        <SimpleSectionCard
          iconName="school-outline"
          iconColor="#2980B9"
          title="Obrazovanje"
          value={userEducation}
          gradientColors={['#D6EAF8', '#A9CCE3']}
          onPress={navigateToEducation}
        />
        <SimpleSectionCard
          iconName="location-outline"
          iconColor="#16A085"
          title="Živim na lokaciji"
          value={userLocation}
          gradientColors={['#D1F2EB', '#A3E4D7']}
          onPress={navigateToLocation}
        />
        <SimpleSectionCard
          iconName="person-outline"
          iconColor="#E91E63"
          title="Pol"
          value={userGender}
          gradientColors={['#FADBD8', '#F5B7B1']}
          onPress={navigateToGender}
        />
        <SimpleSectionCard
          iconName="transgender-outline"
          iconColor="#9B59B6"
          title="Seksualna orijentacija"
          value={userSexualOrientation}
          gradientColors={['#EBDEF0', '#D7BDE2']}
          onPress={navigateToSexualOrientation}
        />
      </View>
      <View style={{ height: 150 }} />
    </View>
  ), [userBio, userRelationshipType, userInterests, userHeight, userLanguages, userHoroscope, userFamilyPlans, userCommunicationStyle, userLoveStyle, userPets, userDrinks, userSmokes, userWorkout, userDiet, userJob, userEducation, userLocation, userGender, userSexualOrientation]);

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<string | null>) => {
      const index = images.indexOf(item);
      const isUploading = uploadingIndex === index;
      return (
        <TouchableOpacity
          onLongPress={drag}
          style={[styles.card, { opacity: isActive ? 0.8 : 1 }]}
          disabled={isUploading}
        >
          {item ? (
            <>
              <Image source={{ uri: item }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => removeImage(index)}
                disabled={isUploading}
              >
                <Ionicons name="close" size={18} color="#fff" />
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.placeholderContainer}>
              <View style={styles.placeholder}>
                {isUploading ? (
                  <ActivityIndicator size="large" color={COLORS.primary} />
                ) : (
                  <Text style={styles.plus}>+</Text>
                )}
              </View>
              {!isUploading && (
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => pickAndUploadImage(index)}
                >
                  <Ionicons name="add-circle" size={35} color={COLORS.primary} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [images, uploadingIndex]
  );
  
  // Navigacija do nove komponente za uređivanje biografije
  const navigateToBioEdit = () => {
    router.push({
      pathname: '/profile/edit/editBio',
      params: { currentBio: userBio || '' },
    });
  };

  const navigateToRelationshipType = () => {
    router.push({
      pathname: '/profile/edit/relationshipType',
      params: {
        currentRelationshipType: userRelationshipType,
      },
    });
  };
  const navigateToInterests = () => {
    router.push({
      pathname: '/profile/edit/interests',
      params: { currentInterests: JSON.stringify(userInterests) },
    });
  };
  const navigateToHeight = () => {
    router.push({
      pathname: '/profile/edit/height',
      params: { currentHeight: userHeight ? userHeight.toString() : '' },
    });
  };
  const navigateToLanguages = () => {
    router.push({
      pathname: '/profile/edit/languages',
      params: { currentLanguages: JSON.stringify(userLanguages) },
    });
  };
  const navigateToHoroscope = () => {
    router.push({
      pathname: '/profile/edit/horoscope',
      params: { currentHoroscope: userHoroscope || '' },
    });
  };
  const navigateToFamilyPlans = () => {
    router.push({
      pathname: '/profile/edit/familyPlans',
      params: { currentFamilyPlans: userFamilyPlans || '' },
    });
  };
  const navigateToCommunicationStyle = () => {
    router.push({
      pathname: '/profile/edit/communicationStyle',
      params: { currentCommunicationStyle: userCommunicationStyle || '' },
    });
  };
  const navigateToLoveStyle = () => {
    router.push({
      pathname: '/profile/edit/loveStyle',
      params: { currentLoveStyle: userLoveStyle || '' },
    });
  };
  const navigateToPets = () => {
    router.push({
      pathname: '/profile/edit/pets',
      params: { currentPets: userPets || '' },
    });
  };
  const navigateToDrinks = () => {
    router.push({
      pathname: '/profile/edit/drinks',
      params: { currentDrinks: userDrinks || '' },
    });
  };
  const navigateToSmokes = () => {
    router.push({
      pathname: '/profile/edit/smokes',
      params: { currentSmokes: userSmokes || '' },
    });
  };
  const navigateToWorkout = () => {
      router.push({
      pathname: '/profile/edit/workout',
      params: { currentWorkout: userWorkout || '' },
    });
  };
  const navigateToDiet = () => {
    router.push({
      pathname: '/profile/edit/diet',
      params: { currentDiet: userDiet || '' },
    });
  };
  const navigateToJob = () => {
    router.push({
      pathname: '/profile/edit/job',
      params: { currentJob: userJob || '' },
    });
  };
  const navigateToEducation = () => {
    router.push({
      pathname: '/profile/edit/education',
      params: { currentEducation: userEducation || '' },
    });
  };
  const navigateToLocation = () => {
    router.push({
      pathname: '/profile/edit/location',
      params: { currentLocation: userLocation || '' },
    });
  };
  const navigateToGender = () => {
    router.push({
      pathname: '/profile/edit/gender',
      params: { currentGender: userGender || '' },
    });
  };
  const navigateToSexualOrientation = () => {
    router.push({
      pathname: '/profile/edit/sexualOrientation',
      params: { currentSexualOrientation: userSexualOrientation || '' },
    });
  };

  const SimpleSectionCard: React.FC<SimpleSectionCardProps> = ({ iconName, iconColor, title, value, gradientColors, onPress }) => (
    <TouchableOpacity onPress={onPress} style={styles.sectionCard}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.infoCard}
      >
        <View style={styles.subSectionContent}>
          <View style={styles.subSectionLeft}>
            <Ionicons name={iconName as any} size={20} color={iconColor} style={styles.subSectionItemIcon} />
            <Text style={styles.subSectionItemText}>{title}</Text>
          </View>
          <View style={styles.subSectionRight}>
            <Text style={styles.subSectionValueText}>
              {value || "Dodaj"}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} style={styles.chevronIcon} />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const pickAndUploadImage = async (index: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Dozvola potrebna', 'Morate dozvoliti pristup galeriji.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setUploadingIndex(index);
      setTimeout(() => {
        queryClient.setQueryData(['userProfilePhotos', user?.id], (oldData: (string | null)[] = []) => {
          const updated = [...oldData];
          updated[index] = uri;
          return compressImagesArray(updated);
        });
        setUploadingIndex(null);
      }, 1500);
    }
  };

  const removeImage = (index: number) => {
    const imageUrl = images[index];
    if (!imageUrl) return;
    Alert.alert('Ukloni sliku', 'Da li ste sigurni da želite da uklonite ovu sliku?', [
      { text: 'Otkaži', style: 'cancel' },
      {
        text: 'Ukloni', onPress: () => {
          queryClient.setQueryData(['userProfilePhotos', user?.id], (oldData: (string | null)[] = []) => {
            const newData = oldData.map((img, i) => (i === index ? null : img));
            return compressImagesArray(newData);
          });
        }
      },
    ]);
  };

  React.useEffect(() => {
    if (userData) {
      setUserRelationshipType(userData.relationshipType || null);
      setUserInterests(userData.interests || []);
      setUserHeight(userData.height || null);
      setUserLanguages(userData.languages || []);
      setUserHoroscope(userData.horoscope || null);
      setUserFamilyPlans(userData.familyPlans || null);
      setUserCommunicationStyle(userData.communicationStyle || null);
      setUserLoveStyle(userData.loveStyle || null);
      setUserPets(userData.pets || null);
      setUserDrinks(userData.drinks || null);
      setUserSmokes(userData.smokes || null);
      setUserWorkout(userData.workout || null);
      setUserDiet(userData.diet || null);
      setUserJob(userData.job || null);
      setUserEducation(userData.education || null);
      setUserLocation(userData.location || null);
      setUserGender(userData.gender || null);
      setUserSexualOrientation(userData.sexualOrientation || null);
      setUserBio(userData.bio || null);
    }
  }, [userData]);

  useFocusEffect(
    useCallback(() => {
      // Handle the new bio text from the edit screen
      if (params.updatedBio) {
        const newBio = String(params.updatedBio);
        setUserBio(newBio);
        router.setParams({ updatedBio: undefined });
      }

      // Relationship type
      if (params.updatedRelationshipType) {
        const newType = String(params.updatedRelationshipType);
        setUserRelationshipType(newType);
        router.setParams({ updatedRelationshipType: undefined });
      }

      // Interests
      if (params.selectedInterests) {
        try {
          const interests = JSON.parse(params.selectedInterests as string);
          if (Array.isArray(interests)) {
            setUserInterests(interests);
          }
        } catch (e) {
          console.error('Greška pri parsiranju interesovanja:', e);
        }
        router.setParams({ selectedInterests: undefined });
      }

      // Height
      if (params.updatedHeight) {
        const newHeight = Number(params.updatedHeight);
        setUserHeight(newHeight);
        router.setParams({ updatedHeight: undefined });
      }

      // Languages
      if (params.updatedLanguages) {
        try {
          const updated = JSON.parse(params.updatedLanguages as string);
          if (Array.isArray(updated)) {
            setUserLanguages(updated);
          }
        } catch (e) {
          console.error("Failed to parse updated languages:", e);
        }
        router.setParams({ updatedLanguages: undefined });
      }

      // Horoscope
      if (params.updatedHoroscope) {
        const newHoroscope = params.updatedHoroscope as string;
        setUserHoroscope(newHoroscope);
        router.setParams({ updatedHoroscope: undefined });
      }

      // Family plans
      if (params.updatedFamilyPlans) {
        const newFamilyPlans = params.updatedFamilyPlans as string;
        setUserFamilyPlans(newFamilyPlans);
        router.setParams({ updatedFamilyPlans: undefined });
      }

      // Communication style
      if (params.updatedCommunicationStyle) {
        const newCommunicationStyle = params.updatedCommunicationStyle as string;
        setUserCommunicationStyle(newCommunicationStyle);
        router.setParams({ updatedCommunicationStyle: undefined });
      }

      // Love style
      if (params.updatedLoveStyle) {
        const newLoveStyle = params.updatedLoveStyle as string;
        setUserLoveStyle(newLoveStyle);
        router.setParams({ updatedLoveStyle: undefined });
      }

      // Pets
      if (params.updatedPets) {
        const newPets = params.updatedPets as string;
        setUserPets(newPets);
        router.setParams({ updatedPets: undefined });
      }

      // Drinks
      if (params.updatedDrinks) {
        const newDrinks = params.updatedDrinks as string;
        setUserDrinks(newDrinks);
        router.setParams({ updatedDrinks: undefined });
      }

      // Smokes
      if (params.updatedSmokes) {
        const newSmokes = params.updatedSmokes as string;
        setUserSmokes(newSmokes);
        router.setParams({ updatedSmokes: undefined });
      }

      // Workout
      if (params.updatedWorkout) {
        const newWorkout = params.updatedWorkout as string;
        setUserWorkout(newWorkout);
        router.setParams({ updatedWorkout: undefined });
      }

      // Diet
      if (params.updatedDiet) {
        const newDiet = params.updatedDiet as string;
        setUserDiet(newDiet);
        router.setParams({ updatedDiet: undefined });
      }

      // Job
      if (params.updatedJob) {
        const newJob = params.updatedJob as string;
        setUserJob(newJob);
        router.setParams({ updatedJob: undefined });
      }

      // Education
      if (params.updatedEducation) {
        const newEducation = params.updatedEducation as string;
        setUserEducation(newEducation);
        router.setParams({ updatedEducation: undefined });
      }

      // Location
      if (params.updatedLocation) {
        const newLocation = params.updatedLocation as string;
        setUserLocation(newLocation);
        router.setParams({ updatedLocation: undefined });
      }

      // Gender
      if (params.updatedGender) {
        const newGender = params.updatedGender as string;
        setUserGender(newGender);
        router.setParams({ updatedGender: undefined });
      }

      // Sexual orientation
      if (params.updatedSexualOrientation) {
        const newSexualOrientation = params.updatedSexualOrientation as string;
        setUserSexualOrientation(newSexualOrientation);
        router.setParams({ updatedSexualOrientation: undefined });
      }
    }, [params, router]),
  );

  if (isUserLoading || isImagesLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.fixedHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            router.replace('/(tabs)/profile');
          }}
        >
          <Ionicons name="arrow-back" size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerContentContainer}>
          <Text style={styles.title}>Uredi Profil</Text>
          <View style={styles.toggleButtons}>
            <TouchableOpacity onPress={() => setMode('edit')} style={styles.toggleBtn}>
              <Text style={[styles.toggleText, mode === 'edit' && styles.activeToggleText]}>
                Uredi
              </Text>
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity onPress={() => setMode('view')} style={styles.toggleBtn}>
              <Text style={[styles.toggleText, mode === 'view' && styles.activeToggleText]}>
                Pregled
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.horizontalLine} />
      </View>
      {mode === 'edit' ? (
        <DraggableFlatList
          data={images}
          keyExtractor={(_, index) => `image-${index}`}
          renderItem={renderItem}
          numColumns={3}
          onDragEnd={({ data }) => {
            const compressed = compressImagesArray(data);
            queryClient.setQueryData(['userProfilePhotos', user?.id], compressed);
          }}
          contentContainerStyle={styles.gridContainer}
          ListHeaderComponent={ListHeader} 
          ListFooterComponent={ListFooter}
        />
      ) : (
        <ProfileCarousel
          images={images}
          fullName={user?.fullName}
          age={userAge}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  footerContainer: {
    paddingHorizontal: 0,
    alignItems: 'center',
  },
  photosTitleInput: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 20,
    marginBottom: 10,
    marginHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 5,
  },
  fixedHeader: {
    backgroundColor: COLORS.cardBackground,
    paddingTop: Platform.OS === 'android' ? 0 : 30,
    paddingBottom: 3,
    paddingHorizontal: 20,
    zIndex: 1,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    justifyContent: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerContentContainer: {
    flex: 1,
    alignSelf: 'flex-start',
    marginLeft: 30,
  },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 25 : 40,
    left: 20,
    zIndex: 10,
    padding: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'left',
    marginBottom: -10,
    marginTop: 25,
    marginLeft: 27,
  },
  horizontalLine: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: -20,
    marginTop: 10,
  },
  toggleButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 27,
    top: 6,
  },
  toggleBtn: {
    paddingVertical: 12,
    paddingHorizontal: 25,
  },
  toggleText: {
    fontSize: 23,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  activeToggleText: {
    borderBottomWidth: 3,
    borderBottomColor: COLORS.primary,
  },
  separator: {
    height: 25,
    width: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: 5,
  },
  sectionSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 15,
    alignSelf: 'flex-start',
  },
  gridContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignSelf: 'center',
    width: '100%',
  },
  photosHeaderContainer: {
    paddingHorizontal: 12,
    marginTop: 15,
    marginBottom: 10,
  },
  photosTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  card: {
    width: 110,
    height: 150,
    borderRadius: 15,
    overflow: 'hidden',
    margin: 10,
    backgroundColor: COLORS.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plus: {
    fontSize: 40,
    color: '#aaa',
  },
  addBtn: {
    position: 'absolute',
    bottom: -3,
    right: -2,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    padding: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  removeBtn: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 15,
    padding: 2,
  },
  sectionContainer: {
    marginHorizontal: 20,
    marginTop: 25,
    marginBottom: 10,
    alignSelf: 'stretch',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionIcon: {
    marginRight: 10,
  },
  tagsDisplayContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  infoCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 15,
    width:350,// Ažuriran padding i dodata minimalna visina za duže kartice
    paddingVertical: 35,
    paddingHorizontal: 20,
    justifyContent: 'center', // Centriramo sadržaj vertikalno
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 10,
  },
  bioCard: {
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  inputBox: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 16,
    color: COLORS.textPrimary,
    textAlignVertical: 'top',
  },
  placeholderText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  placeholderTextWithIcon: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    flexDirection: 'row',
    alignItems: 'center',
  },
  bioText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  infoContentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  interestTag: {
    backgroundColor: '#FDECEC',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FADBD8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  interestText: {
    fontSize: 14,
    color: '#E91E63',
    fontWeight: '600',
  },
  seeAllText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 5,
  },
  selectedOptionText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  sectionCard: {
    marginBottom: 10,
  },
  subSectionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subSectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subSectionRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subSectionItemIcon: {
    marginRight: 10,
  },
  subSectionItemText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  subSectionValueText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginRight: 5,
  },
  chevronIcon: {
    marginLeft: 5,
  },
});

import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Platform,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuthContext } from '../../context/AuthContext';
import { useProfile, UserProfile } from '../../context/ProfileContext';
import { useRouter, useFocusEffect, useLocalSearchParams, UnknownInputParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import ProfileCarousel from '../../components/ProfileCarousel';
import ProfileHeader from '../../components/ProfileHeader';
import ProfilePhotoGrid from '../../components/ProfilePhotoGrid';
import SimpleSectionCard from '../../components/SimpleSectionCard'; // Uvezena nova komponenta
import {
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

const COLORS = {
  primary: '#E91E63',
  secondary: '#FFC107',
  accent: '#2196F3',
  textPrimary: '#2c3e50',
  textSecondary: '#7f8c8d',
  background: '#ecf0f1',
  cardBackground: '#ffffff',
  placeholder: '#bdc3c7',
  border: '#dddddd',
  gradientStart: '#FE6B8B',
  gradientEnd: '#FF8E53',
  lightGray: '#D3D3D3',
  white: '#FFFFFF',
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const windowWidth = Dimensions.get('window').width;

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

type IconNames = keyof typeof Ionicons.glyphMap;

interface UserProfileData {
  bio: string | null;
  job: string | null;
  education: string | null;
  location: { locationCity: string; locationCountry: string } | null;
  showLocation?: boolean;
  gender: string | null;
  sexualOrientation: string | null;
  relationshipType: string | null;
  horoscope: string | null;
  familyPlans: string | null;
  communicationStyle: string | null;
  loveStyle: string | null;
  pets: string | null;
  drinks: string | null;
  smokes: string | null;
  workout: string | null;
  diet: string | null;
  height: number | null;
  languages: string[];
  interests: string[];
}

const ProfileDetailsView = ({ profile }: { profile: UserProfileData }) => {
  const renderInfoRow = (iconName: IconNames, title: string, value: any) => {
      if (title === 'Živi u') {
          const displayLocation = profile.location?.locationCity;

          if (!profile.showLocation || !displayLocation) {
              return null;
          }

          return (
            <View style={viewStyles.infoRow}>
              <Ionicons name={iconName} size={20} color="#7f8c8d" />
              <Text style={viewStyles.infoTitle}>{title}:</Text>
              <Text style={viewStyles.infoValue}>{displayLocation}</Text>
            </View>
          );
      }

      if (!value || (Array.isArray(value) && value.length === 0)) {
          return null;
      }

      let displayValue = value;
      if (Array.isArray(value)) {
        displayValue = value.join(', ');
      } else if (title === 'Visina') {
        displayValue = `${value} cm`;
      }

      return (
        <View style={viewStyles.infoRow}>
          <Ionicons name={iconName} size={20} color="#7f8c8d" />
          <Text style={viewStyles.infoTitle}>{title}:</Text>
          <Text style={viewStyles.infoValue}>{displayValue}</Text>
        </View>
      );
  };

  const renderTagSection = (title: string, tags: string[]) => {
      if (!tags || tags.length === 0) {
        return null;
      }
      return (
        <View style={viewStyles.section}>
          <Text style={viewStyles.sectionTitle}>{title}</Text>
          <View style={viewStyles.tagsContainer}>
            {tags.map((tag, index) => (
              <View key={index} style={viewStyles.tag}>
                <Text style={viewStyles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      );
  };

  return (
    <View style={viewStyles.container}>
      <View style={viewStyles.section}>
        <Text style={viewStyles.sectionTitle}>O meni</Text>
        {profile.bio ? (
          <Text style={viewStyles.bioText}>{profile.bio}</Text>
        ) : (
          <Text style={viewStyles.placeholderText}>Nema unetih informacija o vama.</Text>
        )}
      </View>

      <View style={viewStyles.section}>
        <Text style={viewStyles.sectionTitle}>Osnovne informacije</Text>
        {renderInfoRow('briefcase-outline', 'Posao', profile.job)}
        {renderInfoRow('school-outline', 'Obrazovanje', profile.education)}
        {renderInfoRow('location-outline', 'Živi u', profile.location)}
        {renderInfoRow('resize-outline', 'Visina', profile.height)}
        {renderInfoRow('person-outline', 'Pol', profile.gender)}
        {renderInfoRow('transgender-outline', 'Seksualna orijentacija', profile.sexualOrientation)}
      </View>

      <View style={viewStyles.section}>
        <Text style={viewStyles.sectionTitle}>Životni stil</Text>
        {renderInfoRow('paw-outline', 'Ljubimci', profile.pets)}
        {renderInfoRow('beer-outline', 'Piće', profile.drinks)}
        {renderInfoRow('bonfire-outline', 'Puši', profile.smokes)}
        {renderInfoRow('barbell-outline', 'Vežbanje', profile.workout)}
        {renderInfoRow('nutrition-outline', 'Ishrana', profile.diet)}
      </View>

      <View style={viewStyles.section}>
        <Text style={viewStyles.sectionTitle}>Osobine i stavovi</Text>
        {renderInfoRow('heart-outline', 'Tip veze', profile.relationshipType)}
        {renderInfoRow('star-outline', 'Horoskop', profile.horoscope)}
        {renderInfoRow('people-outline', 'Porodični planovi', profile.familyPlans)}
        {renderInfoRow('chatbox-outline', 'Stil komunikacije', profile.communicationStyle)}
        {renderInfoRow('heart-outline', 'Ljubavni stil', profile.loveStyle)}
      </View>

      {renderTagSection('Jezici', profile.languages)}
      {renderTagSection('Interesovanja', profile.interests)}
    </View>
  );
};


type RoutePath =
  | '/profile/edit/editBio'
  | '/profile/edit/relationshipType'
  | '/profile/edit/interests'
  | '/profile/edit/height'
  | '/profile/edit/languages'
  | '/profile/edit/horoscope'
  | '/profile/edit/familyPlans'
  | '/profile/edit/communicationStyle'
  | '/profile/edit/loveStyle'
  | '/profile/edit/pets'
  | '/profile/edit/drinks'
  | '/profile/edit/smokes'
  | '/profile/edit/workout'
  | '/profile/edit/diet'
  | '/profile/edit/job'
  | '/profile/edit/education'
  | '/profile/edit/location'
  | '/profile/edit/gender'
  | '/profile/edit/sexualOrientation';

type RouteParams = {
  currentBio?: string;
  currentRelationshipType?: string | null;
  currentInterests?: string;
  currentHeight?: string;
  currentLanguages?: string;
  currentHoroscope?: string | null;
  currentFamilyPlans?: string | null;
  currentCommunicationStyle?: string | null;
  currentLoveStyle?: string | null;
  currentPets?: string | null;
  currentDrinks?: string | null;
  currentSmokes?: string | null;
  currentWorkout?: string | null;
  currentDiet?: string | null;
  currentJob?: string | null;
  currentEducation?: string | null;
  currentLocation?: string | null;
  currentGender?: string | null;
  currentSexualOrientation?: string | null;
};

export default function EditProfileScreen() {
  const { user, logout } = useAuthContext();
  const { profile, setProfileField, loadProfile, resetProfile } = useProfile();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [mode, setMode] = useState<'edit' | 'view'>('edit');
  const params = useLocalSearchParams();

  const scrollViewRef = useRef<ScrollView | null>(null);
  const scrollPositionRef = useRef<number>(0);

  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState<{ field: string; value: any }[]>([]);

  const { data: userData, isLoading: isUserLoading } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      try {
        if (!user?.token) {
          console.error("Token nije dostupan. Preskačem dohvat korisničkih podataka.");
          return null;
        }

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

  const { data: images = Array(9).fill(null), isLoading: isImagesLoading } = useQuery({
    queryKey: ['userProfilePhotos', user?.id],
    queryFn: async () => {
      try {
        if (!user?.token) {
          console.error("Token nije dostupan. Preskačem dohvat slika profila.");
          return Array(9).fill(null);
        }

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

const updateProfileMutation = useMutation({
    mutationFn: async (payload: { field: string; value: any } | { showLocation: boolean }) => {
        if (!user?.token) {
          throw new Error("Token nije dostupan.");
        }
        
        let requestPayload = payload;
        if ('showLocation' in payload) {
          requestPayload = { field: 'showLocation', value: payload.showLocation };
        }

        const response = await axios.put(
          `${API_BASE_URL}/api/user/update-profile`,
          requestPayload,
          {
            headers: {
              'Authorization': `Bearer ${user.token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        return response.data;
    },
    onSuccess: (data, variables) => {
      console.log('Profil uspešno ažuriran:', data);
      queryClient.setQueryData(['userProfile', user?.id], (oldData: any) => {
        if (!oldData) return oldData;
        const isShowLocation = 'showLocation' in variables;
        const field = isShowLocation ? 'showLocation' : (variables as { field: string; value: any }).field;
        const value = isShowLocation ? (variables as { showLocation: boolean }).showLocation : (variables as { field: string; value: any }).value;
        return {
          ...oldData,
          [field]: value,
        };
      });
      setPendingUpdates(prev => prev.filter(update => update.field !== ('field' in variables ? variables.field : 'showLocation')));
    },
    onError: (error, variables) => {
      console.error("Greška pri slanju podataka na bekkend:", error);
      Alert.alert('Greška', 'Došlo je do greške prilikom ažuriranja profila.');
      setPendingUpdates(prev => prev.filter(update => update.field !== ('field' in variables ? variables.field : 'showLocation')));
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async ({ uri, index }: { uri: string; index: number }) => {
      if (!user?.token) throw new Error("Token nije dostupan.");

      const formData = new FormData();
      const filename = uri.split('/').pop();
      
      const fileUri = Platform.OS === 'android' ? uri : uri.replace('file://', '');

      // @ts-ignore
      formData.append('profilePicture', {
        uri: fileUri,
        type: 'image/jpeg',
        name: filename || `profile-picture-${Date.now()}.jpg`,
      });
      formData.append('position', index.toString());

      const response = await axios.post(
        `${API_BASE_URL}/api/user/upload-profile-picture`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['userProfilePhotos', user?.id], (oldData: (string | null)[] = []) => {
        const updated = [...oldData];
        updated[variables.index] = data.imageUrl;
        return compressImagesArray(updated);
      });
    },
    onError: (error) => {
      console.error("Greška pri uploadu slike:", error);
      Alert.alert('Greška', 'Došlo je do greške prilikom slanja slike na serveru.');
    },
    onSettled: () => {
      setUploadingIndex(null);
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async ({ index, imageUrl }: { index: number, imageUrl: string }) => {
      if (!user?.token) throw new Error("Token nije dostupan.");

      const response = await axios.delete(
        `${API_BASE_URL}/api/user/delete-profile-picture`,
        {
          headers: { 'Authorization': `Bearer ${user.token}` },
          data: { imageUrl, position: index },
        }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['userProfilePhotos', user?.id], (oldData: (string | null)[] = []) => {
        const newData = oldData.map((img, i) => (i === variables.index ? null : img));
        return compressImagesArray(newData);
      });
    },
    onError: (error) => {
      console.error("Greška pri brisanju slike:", error);
      Alert.alert('Greška', 'Došlo je do greške prilikom brisanja slike sa servera.');
    },
  });

  useEffect(() => {
    if (userData) {
      const normalizedLocation = typeof userData.location === 'string'
        ? { locationCity: userData.location, locationCountry: '' }
        : userData.location;

      const finalProfileData = {
          ...userData,
          location: normalizedLocation || { locationCity: '', locationCountry: '' }
      };

      loadProfile(finalProfileData);
      setIsLocationEnabled(userData.showLocation);
    }
  }, [userData]);

  const handleLocationToggle = (newValue: boolean) => {
    setIsLocationEnabled(newValue);
    updateProfileMutation.mutate({ showLocation: newValue });
  };

  useFocusEffect(
    useCallback(() => {
      const paramsToUpdate = [
        { key: 'updatedBio', field: 'bio' },
        { key: 'updatedRelationshipType', field: 'relationshipType' },
        { key: 'selectedInterests', field: 'interests' },
        { key: 'updatedHeight', field: 'height' },
        { key: 'updatedLanguages', field: 'languages' },
        { key: 'updatedHoroscope', field: 'horoscope' },
        { key: 'updatedFamilyPlans', field: 'familyPlans' },
        { key: 'updatedCommunicationStyle', field: 'communicationStyle' },
        { key: 'updatedLoveStyle', field: 'loveStyle' },
        { key: 'updatedPets', field: 'pets' },
        { key: 'updatedDrinks', field: 'drinks' },
        { key: 'updatedSmokes', field: 'smokes' },
        { key: 'updatedWorkout', field: 'workout' },
        { key: 'updatedDiet', field: 'diet' },
        { key: 'updatedJob', field: 'job' },
        { key: 'updatedEducation', field: 'education' },
        { key: 'updatedLocation', field: 'location' },
        { key: 'updatedGender', field: 'gender' },
        { key: 'updatedSexualOrientation', field: 'sexualOrientation' },
      ];
      
      let hasUpdated = false;

      paramsToUpdate.forEach(({ key, field }) => {
        if (params[key] !== undefined) {
          if (field === 'interests' || field === 'languages') {
            try {
              const value = JSON.parse(params[key] as string);
              setProfileField(field, value);
            } catch (e) {
              console.error(`Greška pri parsiranju JSON-a za ${field}:`, e);
              setProfileField(field, []);
            }
          } else if (field === 'height') {
            const value = Number(params[key]);
            setProfileField(field, value);
          } else if (field === 'location') {
              try {
                const loc = JSON.parse(params[key] as string);
                const value = { locationCity: loc.locationCity, locationCountry: loc.locationCountry };
                setProfileField(field, value);
              } catch (e) {
                console.error('Greška pri parsiranju lokacije:', e);
                const value = { locationCity: '', locationCountry: '' };
                setProfileField(field, value);
              }
          } else {
            const value = params[key];
            setProfileField(field as keyof UserProfile, value);
          }
          
          setPendingUpdates(prev => [...prev.filter(u => u.field !== field), { field, value: params[key] }]);
          router.setParams({ [key]: undefined });
          hasUpdated = true;
        }
      });

      if (scrollViewRef.current && scrollPositionRef.current > 0 && !hasUpdated) {
        scrollViewRef.current.scrollTo({ y: scrollPositionRef.current, animated: false });
      }
    }, [params, router, setProfileField, scrollViewRef])
  );

  useEffect(() => {
    if (pendingUpdates.length > 0) {
      pendingUpdates.forEach(update => {
        updateProfileMutation.mutate(update);
      });
    }
  }, [pendingUpdates, updateProfileMutation]);

  const userAge = userData ? calculateAge(userData.birthDate) : null;

  const handleCardPress = (path: RoutePath, params: RouteParams) => {
    router.push({ pathname: path, params: params as unknown as UnknownInputParams });
  };

  const pickAndUploadImage = async (index: number) => {
    if (uploadingIndex !== null) return;
    Alert.alert(
      'Dodajte sliku',
      'Odaberite opciju za dodavanje fotografije.',
      [
        {
          text: 'Izaberi iz galerije',
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Potrebna je dozvola', 'Morate omogućiti pristup galeriji da biste dodali slike.');
                return;
              }
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
              });

              if (!result.canceled) {
                const uri = result.assets[0].uri;
                setUploadingIndex(index);
                uploadImageMutation.mutate({ uri, index });
              }
            } catch (e: unknown) {
              if (e instanceof Error && e.message !== 'User cancelled image selection') {
                Alert.alert('Greška', 'Došlo je do greške prilikom obrade slike.');
              }
            }
          },
        },
        {
          text: 'Napravi fotografiju',
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Potrebna je dozvola', 'Morate omogućiti pristup kameri da biste dodali slike.');
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: 'images',
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
              });
              if (!result.canceled) {
                const uri = result.assets[0].uri;
                setUploadingIndex(index);
                uploadImageMutation.mutate({ uri, index });
              }
            } catch (e: unknown) {
              if (e instanceof Error && e.message !== 'User cancelled image selection') {
                Alert.alert('Greška', 'Došlo je do greške prilikom obrade slike.');
              }
            }
          },
        },
        {
          text: 'Otkaži',
          style: 'cancel',
        },
      ]
    );
  };
const removeImage = (index: number) => {
    const imageUrl = images[index];
    if (!imageUrl) return;
    Alert.alert('Ukloni sliku', 'Da li ste sigurni da želite da uklonite ovu sliku?', [
      { text: 'Otkaži', style: 'cancel' },
      {
        text: 'Ukloni', onPress: () => {
          deleteImageMutation.mutate({ index, imageUrl });
        }
      },
    ]);
  };

  const handleScrollToDetails = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 500, animated: true });
    }
  };

  const handleScrollToTop = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollPositionRef.current = event.nativeEvent.contentOffset.y;
  };
  
  const handleToggleEdit = () => {
    handleScrollToTop();
    setMode('edit');
  };

  const handleToggleView = () => {
    handleScrollToTop();
    setMode('view');
  };
  
  const handleBackPress = () => {
    router.push('/profile');
  };

  const renderProfileDetailsEdit = useCallback(() => (
    <View style={styles.footerContainer}>
      <View style={styles.sectionContainer}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="information-circle-outline" size={28} color={COLORS.textPrimary} style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>O meni</Text>
        </View>
        <TouchableOpacity
          onPress={() => handleCardPress('/profile/edit/editBio', { currentBio: profile.bio || '' })}
          style={styles.infoCard}
        >
          <View style={styles.infoContentContainer}>
            {profile.bio ? (
              <Text style={styles.bioText}>{profile.bio}</Text>
            ) : (
              <Text style={styles.placeholderTextWithIcon}>
                Dodaj nešto o sebi
              </Text>
            )}
            <Ionicons name="chevron-forward" size={16} color={styles.chevronIcon.color} style={styles.chevronIcon} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionContainer}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="briefcase-outline" size={28} color={COLORS.textPrimary} style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Osnovne informacije</Text>
        </View>
        <SimpleSectionCard
          iconName="briefcase-outline"
          iconColor={COLORS.textPrimary}
          title="Posao"
          value={profile.job}
          onPress={() => handleCardPress('/profile/edit/job', { currentJob: profile.job || '' })}
          mode={mode}
        />
        <SimpleSectionCard
          iconName="school-outline"
          iconColor={COLORS.textPrimary}
          title="Obrazovanje"
          value={profile.education}
          onPress={() => handleCardPress('/profile/edit/education', { currentEducation: profile.education || '' })}
          mode={mode}
        />
        <SimpleSectionCard
          iconName="location-outline"
          iconColor={COLORS.textPrimary}
          title="Živi u"
          value={profile.location?.locationCity}
          onPress={() => handleCardPress('/profile/edit/location', { currentLocation: JSON.stringify(profile.location) })}
          mode={mode}
        />
        <SimpleSectionCard
          iconName="person-outline"
          iconColor={COLORS.textPrimary}
          title="Pol"
          value={profile.gender}
          onPress={() => handleCardPress('/profile/edit/gender', { currentGender: profile.gender || '' })}
          mode={mode}
        />
        <SimpleSectionCard
          iconName="transgender-outline"
          iconColor={COLORS.textPrimary}
          title="Seksualna orijentacija"
          value={profile.sexualOrientation}
          onPress={() => handleCardPress('/profile/edit/sexualOrientation', { currentSexualOrientation: profile.sexualOrientation || '' })}
          mode={mode}
        />
      </View>

      <View style={styles.sectionContainer}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="bicycle-outline" size={28} color={COLORS.textPrimary} style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Životni stil</Text>
        </View>
        <SimpleSectionCard
          iconName="paw-outline"
          iconColor={COLORS.textPrimary}
          title="Ljubimci"
          value={profile.pets}
          onPress={() => handleCardPress('/profile/edit/pets', { currentPets: profile.pets || '' })}
          mode={mode}
        />
        <SimpleSectionCard
          iconName="beer-outline"
          iconColor={COLORS.textPrimary}
          title="Piće"
          value={profile.drinks}
          onPress={() => handleCardPress('/profile/edit/drinks', { currentDrinks: profile.drinks || '' })}
          mode={mode}
        />
        <SimpleSectionCard
          iconName="bonfire-outline"
          iconColor={COLORS.textPrimary}
          title="Koliko često pušiš"
          value={profile.smokes}
          onPress={() => handleCardPress('/profile/edit/smokes', { currentSmokes: profile.smokes || '' })}
          mode={mode}
        />
        <SimpleSectionCard
          iconName="barbell-outline"
          iconColor={COLORS.textPrimary}
          title="Vežbanje"
          value={profile.workout}
          onPress={() => handleCardPress('/profile/edit/workout', { currentWorkout: profile.workout || '' })}
          mode={mode}
        />
        <SimpleSectionCard
          iconName="nutrition-outline"
          iconColor={COLORS.textPrimary}
          title="Ishrana"
          value={profile.diet}
          onPress={() => handleCardPress('/profile/edit/diet', { currentDiet: profile.diet || '' })}
          mode={mode}
        />
      </View>

      <View style={styles.sectionContainer}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="chatbubbles-outline" size={28} color={COLORS.textPrimary} style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Kakvu vezu želim</Text>
        </View>
        <SimpleSectionCard
          iconName="heart-outline"
          iconColor={COLORS.textPrimary}
          title="Tip veze"
          value={profile.relationshipType}
          onPress={() => handleCardPress('/profile/edit/relationshipType', { currentRelationshipType: profile.relationshipType })}
          mode={mode}
        />
      </View>
      <View style={styles.sectionContainer}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="heart-circle-outline" size={28} color={COLORS.textPrimary} style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Interesovanja</Text>
        </View>
        <TouchableOpacity
          onPress={() => handleCardPress('/profile/edit/interests', { currentInterests: JSON.stringify(profile.interests) })}
          style={styles.infoCard}
        >
          <View style={styles.infoContentContainer}>
            {profile.interests.length > 0 ? (
              <View style={styles.tagsDisplayContainer}>
                {profile.interests.slice(0, 3).map((tag, index) => (
                  <View key={index} style={styles.interestTag}>
                    <Text style={styles.interestText}>{tag}</Text>
                  </View>
                ))}
                {profile.interests.length > 3 && (
                  <Text style={styles.seeAllText}>...</Text>
                )}
              </View>
            ) : (
              <Text style={styles.placeholderTextWithIcon}>
                Dodaj interesovanja
              </Text>
            )}
            <Ionicons name="chevron-forward" size={16} color={styles.chevronIcon.color} style={styles.chevronIcon} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionContainer}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="resize-outline" size={28} color={COLORS.textPrimary} style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Tvoja visina</Text>
        </View>
        <TouchableOpacity
          onPress={() => handleCardPress('/profile/edit/height', { currentHeight: profile.height ? profile.height.toString() : '' })}
          style={styles.infoCard}
        >
          <View style={styles.infoContentContainer}>
            {profile.height ? (
              <Text style={styles.subSectionValueText}>
                {profile.height} cm
              </Text>
            ) : (
              <Text style={styles.placeholderTextWithIcon}>
                Dodaj svoju visinu
              </Text>
            )}
            <Ionicons name="chevron-forward" size={16} color={styles.chevronIcon.color} style={styles.chevronIcon} />
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.sectionContainer}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="language-outline" size={28} color={COLORS.textPrimary} style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Jezici koje govorite</Text>
        </View>
        <TouchableOpacity
          onPress={() => handleCardPress('/profile/edit/languages', { currentLanguages: JSON.stringify(profile.languages) })}
          style={styles.infoCard}
        >
          <View style={styles.infoContentContainer}>
            {profile.languages.length > 0 ? (
              <View style={styles.tagsDisplayContainer}>
                {profile.languages.slice(0, 3).map((lang, index) => (
                  <View key={index} style={styles.interestTag}>
                    <Text style={styles.interestText}>{lang}</Text>
                  </View>
                ))}
                {profile.languages.length > 3 && (
                  <Text style={styles.seeAllText}>...</Text>
                )}
              </View>
            ) : (
              <Text style={styles.placeholderTextWithIcon}>
                Dodaj jezike
              </Text>
            )}
            <Ionicons name="chevron-forward" size={16} color={styles.chevronIcon.color} style={styles.chevronIcon} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionContainer}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="information-circle-outline" size={28} color={COLORS.textPrimary} style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Osobine i stavovi</Text>
        </View>
        <SimpleSectionCard
          iconName="star-outline"
          iconColor={COLORS.textPrimary}
          title="Horoskop"
          value={profile.horoscope}
          onPress={() => handleCardPress('/profile/edit/horoscope', { currentHoroscope: profile.horoscope || '' })}
          mode={mode}
        />
        <SimpleSectionCard
          iconName="people-outline"
          iconColor={COLORS.textPrimary}
          title="Porodični planovi"
          value={profile.familyPlans}
          onPress={() => handleCardPress('/profile/edit/familyPlans', { currentFamilyPlans: profile.familyPlans || '' })}
          mode={mode}
        />
        <SimpleSectionCard
          iconName="chatbox-outline"
          iconColor={COLORS.textPrimary}
          title="Stil komunikacije"
          value={profile.communicationStyle}
          onPress={() => handleCardPress('/profile/edit/communicationStyle', { currentCommunicationStyle: profile.communicationStyle || '' })}
          mode={mode}
        />
        <SimpleSectionCard
          iconName="heart-outline"
          iconColor={COLORS.textPrimary}
          title="Ljubavni stil"
          value={profile.loveStyle}
          onPress={() => handleCardPress('/profile/edit/loveStyle', { currentLoveStyle: profile.loveStyle || '' })}
          mode={mode}
        />
      </View>

    </View>
  ), [profile, mode]);

  const normalizedProfile: UserProfileData = {
    ...profile,
    location: typeof profile.location === 'string'
      ? { locationCity: profile.location, locationCountry: '' }
      : profile.location || { locationCity: '', locationCountry: '' },
  };

  const renderProfileDetailsView = useCallback(() => (
    <View style={styles.footerContainer}>
        <ProfileDetailsView profile={normalizedProfile} />
    </View>
  ), [normalizedProfile]);

  if (isUserLoading || isImagesLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <ProfileHeader 
          title="Uredi Profil"
          onPressBack={handleBackPress}
          mode={mode}
          onToggleEdit={handleToggleEdit}
          onToggleView={handleToggleView}
        />

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollViewContent}
          scrollEventThrottle={16}
          onScroll={handleScroll}
        >
          {mode === 'edit' ? (
            <>
              <ProfilePhotoGrid 
                images={images}
                uploadingIndex={uploadingIndex}
                onAddImage={pickAndUploadImage}
                onRemoveImage={removeImage}
              />
              {renderProfileDetailsEdit()}
            </>
          ) : (
            <>
              <ProfileCarousel
                images={images}
                fullName={userData?.fullName || ''}
                age={userAge}
                onShowSlider={handleScrollToDetails}
                locationCity={normalizedProfile?.location?.locationCity || ''}
                showLocation={userData?.showLocation || false}
              />
              <ProfileDetailsView profile={normalizedProfile} />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
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
  scrollViewContent: {
    flex: 1,
  },
  footerContainer: {
    paddingHorizontal: 20,
    alignItems: 'flex-start',
    marginBottom: 50,
  },
  sectionContainer: {
    alignSelf: 'stretch',
    marginVertical: 10,
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
    paddingVertical: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
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
  subSectionValueText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginRight: 5,
  },
  chevronIcon: {
    marginLeft: 5,
    color: COLORS.textSecondary,
  },
  signOutButton: {
    marginTop: 30,
    backgroundColor: '#ff4d4f',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  signOutButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

const viewStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 50,
  },
  section: {
    marginBottom: 25,
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginLeft: 10,
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: '#777',
    fontWeight: '400',
    flexShrink: 1,
    textAlign: 'right',
  },
  bioText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  tag: {
    backgroundColor: '#e6f7ff',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#91d5ff',
  },
  tagText: {
    fontSize: 14,
    color: '#0050b3',
    fontWeight: '600',
  },
  placeholderText: {
      fontSize: 16,
      fontStyle: 'italic',
      color: '#999',
  }
});
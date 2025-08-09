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
  Switch,
 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuthContext } from '../../context/AuthContext';
import { useProfile, UserProfile } from '../../context/ProfileContext';
import { useRouter, useFocusEffect, useLocalSearchParams, UnknownInputParams } from 'expo-router';
import ProfileCarousel from '../../components/ProfileCarousel';
import ProfileHeader from '../../components/ProfileHeader';
import ProfilePhotoGrid from '../../components/ProfilePhotoGrid';
import {
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import JobModal from './edit/JobModal';

const windowHeight = Dimensions.get('window').height;

interface SimulatedImage {
  path: string;
}

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

const API_B = process.env.EXPO_PUBLIC_API_BASE_URL;


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
  fullName?: string;
  birthDate?: string;
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
          <Text style={viewStyles.placeholderText}>Nema unetih informacija o vas.</Text>
        )}
      </View>

      <View style={viewStyles.section}>
        <Text style={viewStyles.sectionTitle}>Osnovne informacije</Text>
        {renderInfoRow('briefcase-outline', 'Posao', profile.job)}
        {renderInfoRow('school-outline', 'Obrazovanje', profile.education)}
        {renderInfoRow('location-outline', 'Živi u', profile.location?.locationCity)}
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
  | '/profile/edit/JobModal'
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
  const { profile, setProfileField, loadProfile } = useProfile();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [mode, setMode] = useState<'edit' | 'view'>('edit');
  const params = useLocalSearchParams();
  
  const [isJobModalVisible, setJobModalVisible] = useState(false);

  const handleOpenJobModal = useCallback(() => {
    setJobModalVisible(true);
  }, []);
  
  const handleSaveJob = (newJobTitle: string | null) => {
    setProfileField('job', newJobTitle);
    setJobModalVisible(false);
    
    setPendingUpdates(prev => [...prev.filter(u => u.field !== 'job'), { field: 'job', value: newJobTitle }]);
  };

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

        const res = await axios.get(`${API_B}/api/user/${user?.id}`, {
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

        const res = await axios.get(`${API_B}/api/user/profile-pictures`, {
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
        console.log('Sending payload to backend:', payload);
        if (!user?.token) {
          throw new Error("Token nije dostupan.");
        }
        
        let requestPayload = payload;
        if ('showLocation' in payload) {
          requestPayload = { field: 'showLocation', value: payload.showLocation };
        }

        const response = await axios.put(
          `${API_B}/api/user/update-profile`,
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
        console.log('Updating query cache for field:', field, 'with value:', value);
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
        `${API_B}/api/user/upload-profile-picture`,
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
        `${API_B}/api/user/delete-profile-picture`,
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

  const handleLocationToggle = () => {
    const newValue = !isLocationEnabled;
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
  const fullName = userData?.fullName || '';

  const handleCardPress = useCallback((path: RoutePath, params: RouteParams) => {
    router.push({ pathname: path, params: params as unknown as UnknownInputParams });
  }, [router]);
  
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
              const image: SimulatedImage = await new Promise(resolve => {
                console.log('Pretpostavljena funkcionalnost za izbor slike iz galerije...');
                resolve({ path: 'path/to/image.jpg' });
              });

              if (image) {
                const uri = image.path;
                setUploadingIndex(index);
                uploadImageMutation.mutate({ uri, index });
              }
            } catch (e: unknown) {
                Alert.alert('Greška', 'Došlo je do greške prilikom obrade slike.');
            }
          },
        },
        {
          text: 'Napravi fotografiju',
          onPress: async () => {
            try {
              const image: SimulatedImage = await new Promise(resolve => {
                console.log('Pretpostavljena funkcionalnost za snimanje fotografije...');
                resolve({ path: 'path/to/camera_image.jpg' });
              });
              if (image) {
                const uri = image.path;
                setUploadingIndex(index);
                uploadImageMutation.mutate({ uri, index });
              }
            } catch (e: unknown) {
                Alert.alert('Greška', 'Došlo je do greške prilikom obrade slike.');
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
    setMode('edit');
  };

  const handleToggleView = () => {
    setMode('view');
  };
  
  const handleBackPress = () => {
    if (mode === 'view') {
      setMode('edit');
      handleScrollToTop();
    } else {
      router.push('/profile');
    }
  };
  
  const handleShowSlider = () => {
    console.log('Prikaz slidera');
  };

  const renderProfileDetailsEdit = useCallback(() => {
    const renderEditCard = (
      iconName: IconNames,
      title: string,
      value: string | number | null | undefined,
      onPress: () => void,
      isToggle = false,
      isToggleEnabled = false,
    ) => (
      <TouchableOpacity
        onPress={onPress}
        style={styles.infoCard}
      >
        <View style={styles.infoContentContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name={iconName} size={20} color={COLORS.textPrimary} style={styles.icon} />
            <View style={styles.textContent}>
              <Text style={styles.titleText}>{title}</Text>
              {value ? (
                <Text style={styles.valueText} numberOfLines={1}>
                  {value}
                </Text>
              ) : (
                <Text style={styles.placeholderTextWithIcon}>
                  Dodaj {title.toLowerCase()}
                </Text>
              )}
            </View>
          </View>
          {isToggle ? (
            <Switch
              onValueChange={onPress}
              value={isToggleEnabled}
              trackColor={{ false: '#767577', true: COLORS.primary }}
              thumbColor={isToggleEnabled ? COLORS.white : '#f4f3f4'}
            />
          ) : (
            <Ionicons name="chevron-forward" size={16} color={styles.chevronIcon.color} style={styles.chevronIcon} />
          )}
        </View>
      </TouchableOpacity>
    );

    const renderTagsCard = (
      title: string,
      tags: string[],
      onPress: () => void
    ) => (
      <TouchableOpacity
        onPress={onPress}
        style={styles.infoCard}
      >
        <View style={styles.infoContentContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="heart-circle-outline" size={20} color={COLORS.textPrimary} style={styles.icon} />
            <View style={styles.textContent}>
              <Text style={styles.titleText}>{title}</Text>
              {tags.length > 0 ? (
                <View style={styles.tagsDisplayContainer}>
                  {tags.slice(0, 3).map((tag, index) => (
                    <View key={index} style={styles.interestTag}>
                      <Text style={styles.interestText}>{tag}</Text>
                    </View>
                  ))}
                  {tags.length > 3 && (
                    <Text style={styles.seeAllText}>...</Text>
                  )}
                </View>
              ) : (
                <Text style={styles.placeholderTextWithIcon}>
                  Dodaj {title.toLowerCase()}
                </Text>
              )}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={styles.chevronIcon.color} style={styles.chevronIcon} />
        </View>
      </TouchableOpacity>
    );

    return (
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
              <View style={{ flex: 1, marginRight: 10 }}> 
                {profile.bio ? (
                  <Text style={styles.bioText}>{profile.bio}</Text>
                ) : (
                  <Text style={styles.placeholderTextWithIcon}>
                    Dodaj nešto o sebi
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={16} color={styles.chevronIcon.color} style={styles.chevronIcon} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="briefcase-outline" size={28} color={COLORS.textPrimary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Osnovne informacije</Text>
          </View>
          {renderEditCard('briefcase-outline', 'Posao', profile.job, handleOpenJobModal)}
          {renderEditCard('school-outline', 'Obrazovanje', profile.education, () => handleCardPress('/profile/edit/education', { currentEducation: profile.education || '' }))}
          {renderEditCard('location-outline', 'Živi u', profile.location?.locationCity, handleLocationToggle, true, isLocationEnabled)}
          {renderEditCard('person-outline', 'Pol', profile.gender, () => handleCardPress('/profile/edit/gender', { currentGender: profile.gender || '' }))}
          {renderEditCard('transgender-outline', 'Seksualna orijentacija', profile.sexualOrientation, () => handleCardPress('/profile/edit/sexualOrientation', { currentSexualOrientation: profile.sexualOrientation || '' }))}
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="bicycle-outline" size={28} color={COLORS.textPrimary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Životni stil</Text>
            </View>
            {renderEditCard('paw-outline', 'Ljubimci', profile.pets, () => handleCardPress('/profile/edit/pets', { currentPets: profile.pets || '' }))}
            {renderEditCard('beer-outline', 'Piće', profile.drinks, () => handleCardPress('/profile/edit/drinks', { currentDrinks: profile.drinks || '' }))}
            {renderEditCard('bonfire-outline', 'Koliko često pušiš', profile.smokes, () => handleCardPress('/profile/edit/smokes', { currentSmokes: profile.smokes || '' }))}
            {renderEditCard('barbell-outline', 'Vežbanje', profile.workout, () => handleCardPress('/profile/edit/workout', { currentWorkout: profile.workout || '' }))}
            {renderEditCard('nutrition-outline', 'Ishrana', profile.diet, () => handleCardPress('/profile/edit/diet', { currentDiet: profile.diet || '' }))}
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="chatbubbles-outline" size={28} color={COLORS.textPrimary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Kakvu vezu želim</Text>
          </View>
          {renderEditCard('heart-outline', 'Tip veze', profile.relationshipType, () => handleCardPress('/profile/edit/relationshipType', { currentRelationshipType: profile.relationshipType }))}
        </View>
        
        <View style={styles.sectionContainer}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="heart-circle-outline" size={28} color={COLORS.textPrimary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Interesovanja</Text>
          </View>
          {renderTagsCard('Interesovanja', profile.interests, () => handleCardPress('/profile/edit/interests', { currentInterests: JSON.stringify(profile.interests) }))}
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="resize-outline" size={28} color={COLORS.textPrimary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Tvoja visina</Text>
          </View>
          {renderEditCard('resize-outline', 'Visina', profile.height ? `${profile.height} cm` : null, () => handleCardPress('/profile/edit/height', { currentHeight: profile.height ? profile.height.toString() : '' }))}
        </View>
        
        <View style={styles.sectionContainer}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="language-outline" size={28} color={COLORS.textPrimary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Jezici koje govorite</Text>
          </View>
          {renderTagsCard('Jezici', profile.languages, () => handleCardPress('/profile/edit/languages', { currentLanguages: JSON.stringify(profile.languages) }))}
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="information-circle-outline" size={28} color={COLORS.textPrimary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Osobine i stavovi</Text>
          </View>
          {renderEditCard('star-outline', 'Horoskop', profile.horoscope, () => handleCardPress('/profile/edit/horoscope', { currentHoroscope: profile.horoscope || '' }))}
          {renderEditCard('people-outline', 'Porodični planovi', profile.familyPlans, () => handleCardPress('/profile/edit/familyPlans', { currentFamilyPlans: profile.familyPlans || '' }))}
          {renderEditCard('chatbox-outline', 'Stil komunikacije', profile.communicationStyle, () => handleCardPress('/profile/edit/communicationStyle', { currentCommunicationStyle: profile.communicationStyle || '' }))}
          {renderEditCard('heart-outline', 'Ljubavni stil', profile.loveStyle, () => handleCardPress('/profile/edit/loveStyle', { currentLoveStyle: profile.loveStyle || '' }))}
        </View>
      </View>
    );
  }, [profile, isLocationEnabled, handleCardPress, handleOpenJobModal, handleLocationToggle]);

  const renderProfileDetailsView = useCallback(() => (
    <View style={viewStyles.container}>
      <ProfileDetailsView profile={profile} />
    </View>
  ), [profile]);

  if (isUserLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const headerTitle = userData ? `${userData.fullName} ${userAge !== null ? `, ${userAge}` : ''}` : 'Učitavanje...';
  const showScrollButton = mode === 'view';

return (
  <SafeAreaView style={styles.safeArea}>
    <GestureHandlerRootView style={styles.flex1}>
      <View style={styles.container}>
        <ProfileHeader
          title={headerTitle}
          onPressBack={handleBackPress}
          mode={mode}
          onToggleEdit={handleToggleEdit}
          onToggleView={handleToggleView}
        />
        {mode === 'edit' ? (
          <ScrollView
            ref={scrollViewRef}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={styles.scrollView}
          >
            <ProfilePhotoGrid
              images={images}
              onAddImage={pickAndUploadImage}
              onRemoveImage={removeImage}
              uploadingIndex={uploadingIndex}
              mode={mode}
            />
            {renderProfileDetailsEdit()}
          </ScrollView>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={styles.scrollView}
          >
            <View style={styles.carouselWrapper}>
            <ProfileCarousel
              images={images.filter((img) => img !== null)}
              fullName={fullName}
              age={userAge}
              locationCity={profile.location?.locationCity || ''}
              showLocation={isLocationEnabled}
              onShowSlider={handleScrollToDetails}
            />
            </View>
            {renderProfileDetailsView()}
          </ScrollView>
        )}
      </View>
    </GestureHandlerRootView>

    <JobModal
      isVisible={isJobModalVisible}
      onClose={() => setJobModalVisible(false)}
      onSave={handleSaveJob}
      currentJob={profile.job || ''}
    />
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  carouselWrapper: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 35,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  footerContainer: {
    padding: 16,
  },
  detailsScrollView: {
  position: 'absolute',
  top: windowHeight * 0.7,
  left: 0,
  right: 0,
},

carouselAndDetailsContainer: {
  flex: 1,

  
},
  sectionContainer: {
    marginBottom: 20,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  infoContentContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bioText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  placeholderTextWithIcon: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  chevronIcon: {
    color: COLORS.textSecondary,
  },
  tagsDisplayContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  interestTag: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    color: COLORS.white,
    fontSize: 14,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  subSectionValueText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  scrollButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: COLORS.primary,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  flex1: {
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  textContent: {
    flex: 1,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  valueText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

const viewStyles = StyleSheet.create({
  container: {
    padding: 16,
  },
  section: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  bioText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  placeholderText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginLeft: 8,
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: COLORS.white,
    fontSize: 14,
  },
});
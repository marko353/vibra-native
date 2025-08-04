import React, { useCallback, useState, useEffect, useRef } from 'react';
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
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAuthContext } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { useRouter, useFocusEffect, useLocalSearchParams, UnknownInputParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import ProfileCarousel from '../../components/ProfileCarousel';
import {
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedRef,
  useScrollViewOffset,
} from 'react-native-reanimated';


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

interface SimpleSectionCardProps {
  iconName: IconNames;
  iconColor: string;
  title: string;
  value: string | null | number | string[];
  gradientColors: [string, string, ...string[]];
  onPress: () => void;
  mode: 'edit' | 'view';
}

const SimpleSectionCard: React.FC<SimpleSectionCardProps> = ({ iconName, iconColor, title, value, gradientColors, onPress, mode }) => {
  const CardContent = (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.infoCard}
    >
      <View style={styles.subSectionContent}>
        <View style={styles.subSectionLeft}>
          <Ionicons name={iconName} size={20} color={iconColor} style={styles.subSectionItemIcon} />
          <Text style={styles.subSectionItemText}>{title}</Text>
        </View>
        <View style={styles.subSectionRight}>
          <Text style={styles.subSectionValueText}>
            {Array.isArray(value) ? (value.length > 0 ? value.join(', ') : "Dodaj") : (value ? (typeof value === 'number' ? `${value} cm` : value) : "Dodaj")}
          </Text>
          {mode === 'edit' && <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} style={styles.chevronIcon} />}
        </View>
      </View>
    </LinearGradient>
  );

  if (mode === 'edit') {
    return (
      <TouchableOpacity onPress={onPress} style={styles.sectionCard}>
        {CardContent}
      </TouchableOpacity>
    );
  } else {
    return (
      <View style={styles.sectionCard}>
        {CardContent}
      </View>
    );
  }
};

interface UserProfileData {
  bio: string | null;
  job: string | null;
  education: string | null;
  location: string | null;
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
  
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();
  const cardSectionRef = useRef<View | null>(null);
  const scrollPositionRef = useRef<number>(0);
  
  const scrollOffset = useScrollViewOffset(scrollViewRef);


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
  
  const updateProfileMutation = useMutation({
    mutationFn: async (payload: { field: string; value: any }) => {
      if (!user?.token) {
        throw new Error("Token nije dostupan.");
      }
      const response = await axios.put(
        `${API_BASE_URL}/api/user/update-profile`,
        { [payload.field]: payload.value },
        {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return { field: payload.field, value: payload.value };
    },
    onSuccess: (data) => {
      setProfileField(data.field as keyof typeof profile, data.value);
      queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] });
    },
    onError: (error, variables) => {
      console.error("Greška pri slanju podataka na bekkend:", error);
      Alert.alert('Greška', `Došlo je do greške prilikom ažuriranja ${variables.field}.`);
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async ({ uri, index }: { uri: string; index: number }) => {
      if (!user?.token) throw new Error("Token nije dostupan.");

      const formData = new FormData();
      // @ts-ignore
      formData.append('image', {
        uri,
        type: 'image/jpeg',
        name: `profile-picture-${Date.now()}.jpg`,
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
      loadProfile(userData);
    }
  }, [userData]);

  useFocusEffect(
    useCallback(() => {
      const handleUpdate = (field: keyof typeof profile, paramKey: string, parseFn?: (value: string) => any) => {
        const paramValue = params[paramKey];
        if (paramValue !== undefined) {
          let valueToSet = paramValue;
          if (parseFn) {
            try {
              valueToSet = parseFn(paramValue as string);
            } catch (e) {
              return;
            }
          }
          
          updateProfileMutation.mutate({ field: field, value: valueToSet });
          
          router.setParams({ [paramKey]: undefined });
        }
      };
      
      handleUpdate('bio', 'updatedBio');
      handleUpdate('relationshipType', 'updatedRelationshipType');
      handleUpdate('interests', 'selectedInterests', (value) => JSON.parse(value));
      handleUpdate('height', 'updatedHeight', (value) => Number(value));
      handleUpdate('languages', 'updatedLanguages', (value) => JSON.parse(value));
      handleUpdate('horoscope', 'updatedHoroscope');
      handleUpdate('familyPlans', 'updatedFamilyPlans');
      handleUpdate('communicationStyle', 'updatedCommunicationStyle');
      handleUpdate('loveStyle', 'updatedLoveStyle');
      handleUpdate('pets', 'updatedPets');
      handleUpdate('drinks', 'updatedDrinks');
      handleUpdate('smokes', 'updatedSmokes');
      handleUpdate('workout', 'updatedWorkout');
      handleUpdate('diet', 'updatedDiet');
      handleUpdate('job', 'updatedJob');
      handleUpdate('education', 'updatedEducation');
      handleUpdate('location', 'updatedLocation');
      handleUpdate('gender', 'updatedGender');
      handleUpdate('sexualOrientation', 'updatedSexualOrientation');

      if (scrollViewRef.current && scrollPositionRef.current > 0) {
        scrollViewRef.current.scrollTo({ y: scrollPositionRef.current, animated: false });
      }

    }, [params, router, updateProfileMutation, profile, scrollViewRef])
  );

  const userAge = userData ? calculateAge(userData.birthDate) : null;
  
  const handleCardPress = (path: RoutePath, params: RouteParams) => {
    const currentScrollOffset = scrollOffset.value;
    scrollPositionRef.current = currentScrollOffset;
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
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
  
  const renderPhotoItem = ({ item, index }: { item: string | null; index: number }) => (
    <View style={styles.card}>
      {item ? (
        <>
          <Image source={{ uri: item }} style={styles.image} />
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => removeImage(index)}
          >
            <Ionicons name="close" size={18} color="#fff" />
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.placeholderContainer}>
          <View style={styles.placeholder}>
            <Text style={styles.plus}>+</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => pickAndUploadImage(index)}
            disabled={uploadingIndex === index}
          >
            {uploadingIndex === index ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Ionicons name="add-circle" size={35} color={COLORS.primary} />
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderPhotoGrid = () => (
    <View>
      <Text style={styles.photosTitle}>Dodajte svoje fotografije</Text>
      <FlatList
        data={images}
        keyExtractor={(_, index) => `image-${index}`}
        renderItem={renderPhotoItem}
        numColumns={3}
        scrollEnabled={false}
        contentContainerStyle={{ paddingHorizontal: 10 }}
      />
    </View>
  );

  const renderProfileDetailsEdit = useCallback(() => (
    <View style={styles.footerContainer} ref={cardSectionRef}>
      <View style={styles.sectionContainer}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="information-circle-outline" size={28} color={COLORS.primary} style={styles.sectionIcon} />
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
            <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} style={styles.chevronIcon} />
          </View>
        </TouchableOpacity>
      </View>
      
      <View style={styles.sectionContainer}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="briefcase-outline" size={28} color="#7D3C98" style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Osnovne informacije</Text>
        </View>
        <SimpleSectionCard
          iconName="briefcase-outline"
          iconColor="#7D3C98"
          title="Posao"
          value={profile.job}
          gradientColors={['#E8DAEF', '#D2B4DE']}
          onPress={() => handleCardPress('/profile/edit/job', { currentJob: profile.job || '' })}
          mode={mode}
        />
        <SimpleSectionCard
          iconName="school-outline"
          iconColor="#2980B9"
          title="Obrazovanje"
          value={profile.education}
          gradientColors={['#D6EAF8', '#A9CCE3']}
          onPress={() => handleCardPress('/profile/edit/education', { currentEducation: profile.education || '' })}
          mode={mode}
        />
        <SimpleSectionCard
          iconName="location-outline"
          iconColor="#16A085"
          title="Živim na lokaciji"
          value={profile.location}
          gradientColors={['#D1F2EB', '#A3E4D7']}
          onPress={() => handleCardPress('/profile/edit/location', { currentLocation: profile.location || '' })}
          mode={mode}
        />
        <SimpleSectionCard
          iconName="person-outline"
          iconColor="#E91E63"
          title="Pol"
          value={profile.gender}
          gradientColors={['#FADBD8', '#F5B7B1']}
          onPress={() => handleCardPress('/profile/edit/gender', { currentGender: profile.gender || '' })}
          mode={mode}
        />
        <SimpleSectionCard
          iconName="transgender-outline"
          iconColor="#9B59B6"
          title="Seksualna orijentacija"
          value={profile.sexualOrientation}
          gradientColors={['#EBDEF0', '#D7BDE2']}
          onPress={() => handleCardPress('/profile/edit/sexualOrientation', { currentSexualOrientation: profile.sexualOrientation || '' })}
          mode={mode}
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
          value={profile.pets}
          gradientColors={['#F5F7F8', '#ECF0F1']}
          onPress={() => handleCardPress('/profile/edit/pets', { currentPets: profile.pets || '' })}
          mode={mode}
        />
        <SimpleSectionCard
          iconName="beer-outline"
          iconColor="#F1C40F"
          title="Piće"
          value={profile.drinks}
          gradientColors={['#FFF8E1', '#FFECB3']}
          onPress={() => handleCardPress('/profile/edit/drinks', { currentDrinks: profile.drinks || '' })}
          mode={mode}
        />
        <SimpleSectionCard
          iconName="bonfire-outline"
          iconColor="#E67E22"
          title="Koliko često pušiš"
          value={profile.smokes}
          gradientColors={['#FDF2E9', '#F9E7D9']}
          onPress={() => handleCardPress('/profile/edit/smokes', { currentSmokes: profile.smokes || '' })}
          mode={mode}
        />
        <SimpleSectionCard
          iconName="barbell-outline"
          iconColor="#34495E"
          title="Vežbanje"
          value={profile.workout}
          gradientColors={['#EAF2F8', '#D6EAF8']}
          onPress={() => handleCardPress('/profile/edit/workout', { currentWorkout: profile.workout || '' })}
          mode={mode}
        />
        <SimpleSectionCard
          iconName="nutrition-outline"
          iconColor="#27AE60"
          title="Ishrana"
          value={profile.diet}
          gradientColors={['#E8F8F5', '#D1F2EB']}
          onPress={() => handleCardPress('/profile/edit/diet', { currentDiet: profile.diet || '' })}
          mode={mode}
        />
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
          value={profile.relationshipType}
          gradientColors={['#FFEFEF', '#FFDADA']}
          onPress={() => handleCardPress('/profile/edit/relationshipType', { currentRelationshipType: profile.relationshipType })}
          mode={mode}
        />
      </View>
      <View style={styles.sectionContainer}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="heart-circle-outline" size={28} color="#E91E63" style={styles.sectionIcon} />
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
            <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} style={styles.chevronIcon} />
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.sectionContainer}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="resize-outline" size={28} color="#8A2BE2" style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Tvoja visina</Text>
        </View>
        <TouchableOpacity
          onPress={() => handleCardPress('/profile/edit/height', { currentHeight: profile.height ? profile.height.toString() : '' })}
          style={styles.infoCard}
        >
          <View style={styles.infoContentContainer}>
            {profile.height ? (
              <Text style={styles.selectedOptionText}>
                {profile.height} cm
              </Text>
            ) : (
              <Text style={styles.placeholderTextWithIcon}>
                Dodaj svoju visinu
              </Text>
            )}
            <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} style={styles.chevronIcon} />
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.sectionContainer}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="language-outline" size={28} color="#1E90FF" style={styles.sectionIcon} />
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
            <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} style={styles.chevronIcon} />
          </View>
        </TouchableOpacity>
      </View>
      
      <View style={styles.sectionContainer}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="information-circle-outline" size={28} color="#008080" style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Osobine i stavovi</Text>
        </View>
        <SimpleSectionCard
          iconName="star-outline"
          iconColor="#F1C40F"
          title="Horoskop"
          value={profile.horoscope}
          gradientColors={['#FFF8E1', '#FFECB3']}
          onPress={() => handleCardPress('/profile/edit/horoscope', { currentHoroscope: profile.horoscope || '' })}
          mode={mode}
        />
        <SimpleSectionCard
          iconName="people-outline"
          iconColor="#3498DB"
          title="Porodični planovi"
          value={profile.familyPlans}
          gradientColors={['#E3F2FD', '#BBDEFB']}
          onPress={() => handleCardPress('/profile/edit/familyPlans', { currentFamilyPlans: profile.familyPlans || '' })}
          mode={mode}
        />
        <SimpleSectionCard
          iconName="chatbox-outline"
          iconColor="#2ECC71"
          title="Stil komunikacije"
          value={profile.communicationStyle}
          gradientColors={['#E8F5E9', '#C8E6C9']}
          onPress={() => handleCardPress('/profile/edit/communicationStyle', { currentCommunicationStyle: profile.communicationStyle || '' })}
          mode={mode}
        />
        <SimpleSectionCard
          iconName="heart-outline"
          iconColor="#E74C3C"
          title="Ljubavni stil"
          value={profile.loveStyle}
          gradientColors={['#FDEBEC', '#FADBD8']}
          onPress={() => handleCardPress('/profile/edit/loveStyle', { currentLoveStyle: profile.loveStyle || '' })}
          mode={mode}
        />
      </View>
      
    </View>
  ), [profile, mode]);

  const renderProfileDetailsView = useCallback(() => (
    <View style={styles.footerContainer}>
        <ProfileDetailsView profile={profile} />
    </View>
  ), [profile]);
  
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
        <View style={styles.fixedHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              router.back();
            }}
          >
            <Ionicons name="arrow-back" size={28} color={COLORS.primary} />
          </TouchableOpacity>
          <View style={styles.headerContentContainer}>
            <Text style={styles.title}>Uredi Profil</Text>
            <View style={styles.toggleButtons}>
              <TouchableOpacity onPress={() => { handleScrollToTop(); setMode('edit'); }} style={styles.toggleBtn}>
                <Text style={[styles.toggleText, mode === 'edit' && styles.activeToggleText]}>
                  Uredi
                </Text>
              </TouchableOpacity>
              <View style={styles.separator} />
              <TouchableOpacity onPress={() => { handleScrollToTop(); setMode('view'); }} style={styles.toggleBtn}>
                <Text style={[styles.toggleText, mode === 'view' && styles.activeToggleText]}>
                  Pregled
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.horizontalLine} />
        </View>
        
        <Animated.ScrollView
          ref={scrollViewRef}
          style={styles.scrollViewContent}
          scrollEventThrottle={16}
        >
              {mode === 'edit' ? (
                <>
                  {renderPhotoGrid()}
                  {renderProfileDetailsEdit()}
                </>
              ) : (
                <>
                  <ProfileCarousel
                    images={images}
                    fullName={userData?.fullName || ''}
                    age={userAge}
                    onShowSlider={handleScrollToDetails}
                  />
                  <ProfileDetailsView profile={profile} />
                </>
              )}
          </Animated.ScrollView>
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
  photosHeaderContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  photosTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
    marginTop: 20,
    marginHorizontal: 15,
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerContentContainer: {
    flex: 1,
    marginLeft: 15,
  },
  backBtn: {
    paddingVertical: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'left',
    marginBottom: -10,
    marginTop: 15,
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 10,
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
    color: '#fff',
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
    backgroundColor: '#fff',
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
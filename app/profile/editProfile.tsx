import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Platform,
  ScrollView,
  Alert,
  StatusBar,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthContext } from '../../context/AuthContext';
import { useProfileContext } from '../../context/ProfileContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';

import ProfileHeader from '../../components/ProfileHeader';
import ProfilePhotoGrid from '../../components/ProfilePhotoGrid';
import ProfileEditCardsAndModals from '../../components/ProfileEditCardsAndModals';
import ProfileCarousel from '../../components/ProfileCarousel';
import ProfileDetailsView from '../../components/ProfileDetailsView';

// Uvozimo naš novi custom crop modal koji smo kreirali
import ImageCropModal from '../../components/ImageCropModal'; 

const HEADER_HEIGHT = 60;
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const COLORS = {
  primary: '#ff7f00',
  background: '#fff',
};

const screens = { languages: '/(modals)/languages', interests: '/(modals)/interests', height: '/(modals)/height', location: '/(modals)/location', bio: '/(modals)/bio', communicationStyle: '/(modals)/communicationStyle', diet: '/(modals)/diet', drinks: '/(modals)/drinks', education: '/(modals)/education', familyPlans: '/(modals)/familyPlans', gender: '/(modals)/gender', horoscope: '/(modals)/horoscope', job: '/(modals)/job', relationshipType: '/(modals)/relationshipType', loveStyle: '/(modals)/loveStyle', pets: '/(modals)/pets', smokes: '/(modals)/smokes', workout: '/(modals)/workout', sexualOrientation: '/(modals)/sexualOrientation', religion: '/(modals)/religion' } as const;

const calculateAge = (birthDateString?: string | null): number | null => {
  if (!birthDateString) return null;
  const birthDate = new Date(birthDateString);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

const compressImagesArray = (images: (string | null)[]): (string | null)[] => {
  const filtered = images.filter(img => img !== null);
  return [...filtered, ...Array(9 - filtered.length).fill(null)];
};

const globalScrollYRef = React.createRef<number>();

export default function EditProfileScreen() {
  const { user } = useAuthContext();
  const { profile, setProfileField, loadProfile } = useProfileContext();
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<'edit' | 'view'>('edit');
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [pendingUpdates, setPendingUpdates] = useState<{ field: string; value: any }[]>([]);
  const [locationCity, setLocationCity] = useState<string | null>(null);

  // Novi state za upravljanje slobodnim kropovanjem slika
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [selectedRawImage, setSelectedRawImage] = useState<string | null>(null);
  const [targetUploadIndex, setTargetUploadIndex] = useState<number>(0);

  const scrollViewRef = useRef<ScrollView>(null);
  const [initialScrollY, setInitialScrollY] = useState<number>(0);

  const { data: userData } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user?.token) return null;
      const res = await axios.get(`${API_BASE_URL}/api/user/profile`, { headers: { Authorization: `Bearer ${user.token}` } });
      return res.data;
    },
    enabled: !!user?.id
  });

  const { data: images = Array(9).fill(null) } = useQuery({
    queryKey: ['userProfilePhotos', user?.id],
    queryFn: async (): Promise<(string | null)[]> => {
      if (!user?.token) return Array(9).fill(null);
      const res = await axios.get(`${API_BASE_URL}/api/user/profile-pictures`, { headers: { Authorization: `Bearer ${user.token}` } });
      return compressImagesArray((res.data.profilePictures as any[]) || []);
    },
    enabled: !!user?.id
  });

  useEffect(() => { if (userData) { loadProfile(userData); } }, [userData, loadProfile]);

  useEffect(() => {
    const fetchCityName = async () => {
      if (profile?.location?.latitude && profile.location.longitude && profile.showLocation) {
        try {
          const geocode = await Location.reverseGeocodeAsync({
            latitude: profile.location.latitude,
            longitude: profile.location.longitude,
          });
          if (geocode.length > 0) {
            setLocationCity(geocode[0].subregion || geocode[0].city);
          }
        } catch {
          setLocationCity(null);
        }
      } else {
        setLocationCity(null);
      }
    };
    fetchCityName();
  }, [profile?.location, profile?.showLocation]);

  const uploadImageMutation = useMutation({
    mutationFn: async ({ uri, index }: { uri: string; index: number }) => {
      if (!user?.token) throw new Error("Token not available");
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'profile.jpg';
      const fileUri = Platform.OS === 'android' ? uri : uri.replace('file://', '');
      formData.append('profilePicture', { uri: fileUri, type: 'image/jpeg', name: filename } as any);
      formData.append('position', index.toString());
      return await axios.post(`${API_BASE_URL}/api/user/upload-profile-picture`, formData, { headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userProfilePhotos', user?.id] }),
    onError: () => Alert.alert("Greška", "Upload slike nije uspeo."),
    onSettled: () => setUploadingIndex(null)
  });

  const deleteImageMutation = useMutation({
    mutationFn: async ({ index, imageUrl }: { index: number; imageUrl: string }) => {
      if (!user?.token) throw new Error("Token not available");
      return await axios.delete(`${API_BASE_URL}/api/user/delete-profile-picture`, { headers: { Authorization: `Bearer ${user.token}` }, data: { imageUrl, position: index } });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userProfilePhotos', user?.id] }),
    onError: () => Alert.alert("Greška", "Brisanje slike nije uspelo.")
  });

  const reorderImagesMutation = useMutation({
    mutationFn: async (newImageOrder: (string | null)[]) => {
      if (!user?.token) throw new Error('Token not available');
      const pictures = newImageOrder.filter((p): p is string => !!p);
      await axios.put(`${API_BASE_URL}/api/user/reorder-profile-pictures`, { pictures }, { headers: { Authorization: `Bearer ${user.token}` } });
      return pictures;
    },
    onSuccess: (pictures) => {
      queryClient.setQueryData(['userProfile', user?.id], (old: any) => old ? { ...old, profilePictures: pictures } : old);
      queryClient.setQueryData(['userProfilePhotos', user?.id], compressImagesArray(pictures));
    },
    onError: () => {
      Alert.alert('Greška', 'Promena redosleda slika nije uspela na serveru.');
      queryClient.invalidateQueries({ queryKey: ['userProfilePhotos', user?.id] });
    }
  });

  useFocusEffect(
    useCallback(() => {
      const scrollYValue = globalScrollYRef.current;
      if (scrollYValue !== null && scrollYValue !== undefined) {
        setInitialScrollY(scrollYValue as unknown as number);
        (globalScrollYRef as any).current = 0;
      } else {
        setInitialScrollY(0);
      }
    }, [])
  );

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (mode === 'edit') {
      (globalScrollYRef as any).current = event.nativeEvent.contentOffset.y;
    }
  };

  const handleBack = () => router.navigate('/(tabs)/profile' as any);
  const handleOpenModal = (screenName: keyof typeof screens, extraParams?: any) =>
    router.push({ pathname: screens[screenName] as any, params: extraParams });
  const handleSettingsPress = () => router.push('./settings' as any);

  // PRILAGOĐENI TOK: Prvo otvaramo galeriju bez internog kropa, pa palimo naš modal
  const handleImageUploadPress = async (index: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Dozvola je neophodna', 'Molimo vas da omogućite pristup galeriji.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // Isključujemo loš fabrički krop
      quality: 1, // Uzimamo pun kvalitet da bi zoom bio kristalno jasan
    });
    
    if (!result.canceled && result.assets[0].uri) {
      setTargetUploadIndex(index);
      setSelectedRawImage(result.assets[0].uri);
      setCropModalVisible(true); // Otvaramo custom krop prozor sa pinch-to-zoom
    }
  };

  // Funkcija koja se okida kada pritisneš kvačicu na novom modalu
  const handleSaveCroppedImage = (croppedUri: string) => {
    setCropModalVisible(false);
    setUploadingIndex(targetUploadIndex);
    // Šaljemo tvojoj već postojećoj mutaciji ispeglanu i kropovanu sliku
    uploadImageMutation.mutate({ uri: croppedUri, index: targetUploadIndex });
  };

  if (!profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const totalHeaderHeight = insets.top + HEADER_HEIGHT;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

        {mode === 'edit' ? (
          // ─── EDIT MODE — scroll sa photo grid i karticama ───────
          <ScrollView
            ref={scrollViewRef}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={styles.scrollView}
            contentInsetAdjustmentBehavior="never"
            showsVerticalScrollIndicator={false}
            contentOffset={{ y: initialScrollY, x: 0 }}
          >
            <View style={{ paddingTop: totalHeaderHeight, backgroundColor: '#fff' }}>
              <ProfilePhotoGrid
                images={images}
                mode={mode}
                uploadingIndex={uploadingIndex}
                onAddImagePress={handleImageUploadPress}
                onRemoveImage={(index, url) => deleteImageMutation.mutate({ index, imageUrl: url })}
                onReorderImages={(newImages) => {
                  const picturesOnly = newImages.filter((p): p is string => typeof p === 'string');
                  queryClient.setQueryData(['userProfilePhotos', user?.id], newImages);
                  queryClient.setQueryData(['userProfile', user?.id], (old: any) =>
                    old ? { ...old, profilePictures: picturesOnly } : old
                  );
                  reorderImagesMutation.mutate(newImages);
                }}
              />
              <ProfileEditCardsAndModals
                profile={profile}
                locationCity={locationCity}
                onOpenModal={handleOpenModal}
                setProfileField={setProfileField}
                setPendingUpdates={setPendingUpdates}
              />
            </View>
          </ScrollView>
        ) : (
          // ─── VIEW MODE — jedan ScrollView, carousel + details ───
          <ScrollView
            style={styles.scrollView}
            contentInsetAdjustmentBehavior="never"
            showsVerticalScrollIndicator={false}
            contentOffset={{ x: 0, y: 0 }}
          >
            <ProfileCarousel
              images={images.filter((img): img is string => !!img)}
              fullName={profile.fullName || ''}
              age={calculateAge(profile.birthDate)}
              locationCity={locationCity ?? undefined}
              showLocation={profile.showLocation || false}
              onShowSlider={() => {}}
            />
            <ProfileDetailsView
              profile={profile}
              locationCity={locationCity}
            />
          </ScrollView>
        )}

        {/* Gradient pozadina za header */}
        <LinearGradient
          colors={
            mode === 'view'
              ? ['rgba(0,0,0,0.45)', 'transparent']
              : ['rgba(255,255,255,0.97)', 'transparent']
          }
          style={[styles.gradient, { height: totalHeaderHeight + 24 }]}
          pointerEvents="none"
        />

        {/* Header — uvek floating iznad */}
        <View style={[styles.headerContainer, { height: totalHeaderHeight }]}>
          <ProfileHeader
            onBackPress={handleBack}
            mode={mode}
            setMode={setMode}
            onSettingsPress={handleSettingsPress}
          />
        </View>

        {/* INTEGRACIJA: Naš novi slobodni crop modal se nalazi ovde */}
        <ImageCropModal 
          visible={cropModalVisible}
          imageUri={selectedRawImage}
          onClose={() => setCropModalVisible(false)}
          onCropSave={handleSaveCroppedImage}
        />

      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  headerContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  gradient: {
    position: 'absolute',
    left: 0, right: 0, top: 0,
    zIndex: 9,
    pointerEvents: 'none',
  },
});
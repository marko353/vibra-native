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
import * as Location from 'expo-location'; // AŽURIRANO: Uvezen Location

import ProfileHeader from '../../components/ProfileHeader';
import ProfilePhotoGrid from '../../components/ProfilePhotoGrid';
import ProfileEditCardsAndModals from '../../components/ProfileEditCardsAndModals';
import ProfileCarousel from '../../components/ProfileCarousel';
import ProfileDetailsView from '../../components/ProfileDetailsView';

const HEADER_HEIGHT = 60; // Visina samog hedera (bez SafeArea)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const COLORS = {
  primary: '#E91E63',
  background: '#F0F2F5',
  cardBackground: '#FFFFFF',
};

const screens = { languages: '/(modals)/languages', interests: '/(modals)/interests', height: '/(modals)/height', location: '/(modals)/location', bio: '/(modals)/bio', communicationStyle: '/(modals)/communicationStyle', diet: '/(modals)/diet', drinks: '/(modals)/drinks', education: '/(modals)/education', familyPlans: '/(modals)/familyPlans', gender: '/(modals)/gender', horoscope: '/(modals)/horoscope', job: '/(modals)/job', relationshipType: '/(modals)/relationshipType', loveStyle: '/(modals)/loveStyle', pets: '/(modals)/pets', smokes: '/(modals)/smokes', workout: '/(modals)/workout', sexualOrientation: '/(modals)/sexualOrientation', religion: '/(modals)/religion' } as const;
const calculateAge = (birthDateString?: string | null): number | null => { if (!birthDateString) return null; const birthDate = new Date(birthDateString); if (isNaN(birthDate.getTime())) return null; const today = new Date(); let age = today.getFullYear() - birthDate.getFullYear(); const m = today.getMonth() - birthDate.getMonth(); if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--; return age; };
const compressImagesArray = (images: (string | null)[]): (string | null)[] => { const filtered = images.filter(img => img !== null); return [...filtered, ...Array(9 - filtered.length).fill(null)]; };

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
  
  // AŽURIRANO: Ovaj state je sada zadužen za prikaz imena grada
  const [locationCity, setLocationCity] = useState<string | null>(null);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);

  const [initialScrollY, setInitialScrollY] = useState<number | null>(null);

  const { data: userData } = useQuery({ queryKey: ['userProfile', user?.id], queryFn: async () => { if (!user?.token) return null; const res = await axios.get(`${API_BASE_URL}/api/user/profile`, { headers: { Authorization: `Bearer ${user.token}` } }); return res.data; }, enabled: !!user?.id });
  const { data: images } = useQuery({ queryKey: ['userProfilePhotos', user?.id], queryFn: async (): Promise<(string | null)[]> => { if (!user?.token) return Array(9).fill(null); const res = await axios.get(`${API_BASE_URL}/api/user/profile-pictures`, { headers: { Authorization: `Bearer ${user.token}` } }); return compressImagesArray((res.data.profilePictures as any[]) || []); }, enabled: !!user?.id, initialData: Array(9).fill(null) });
  
  useEffect(() => { if (userData) { loadProfile(userData); } }, [userData, loadProfile]);

  // AŽURIRANO: Novi useEffect koji pretvara koordinate u ime grada
  useEffect(() => {
    const fetchCityName = async () => {
      if (profile?.location?.latitude && profile.location.longitude && profile.showLocation) {
        try {
          const geocode = await Location.reverseGeocodeAsync({
            latitude: profile.location.latitude,
            longitude: profile.location.longitude,
          });
          if (geocode.length > 0) {
            const city = geocode[0].subregion || geocode[0].city;
            setLocationCity(city);
          }
        } catch (error) {
          console.error("Reverse geocoding failed:", error);
          setLocationCity(null);
        }
      } else {
        setLocationCity(null);
      }
    };

    fetchCityName();
  }, [profile?.location, profile?.showLocation]);


  const uploadImageMutation = useMutation({ mutationFn: async ({ uri, index }: { uri: string; index: number }) => { if (!user?.token) throw new Error("Token not available"); const formData = new FormData(); const filename = uri.split('/').pop() || 'profile.jpg'; const fileUri = Platform.OS === 'android' ? uri : uri.replace('file://', '');  formData.append('profilePicture', { uri: fileUri, type: 'image/jpeg', name: filename } as any); formData.append('position', index.toString()); return await axios.post(`${API_BASE_URL}/api/user/upload-profile-picture`, formData, { headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'multipart/form-data' } }); }, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userProfilePhotos', user?.id] }), onError: () => Alert.alert("Greška", "Upload slike nije uspeo."), onSettled: () => setUploadingIndex(null) });
  const deleteImageMutation = useMutation({ mutationFn: async ({ index, imageUrl }: { index: number; imageUrl: string }) => { if (!user?.token) throw new Error("Token not available"); return await axios.delete(`${API_BASE_URL}/api/user/delete-profile-picture`, { headers: { Authorization: `Bearer ${user.token}` }, data: { imageUrl, position: index } }); }, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userProfilePhotos', user?.id] }), onError: () => Alert.alert("Greška", "Brisanje slike nije uspelo.") });
  const reorderImagesMutation = useMutation({ mutationFn: async (newImageOrder: (string | null)[]) => { if (!user?.token) throw new Error("Token not available"); const pictures = newImageOrder.filter((p): p is string => !!p); return await axios.put(`${API_BASE_URL}/api/user/reorder-profile-pictures`, { pictures }, { headers: { Authorization: `Bearer ${user.token}` } }); }, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userProfilePhotos', user?.id] }), onError: () => Alert.alert("Greška", "Promena redosleda slika nije uspela.") });
  
  useFocusEffect(
    useCallback(() => {
        const scrollYValue = globalScrollYRef.current;
        if (scrollYValue !== null && scrollYValue !== undefined) {
            setInitialScrollY(scrollYValue);
            globalScrollYRef.current = 0; 
        } else {
            setInitialScrollY(0);
        }
    }, [])
  );

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (mode === 'edit') {
      globalScrollYRef.current = event.nativeEvent.contentOffset.y;
    }
  };

  const handleBackPress = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'));
  const handleOpenModal = (screenName: keyof typeof screens, extraParams?: any) => router.push({ pathname: screens[screenName] as any, params: extraParams });
  const handleSettingsPress = () => router.push('./settings' as any);
  const handleImageUploadPress = async (index: number) => { 
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Dozvola je neophodna', 'Molimo vas da omogućite pristup galeriji u podešavanjima telefona.');
      return; 
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [3, 4], quality: 0.8 }); 
    if (!result.canceled && result.assets[0].uri) { 
      setUploadingIndex(index); 
      uploadImageMutation.mutate({ uri: result.assets[0].uri, index }); 
    } 
  };
  const handleShowProfileDetails = () => { if (scrollViewRef.current && contentRef.current) { contentRef.current.measure((_fx, _fy, _w, _h, _px, py) => { const scrollPosition = py - 150; scrollViewRef.current?.scrollTo({ y: scrollPosition > 0 ? scrollPosition : 0, animated: true }); }); } };

  if (!profile || initialScrollY === null) {
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
        <StatusBar 
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />
        
        {initialScrollY !== null && (
            <ScrollView
                ref={scrollViewRef}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                style={styles.scrollView}
                contentInsetAdjustmentBehavior="never"
                contentOffset={{ y: mode === 'edit' ? initialScrollY : 0, x: 0 }}
            >
                <View style={{ paddingTop: mode === 'edit' ? totalHeaderHeight : 0 }}>
                    {mode === 'edit' ? (
                    <View style={styles.editContainer}>
                        <ProfilePhotoGrid
                          images={images}
                          mode={mode}
                          uploadingIndex={uploadingIndex}
                          onAddImagePress={handleImageUploadPress}
                          onRemoveImage={(index, url) => deleteImageMutation.mutate({ index, imageUrl: url })}
                          onReorderImages={(newImages) => {
                              queryClient.setQueryData(['userProfilePhotos', user?.id], newImages);
                              reorderImagesMutation.mutate(newImages);
                          }}
                        />
                        <ProfileEditCardsAndModals
                          profile={profile}
                          locationCity={locationCity} // AŽURIRANO: Prosleđuje se pravi grad
                          onOpenModal={handleOpenModal}
                          setProfileField={setProfileField}
                          setPendingUpdates={setPendingUpdates}
                        />
                    </View>
                    ) : (
                    <>
                        <View style={styles.carouselWrapper}>
                            <ProfileCarousel
                              images={images.filter((img): img is string => !!img)}
                              fullName={profile.fullName || ''}
                              age={calculateAge(profile.birthDate)}
                              locationCity={locationCity} // AŽURIRANO: Prosleđuje se pravi grad
                              showLocation={profile.showLocation || false}
                              onShowSlider={handleShowProfileDetails}
                            />
                        </View>
                        <View ref={contentRef} style={styles.profileDetailsContainer}>
                          <ProfileDetailsView 
                              profile={profile} 
                              locationCity={locationCity} // AŽURIRANO: Prosleđuje se pravi grad
                          />
                        </View>
                    </>
                    )}
                </View>
            </ScrollView>
        )}

        <LinearGradient
          colors={['rgba(0,0,0,0.9)', 'transparent']}
          style={[styles.gradient, { height: totalHeaderHeight + 20 }]}
        />
        
        <View style={[styles.headerContainer, { height: totalHeaderHeight }]}>
          <ProfileHeader
            onBackPress={handleBackPress}
            mode={mode}
            setMode={setMode}
            onSettingsPress={handleSettingsPress}
          />
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 9, 
  },
  scrollView: {
    flex: 1,
  },
  editContainer: {
    backgroundColor: COLORS.background,
  },
  carouselWrapper: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  profileDetailsContainer: {
    backgroundColor: COLORS.cardBackground,
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    zIndex: -1,
  },
});


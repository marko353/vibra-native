import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    StyleSheet,
    ActivityIndicator,
    SafeAreaView,
    Dimensions,
    Platform,
    ScrollView,
    NativeSyntheticEvent,
    NativeScrollEvent,
    Alert,
    Text, 
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useAuthContext } from '../../context/AuthContext';
import { useProfileContext } from '../../context/ProfileContext';

import ProfileHeader from '../../components/ProfileHeader';
import ProfilePhotoGrid from '../../components/ProfilePhotoGrid';
import ProfileEditCardsAndModals from '../../components/ProfileEditCardsAndModals';
import ProfileCarousel from '../../components/ProfileCarousel';
import ProfileDetailsView from '../../components/ProfileDetailsView';

const windowHeight = Dimensions.get('window').height;
const HEADER_HEIGHT = 100;

const COLORS = {
    primary: '#E91E63',
    secondary: '#FFC107',
    accent: '#2196F3',
    textPrimary: '#1E1E1E',
    textSecondary: '#666666',
    background: '#F0F2F5',
    cardBackground: '#FFFFFF',
    placeholder: '#A0A0A0',
    border: '#E0E0E0',
    gradientStart: '#FE6B8B',
    gradientEnd: '#FF8E53',
    lightGray: '#D3D3D3',
    white: '#FFFFFF',
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const screens = {
    languages: '/(modals)/languages',
    interests: '/(modals)/interests',
    height: '/(modals)/height',
    location: '/(modals)/location',
    bio: '/(modals)/bio',
    communicationStyle: '/(modals)/communicationStyle',
    diet: '/(modals)/diet',
    drinks: '/(modals)/drinks',
    education: '/(modals)/education',
    familyPlans: '/(modals)/familyPlans',
    gender: '/(modals)/gender',
    horoscope: '/(modals)/horoscope',
    job: '/(modals)/job',
    relationshipType: '/(modals)/relationshipType',
    loveStyle: '/(modals)/loveStyle',
    pets: '/(modals)/pets',
    smokes: '/(modals)/smokes',
    workout: '/(modals)/workout',
    sexualOrientation: '/(modals)/sexualOrientation',
    religion: '/(modals)/religion',
};

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
    const nullsCount = images.length - filtered.filter(Boolean).length;
    return [...filtered, ...Array(nullsCount).fill(null)];
}

interface UserProfileData {
    bio: string | null;
    jobTitle: string | null;
    education: string[] | null;
    location: {
        latitude?: number;
        longitude?: number;
        locationCity?: string;
        locationCountry?: string
    } | null;
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

const globalScrollYRef = React.createRef<number>();

export default function EditProfileScreen() {
    console.log('[EditProfileScreen] Komponenta se renderuje');

    const { user } = useAuthContext();
    const { profile, setProfileField, loadProfile } = useProfileContext();
    const router = useRouter();
    const queryClient = useQueryClient();
    const params = useLocalSearchParams();

    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
    const [mode, setMode] = useState<'edit' | 'view'>('edit');
    const [locationCity, setLocationCity] = useState<string | null>(null);
    const [pendingUpdates, setPendingUpdates] = useState<{ field: string; value: any }[]>([]);

    const scrollViewRef = useRef<ScrollView | null>(null);
    const contentRef = useRef<View | null>(null);

    const [initialScrollY, setInitialScrollY] = useState<number | null>(null);
    const [isScrolledToInitialPosition, setIsScrolledToInitialPosition] = useState(false);

    useFocusEffect(
        useCallback(() => {
            if (!isScrolledToInitialPosition) {
                const scrollY = globalScrollYRef.current;
                if (scrollY !== null) {
                    console.log('[useFocusEffect] Pronađena pozicija skrola:', scrollY);
                    setInitialScrollY(scrollY);
                    globalScrollYRef.current = null;
                } else {
                    console.log('[useFocusEffect] Nema sačuvane pozicije skrola, postavljam na 0.');
                    setInitialScrollY(0);
                }
                setIsScrolledToInitialPosition(true);
            }
        }, [isScrolledToInitialPosition])
    );

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const scrollY = event.nativeEvent.contentOffset.y;
        if (mode === 'edit') {
            globalScrollYRef.current = scrollY;
            console.log(`[onScroll] Pozicija skrola je zabeležena: ${scrollY}`);
        } else {
            console.log(`[onScroll] Trenutni režim je 'view', pozicija skrola se ne pamti.`);
        }
    };

    const handleOpenModal = (screenName: keyof typeof screens, extraParams?: any) => {
        const currentScrollY = globalScrollYRef.current || 0;
        console.log(`[handleOpenModal] Otvaram modal: ${screens[screenName]}. Trenutna pozicija skrola: ${currentScrollY}`);
        
        router.push({
            pathname: screens[screenName] as any,
            params: { ...extraParams },
        });
    };

    const handleToggleMode = () => {
        setMode(prevMode => {
            const newMode = prevMode === 'edit' ? 'view' : 'edit';
            if (newMode === 'edit' && scrollViewRef.current) {
                scrollViewRef.current.scrollTo({ y: 0, animated: true });
            } 
            
            if (newMode === 'view' && scrollViewRef.current) {
                globalScrollYRef.current = 0;
                scrollViewRef.current.scrollTo({ y: 0, animated: true });
            }

            return newMode;
        });
    };

    const handleShowProfileDetails = () => {
        if (scrollViewRef.current && contentRef.current) {
            contentRef.current.measure((fx, fy, width, height, px, py) => {
                const offset = 200;
                const scrollPosition = py - offset;
                scrollViewRef.current?.scrollTo({
                    y: scrollPosition > 0 ? scrollPosition : 0,
                    animated: true,
                });
            });
        }
    };

    const { data: userData, isLoading: isUserLoading } = useQuery({
        queryKey: ['userProfile', user?.id],
        queryFn: async () => {
            console.log('[useQuery] Dohvatam podatke profila sa servera.');
            if (!user?.token) return null;
            const res = await axios.get(`${API_BASE_URL}/api/user/profile`, {
                headers: { Authorization: `Bearer ${user?.token}` },
            });
            return {
                ...res.data,
                education: Array.isArray(res.data.education) ? res.data.education : [res.data.education].filter(Boolean),
                languages: Array.isArray(res.data.languages) ? res.data.languages : [res.data.languages].filter(Boolean),
                interests: Array.isArray(res.data.interests) ? res.data.interests : [res.data.interests].filter(Boolean),
            };
        },
        enabled: !!user?.token,
    });

    const { data: images = Array(9).fill(null), isLoading: isImagesLoading } = useQuery({
        queryKey: ['userProfilePhotos', user?.id],
        queryFn: async () => {
            console.log('[useQuery] Dohvatam fotografije profila sa servera.');
            if (!user?.token) return Array(9).fill(null);
            const res = await axios.get(`${API_BASE_URL}/api/user/profile-pictures`, {
                headers: { Authorization: `Bearer ${user.token}` },
            });
            const filledImages = Array(9).fill(null);
            if (Array.isArray(res.data.profilePictures)) {
                res.data.profilePictures.forEach((url: string, i: number) => {
                    if (i < 9) filledImages[i] = url;
                });
            }
            return filledImages;
        },
        enabled: !!user?.token,
    });

    const queryUpdateProfile = useMutation({
        mutationFn: async (payload: { field: string; value: any }) => {
            console.log('[useMutation] Šaljem ažuriranje profila na server:', payload.field);
            if (!user?.token) throw new Error("Token not available");
            const dataToSend = payload.field === 'location'
                ? { latitude: payload.value.latitude, longitude: payload.value.longitude }
                : { [payload.field]: payload.value };
            const response = await axios.put(`${API_BASE_URL}/api/user/update-profile`, dataToSend, {
                headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' },
            });
            return response.data;
        },
        onSuccess: (data, variables) => {
            console.log('[useMutation] Ažuriranje uspešno:', variables.field);
            queryClient.setQueryData(['userProfile', user?.id], (oldData: any) => {
                if (!oldData) return oldData;
                return { ...oldData, [variables.field]: variables.value };
            });
            setPendingUpdates(prev => prev.filter(update => update.field !== variables.field));
        },
        onError: (error) => {
            console.error("Mutacija neuspešna:", error);
            Alert.alert('Greška', 'Došlo je do greške prilikom ažuriranja profila.');
        },
    });

    const uploadImageMutation = useMutation({
        mutationFn: async ({ uri, index }: { uri: string; index: number }) => {
            console.log('[useMutation] Slanje slike na server za poziciju:', index);
            if (!user?.token) throw new Error("Token not available");
            const formData = new FormData();
            const filename = uri.split('/').pop();
            const fileUri = Platform.OS === 'android' ? uri : uri.replace('file://', '');
            // @ts-ignore
            formData.append('profilePicture', { uri: fileUri, type: 'image/jpeg', name: filename || `profile-picture-${Date.now()}.jpg` });
            formData.append('position', index.toString());
            const response = await axios.post(`${API_BASE_URL}/api/user/upload-profile-picture`, formData, {
                headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
        },
        onSuccess: (data, variables) => {
            console.log('[useMutation] Upload slike uspešan za poziciju:', variables.index);
            queryClient.setQueryData(['userProfilePhotos', user?.id], (oldData: (string | null)[] = []) => {
                const updated = [...oldData];
                updated[variables.index] = data.imageUrl;
                return compressImagesArray(updated);
            });
        },
        onError: (error) => {
            console.error("Upload slike neuspešan:", error);
            Alert.alert('Greška', 'Došlo je do greške prilikom slanja slike na serveru.');
        },
        onSettled: () => setUploadingIndex(null),
    });

    const deleteImageMutation = useMutation({
        mutationFn: async ({ index, imageUrl }: { index: number; imageUrl: string }) => {
            console.log('[useMutation] Slanje zahteva za brisanje slike:', index);
            if (!user?.token) throw new Error("Token not available");
            const response = await axios.delete(`${API_BASE_URL}/api/user/delete-profile-picture`, {
                headers: { Authorization: `Bearer ${user.token}` },
                data: { imageUrl, position: index },
            });
            return response.data;
        },
        onSuccess: (data, variables) => {
            console.log('[useMutation] Brisanje slike uspešno:', variables.index);
            queryClient.setQueryData(['userProfilePhotos', user?.id], (oldData: (string | null)[] = []) => {
                const newData = oldData.map((img, i) => (i === variables.index ? null : img));
                return compressImagesArray(newData);
            });
        },
        onError: (error) => {
            console.error("Brisanje slike neuspešno:", error);
            Alert.alert('Greška', 'Došlo je do greške prilikom brisanja slike sa servera.');
        },
    });

    const reorderImagesMutation = useMutation({
        mutationFn: async (newImageOrder: (string | null)[]) => {
            console.log('[useMutation] Šaljem novi redosled slika na server.');
            if (!user?.token) throw new Error("Token not available");
            const orderedImageUrls = newImageOrder.filter(url => url !== null);
            const response = await axios.put(`${API_BASE_URL}/api/user/reorder-profile-pictures`, {
                pictures: orderedImageUrls
            }, {
                headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' },
            });
            return response.data;
        },
        onSuccess: (data, variables) => {
            console.log('[useMutation] Redosled slika je uspešno sačuvan na serveru.');
        },
        onError: (error) => {
            console.error("Greška pri ređanju slika:", error);
            Alert.alert('Greška', 'Došlo je do greške prilikom promene redosleda slika.');
        },
    });

    const handleImageUploadPress = async (index: number) => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [3, 4],
            quality: 0.8,
        });
        if (!result.canceled) {
            const uri = result.assets[0].uri;
            setUploadingIndex(index);
            uploadImageMutation.mutate({ uri, index });
        }
    };

    const handleSettingsPress = () => router.push('./settings');

    useEffect(() => {
        console.log('[useEffect] Ažuriram profil u kontekstu.');
        if (userData) {
            const finalProfileData = {
                ...userData,
                location: userData.location || { locationCity: '', locationCountry: '' },
                education: userData.education || [],
                languages: userData.languages || [],
                interests: userData.interests || [],
            };
            loadProfile(finalProfileData);
        }
    }, [userData, loadProfile]);
    
    useEffect(() => {
        console.log('[useEffect] Proveravam parametre iz modala:', params);
        if (params.locationCity !== undefined) {
            const newShowLocation = params.isLocationEnabled === 'true';
            const newLocationCity = params.locationCity as string;

            console.log(`[useEffect] Ažuriram stanje lokacije: isEnabled=${newShowLocation}, city=${newLocationCity}`);
            
            setProfileField('showLocation', newShowLocation);
            setLocationCity(newLocationCity);
        }
    }, [params.locationCity, params.isLocationEnabled, setProfileField]);

    useEffect(() => {
        console.log('[useEffect] Pokrećem geokodiranje lokacije.');
        if (userData?.location?.latitude && userData?.location?.longitude && profile?.showLocation) {
            const fetchCity = async () => {
                try {
                    const geocode = await Location.reverseGeocodeAsync({
                        latitude: userData.location.latitude,
                        longitude: userData.location.longitude,
                    });
                    if (geocode.length > 0 && geocode[0].city) {
                        setLocationCity(geocode[0].city);
                        console.log(`[useEffect] Grad je pronađen: ${geocode[0].city}`);
                    } else {
                        setLocationCity(null);
                    }
                } catch (e) {
                    console.error("Geocoding error:", e);
                    setLocationCity(null);
                }
            };
            fetchCity();
        } else setLocationCity(null);
    }, [userData, profile?.showLocation]);

    if (isUserLoading || isImagesLoading || !profile) {
        console.log('[render] Učitavanje profila...');
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text>Učitavanje profila...</Text>
            </View>
        );
    }

    const profileData: UserProfileData = {
        bio: profile?.bio || null,
        jobTitle: profile?.jobTitle || null,
        education: profile?.education || null,
        location: profile?.location || null,
        showLocation: profile?.showLocation || false,
        gender: profile?.gender || null,
        sexualOrientation: profile?.sexualOrientation || null,
        relationshipType: profile?.relationshipType || null,
        horoscope: profile?.horoscope || null,
        familyPlans: profile?.familyPlans || null,
        communicationStyle: profile?.communicationStyle || null,
        loveStyle: profile?.loveStyle || null,
        pets: profile?.pets || null,
        drinks: profile?.drinks || null,
        smokes: profile?.smokes || null,
        workout: profile?.workout || null,
        diet: profile?.diet || null,
        height: profile?.height || null,
        languages: profile?.languages || [],
        interests: profile?.interests || [],
        fullName: profile?.fullName || '',
        birthDate: profile?.birthDate || '',
    };
    
    console.log('[render] Renderujem EditProfileScreen.');
    console.log('[render] Trenutni podaci o lokaciji:', { showLocation: profileData.showLocation, locationCity });

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.headerContainer}>
                    <ProfileHeader
                        onBackPress={() => router.back()}
                        mode={mode}
                        onToggleMode={handleToggleMode}
                        onSettingsPress={handleSettingsPress}
                    />
                </View>
                
                {initialScrollY !== null ? (
                    <ScrollView
                        ref={scrollViewRef}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                        contentOffset={{ y: initialScrollY, x: 0 }}
                        style={styles.contentScrollView}
                    >
                        {mode === 'edit' ? (
                            <View style={styles.editContent}>
                                <ProfilePhotoGrid
                                    images={images}
                                    onAddImagePress={handleImageUploadPress}
                                    onRemoveImage={(index, url) => {
                                        console.log(`[ProfilePhotoGrid] Brisanje slike na poziciji ${index}`);
                                        deleteImageMutation.mutate({ index, imageUrl: url });
                                    }}
                                    uploadingIndex={uploadingIndex}
                                    mode={mode}
                                    onReorderImages={(newImages) => {
                                        console.log(`[ProfilePhotoGrid] Promena redosleda slika. Novi redosled:`, newImages);
                                        // Ažuriranje lokalnog keša za trenutni UI
                                        queryClient.setQueryData(['userProfilePhotos', user?.id], newImages);
                                        // Slanje promene na backend
                                        reorderImagesMutation.mutate(newImages);
                                    }}
                                />
                                <ProfileEditCardsAndModals
                                    profile={profile}
                                    setProfileField={setProfileField}
                                    setPendingUpdates={setPendingUpdates}
                                    locationCity={locationCity}
                                    onOpenModal={handleOpenModal}
                                />
                            </View>
                        ) : (
                            <View style={styles.viewContent}>
                                <ProfileCarousel
                                    images={images}
                                    fullName={profile?.fullName || ''}
                                    age={calculateAge(profile?.birthDate)}
                                    onShowSlider={handleShowProfileDetails}
                                    locationCity={locationCity}
                                    showLocation={profile?.showLocation || false}
                                />
                                <View ref={contentRef} style={styles.profileDetailsContainer}>
                                    <ProfileDetailsView profile={profileData} locationCity={locationCity} />
                                </View>
                            </View>
                        )}
                    </ScrollView>
                ) : (
                    <View style={[styles.container, styles.center]}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text>Učitavanje...</Text>
                    </View>
                )}
            </SafeAreaView>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background },
    headerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 0 : 40,
    },
    container: { flex: 1, backgroundColor: COLORS.background },
    center: { justifyContent: 'center', alignItems: 'center' },
    contentScrollView: {
        flex: 1,
    },
    editContent: {
        paddingTop: HEADER_HEIGHT,
    },
    viewContent: {
        flex: 1,
    },
    profileDetailsContainer: {
        marginTop: 20,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        backgroundColor: COLORS.cardBackground,
        zIndex: 1,
    },
});
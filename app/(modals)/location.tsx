import React, { useState, useCallback, useMemo } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    SafeAreaView, 
    Platform, 
    Switch, 
    Dimensions, 
    StatusBar, 
    Alert 
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import axios from 'axios';
import { useAuthContext } from '../../context/AuthContext';
import { useProfileContext } from '../../context/ProfileContext';

const { width } = Dimensions.get('window');

// helpers
const wp = (percentage: number) => (width * percentage) / 100;
const RF = (size: number) => size * (width / 375);

const COLORS = {
  primary: '#E91E63',
  background: '#F0F2F5',
  cardBackground: '#FFFFFF',
  textPrimary: '#1E1E1E',
  textSecondary: '#666666',
  placeholder: '#A0A0A0',
  border: '#E0E0E0',
  white: '#FFFFFF',
  lightGray: '#D3D3D3',
  headerShadow: 'rgba(0, 0, 0, 0.08)',
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function LocationScreen() {
    console.log('[LocationScreen] Komponenta se renderuje');
    const router = useRouter();
    const params = useLocalSearchParams();
    const { user } = useAuthContext();
    const { setProfileField } = useProfileContext();

    const initialLocationEnabled = useMemo(
        () => params.isLocationEnabled === 'true',
        [params.isLocationEnabled]
    );
    const [isLocationEnabled, setIsLocationEnabled] = useState(initialLocationEnabled);
    const [isLoading, setIsLoading] = useState(false);

    const hasChanges = isLocationEnabled !== initialLocationEnabled;

    const handleSave = useCallback(async () => {
        console.log('[LocationScreen] Pokrenuta funkcija handleSave');
        setIsLoading(true);
        try {
            if (!API_BASE_URL) {
                Alert.alert('Greška', 'API osnovni URL nije definisan. Proverite .env fajl.');
                setIsLoading(false);
                return;
            }

            if (!user || !user.token) {
                Alert.alert('Greška', 'Korisnički token nije dostupan. Molimo pokušajte ponovo.');
                setIsLoading(false);
                return;
            }

            if (isLocationEnabled) {
                // 1. Dozvola za lokaciju
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Greška', 'Pristup lokaciji je odbijen.');
                    setIsLoading(false);
                    return;
                }

                // 2. Trenutna lokacija
                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High,
                });
                const { latitude, longitude } = location.coords;

                // 3. Reverse geocode
                const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
                const city = geocode.length > 0 && geocode[0].city ? geocode[0].city : 'Nepoznato';

                // 4. Slanje na backend (RAVNO latitude i longitude)
                await axios.put(
                    `${API_BASE_URL}/api/user/update-profile`,
                    {
                        latitude,
                        longitude,
                        showLocation: true,
                    },
                    { headers: { Authorization: `Bearer ${user.token}` } }
                );

                // 5. Ažuriranje konteksta
                setProfileField('location', { latitude, longitude, locationCity: city });
                setProfileField('showLocation', true);

                router.back();
            } else {
                // isključivanje lokacije
                await axios.put(
                    `${API_BASE_URL}/api/user/update-profile`,
                    { showLocation: false, location: null },
                    { headers: { Authorization: `Bearer ${user.token}` } }
                );

                setProfileField('location', null);
                setProfileField('showLocation', false);

                router.back();
            }
        } catch (error: unknown) {
            let errorMessage = 'Nije moguće sačuvati lokaciju. Pokušajte ponovo.';
            if (axios.isAxiosError(error) && error.response) {
                errorMessage = error.response.data.message || errorMessage;
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            console.error("Greška pri ažuriranju lokacije:", errorMessage);
            Alert.alert('Greška', errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [router, isLocationEnabled, user, setProfileField]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.cardBackground} />
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                    <Ionicons name="close-outline" size={RF(30)} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Podešavanja lokacije</Text>
                <TouchableOpacity
                    onPress={handleSave}
                    style={styles.saveBtn}
                    disabled={!hasChanges || isLoading}
                >
                    <Text
                        style={[
                            styles.saveBtnText,
                            { color: hasChanges && !isLoading ? COLORS.primary : COLORS.textSecondary },
                        ]}
                    >
                        {isLoading ? 'Čuvanje...' : 'Sačuvaj'}
                    </Text>
                </TouchableOpacity>
            </View>
            <View style={styles.container}>
                <View style={styles.cardContainer}>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Prikaži lokaciju</Text>
                        <Text style={styles.cardValue}>
                            Omogućite da se vaša lokacija prikaže na profilu
                        </Text>
                    </View>
                    <Switch
                        trackColor={{ false: COLORS.lightGray, true: COLORS.primary }}
                        thumbColor={COLORS.white}
                        ios_backgroundColor={COLORS.lightGray}
                        onValueChange={setIsLocationEnabled}
                        value={isLocationEnabled}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(4),
        paddingVertical: wp(2.5),
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + wp(2) : wp(2.5),
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.cardBackground,
        ...Platform.select({
            ios: {
                shadowColor: COLORS.headerShadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 5,
            },
            android: {
                elevation: 6,
            },
        }),
        zIndex: 10,
    },
    closeBtn: { padding: wp(1.5) },
    saveBtn: { padding: wp(1.5) },
    saveBtnText: { fontSize: RF(16), fontWeight: '600' },
    headerTitle: {
        fontSize: RF(18),
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        flex: 1,
        textAlign: 'center',
        marginHorizontal: wp(2),
    },
    container: { flex: 1, padding: 20, marginTop: 20 },
    cardContainer: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: 15,
        padding: 20,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    cardContent: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
    cardValue: { fontSize: 14, color: COLORS.textSecondary, marginTop: 5 },
});

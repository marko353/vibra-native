import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ActivityIndicator, TouchableOpacity, Linking, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useAuthContext } from '../../context/AuthContext';
import { useProfileContext } from '../../context/ProfileContext';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const COLORS = {
    primary: '#E91E63',
    background: '#F0F2F5',
    text: '#1A1A1A',
    textSecondary: '#6B7280',
    card: '#FFFFFF',
};

export default function LocationSettingsModal() {
    const router = useRouter();
    const { user } = useAuthContext();
    const queryClient = useQueryClient();
    const { profile } = useProfileContext();

    const [isLocationEnabled, setIsLocationEnabled] = useState(profile?.showLocation ?? false);
    const [isLoading, setIsLoading] = useState(false);

    const hasChanged = isLocationEnabled !== (profile?.showLocation ?? false);

    const updateProfileMutation = useMutation({
        mutationFn: async (data: Partial<{ location: object | null; showLocation: boolean }>) => {
            if (!user?.token) throw new Error('Not authenticated');
            const response = await axios.put(`${API_BASE_URL}/api/user/update-profile`, data, {
                headers: { Authorization: `Bearer ${user.token}` },
            });
            return response.data;
        },
        onSuccess: (updatedProfileData) => {
            queryClient.setQueryData(['userProfile', user?.id], (oldData: any) => ({
                ...oldData,
                ...updatedProfileData,
            }));
            router.back();
        },
        onError: (error) => {
            Alert.alert('Greška', 'Nije uspelo čuvanje podešavanja.');
            setIsLocationEnabled(profile?.showLocation ?? false);
        },
        onSettled: () => {
            setIsLoading(false);
        }
    });

    const openAppSettings = () => {
        if (Platform.OS === 'ios') Linking.openURL('app-settings:');
        else Linking.openSettings();
    };

    const handleAccept = async () => {
        if (!hasChanged) return;
        setIsLoading(true);

        if (isLocationEnabled) {
            try {
                let { status } = await Location.getForegroundPermissionsAsync();
                if (status !== 'granted') {
                    status = (await Location.requestForegroundPermissionsAsync()).status;
                }

                if (status !== 'granted') throw new Error('Permission denied');
                
                const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                const geocode = await Location.reverseGeocodeAsync(location.coords);
                const locationCity = geocode[0]?.subregion || geocode[0]?.city || null;
                const locationPayload = { ...location.coords, locationCity };
                
                updateProfileMutation.mutate({ location: locationPayload, showLocation: true });

            } catch (error: any) {
                setIsLoading(false);
                setIsLocationEnabled(false);
                
                if (error.message === 'Permission denied') {
                    Alert.alert('Dozvola je potrebna', 'Omogućite pristup lokaciji u podešavanjima telefona.',
                        [{ text: 'Otkaži', style: 'cancel'}, { text: 'Otvori podešavanja', onPress: openAppSettings }]
                    );
                } else {
                    Alert.alert('Greška', 'Nije moguće preuzeti lokaciju.');
                }
            }
        } else {
            // ✨ KONAČNA ISPRAVKA: Šaljemo samo promenu za 'showLocation'.
            // Ne šaljemo više 'location: null', čime se rešava problem.
            updateProfileMutation.mutate({
                showLocation: false
            });
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                    <Ionicons name="close" size={28} color={COLORS.textSecondary} />
                </TouchableOpacity>
                <Text style={styles.title}>Lokacija</Text>
                <TouchableOpacity onPress={handleAccept} style={styles.headerButton} disabled={!hasChanged || isLoading}>
                    {isLoading ? <ActivityIndicator size="small" color={COLORS.primary}/> : <Text style={[styles.acceptButtonText, !hasChanged && styles.acceptButtonTextDisabled]}>Prihvati</Text>}
                </TouchableOpacity>
            </View>

            <View style={styles.card}>
                <View style={styles.iconContainer}>
                    <Ionicons name="location-sharp" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.cardTitle}>Prikaži moju lokaciju</Text>
                    <Text style={styles.cardDescription}>
                        Ako je uključeno, grad u kojem se nalazite biće vidljiv na vašem profilu.
                    </Text>
                </View>
                <Switch
                    trackColor={{ false: '#d1d1d6', true: '#f8bbd0' }}
                    thumbColor={isLocationEnabled ? COLORS.primary : '#f4f3f4'}
                    ios_backgroundColor="#e5e5ea"
                    onValueChange={setIsLocationEnabled}
                    value={isLocationEnabled}
                    disabled={isLoading}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        paddingTop: Platform.OS === 'android' ? 40 : 60,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#EFEFEF',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
    },
    headerButton: {
        padding: 10,
        minWidth: 70,
        alignItems: 'center'
    },
    acceptButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.primary,
    },
    acceptButtonTextDisabled: {
        color: COLORS.textSecondary,
        opacity: 0.5,
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        margin: 20,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 5 },
        elevation: 4,
    },
    iconContainer: {
        backgroundColor: '#FCE4EC',
        borderRadius: 8,
        padding: 8,
        marginRight: 15,
    },
    textContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.text,
    },
    cardDescription: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 4,
        lineHeight: 18,
    },
});

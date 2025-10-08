import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as Location from 'expo-location';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useProfileContext, UserProfile } from '../../context/ProfileContext';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const HOME_ROUTE = '/(tabs)/home' as any;

export default function LocationPermissionScreen() {
    const { user } = useAuthContext();
    const { profile, setProfileField } = useProfileContext();
    const queryClient = useQueryClient();
    const router = useRouter();

    const updateProfileMutation = useMutation({
        mutationFn: async (data: { location?: object | null; showLocation: boolean; hasCompletedLocationPrompt: boolean }): Promise<UserProfile> => {
            if (!user?.token) throw new Error('Not authenticated');
            const response = await axios.put(`${API_BASE_URL}/api/user/update-profile`, data, {
                headers: { Authorization: `Bearer ${user.token}` },
            });
            // Važno: Vraćamo ceo objekat profila koji vrati server
            return response.data.user;
        },
        onSuccess: (updatedProfileDataFromServer: UserProfile) => {
            console.log("LOG: [LocationScreen] Mutacija uspešna. Ažuriram SVE.");

            // 1. Ažuriramo lokalno stanje u contextu (kao i do sada, za brzi odziv UI)
            setProfileField('hasCompletedLocationPrompt', true);

            // 2. ✨ KLJUČNI DODATAK: Ažuriramo i React Query keš ✨
            // Ovo je "zvanična" promena koja sprečava da refetch pregazi naše stanje.
            const queryKey = ['userProfile', user?.id];
            queryClient.setQueryData<UserProfile>(queryKey, (oldData) => {
                if (!oldData) return updatedProfileDataFromServer;
                return {
                    ...oldData,
                    ...updatedProfileDataFromServer, // Spajamo podatke sa servera
                    hasCompletedLocationPrompt: true // Osiguravamo da je ovo podešeno
                };
            });
        },
        onError: (error) => {
            console.error("ERROR: [LocationScreen] Mutacija neuspešna:", error);
            Alert.alert('Greška', 'Nije uspelo čuvanje podešavanja.');
        },
    });

    useEffect(() => {
        if (profile?.hasCompletedLocationPrompt === true) {
            console.log("LOG: [useEffect] Detektovana promena, pokrećem navigaciju na home...");
            router.replace(HOME_ROUTE);
        }
    }, [profile?.hasCompletedLocationPrompt]);

    const handleActivateLocation = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Dozvola nije data', 'Ne možemo pristupiti lokaciji.');
            updateProfileMutation.mutate({
                location: null,
                showLocation: false,
                hasCompletedLocationPrompt: true
            });
            return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const geocode = await Location.reverseGeocodeAsync(location.coords);
        const locationCity = geocode[0]?.subregion || geocode[0]?.city || null;

        updateProfileMutation.mutate({
            location: { ...location.coords, locationCity },
            showLocation: true,
            hasCompletedLocationPrompt: true
        });
    };

    const handleDeclineLocation = () => {
        updateProfileMutation.mutate({
            location: null,
            showLocation: false,
            hasCompletedLocationPrompt: true
        });
    };

    if (updateProfileMutation.isPending) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#E91E63" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Ionicons name="location-outline" size={80} color="#E91E63" />
            <Text style={styles.title}>Da li želiš da aplikacija koristi tvoju lokaciju?</Text>
            <Text style={styles.description}>
                Ako omogućiš lokaciju, tvoj grad će biti vidljiv na tvom profilu, što ti može pomoći da se povežeš sa ljudima u blizini. Možeš je isključiti kasnije u podešavanjima.
            </Text>
            <TouchableOpacity style={styles.buttonPrimary} onPress={handleActivateLocation} disabled={updateProfileMutation.isPending}>
                <Text style={styles.buttonTextPrimary}>Da, prihvati lokaciju</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonSecondary} onPress={handleDeclineLocation} disabled={updateProfileMutation.isPending}>
                <Text style={styles.buttonTextSecondary}>Ne želim</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 30 },
    title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginTop: 20, marginBottom: 10 },
    description: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 40, lineHeight: 24 },
    buttonPrimary: { width: '100%', backgroundColor: '#E91E63', paddingVertical: 15, borderRadius: 30, alignItems: 'center', marginBottom: 15 },
    buttonTextPrimary: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    buttonSecondary: { width: '100%', paddingVertical: 15, alignItems: 'center' },
    buttonTextSecondary: { color: '#E91E63', fontSize: 16 },
});
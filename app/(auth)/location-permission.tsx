import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as Location from 'expo-location';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const HOME_ROUTE = '/(tabs)/home'; 

export default function LocationPermissionScreen() {
    const { user } = useAuthContext();
    const queryClient = useQueryClient();
    const router = useRouter(); 

    const navigateHome = () => {
        console.log(`LOG: [LocationScreen] Navigacija na Home screen: ${HOME_ROUTE}`);
        queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] });
        // @ts-ignore
        router.replace(HOME_ROUTE);
    };

    const updateProfileMutation = useMutation({
        mutationFn: async (data: { location?: object | null; showLocation: boolean; hasCompletedLocationPrompt: boolean }) => {
            console.log("LOG: [LocationScreen] Slanje mutacije:", JSON.stringify(data));
            if (!user?.token) throw new Error('Not authenticated');
            const response = await axios.put(`${API_BASE_URL}/api/user/update-profile`, data, {
                headers: { Authorization: `Bearer ${user.token}` },
            });
            return response.data;
        },
        onSuccess: navigateHome, 
        onError: (error) => {
            console.error("ERROR: [LocationScreen] Mutacija neuspešna:", error);
            Alert.alert('Greška', 'Nije uspelo čuvanje podešavanja.');
        },
    });

    const handleActivateLocation = async () => {
        console.log("LOG: [LocationScreen] Kliknuto 'Aktiviraj lokaciju'");
        const payloadDefault = { hasCompletedLocationPrompt: true };

        let { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
            console.log("LOG: [LocationScreen] Zahtevanje dozvole od korisnika...");
            status = (await Location.requestForegroundPermissionsAsync()).status;
        }
        
        console.log(`LOG: [LocationScreen] Status dozvole: ${status}`);

        if (status === 'granted') {
            console.log("LOG: [LocationScreen] Dozvola data. Preuzimanje lokacije...");
            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const geocode = await Location.reverseGeocodeAsync(location.coords);
            const locationCity = geocode[0]?.subregion || geocode[0]?.city || null;
            const locationPayload = { ...location.coords, locationCity };
            
            updateProfileMutation.mutate({ 
                location: locationPayload, 
                showLocation: true, 
                ...payloadDefault
            });
        } else {
            console.log("LOG: [LocationScreen] Dozvola NIJE data. Slanje negativnog payload-a.");
            Alert.alert('Dozvola nije data', 'Ne možemo pristupiti lokaciji.');
            
            updateProfileMutation.mutate({ 
                location: null, 
                showLocation: false, 
                ...payloadDefault
            });
        }
    };

    const handleDeclineLocation = () => {
        console.log("LOG: [LocationScreen] Kliknuto 'Ne, hvala'");
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
            <Text style={styles.title}>Prikaži svoju lokaciju?</Text>
            <Text style={styles.description}>
                Ako omogućiš lokaciju, tvoj grad će biti vidljiv na tvom profilu, što ti može pomoći da se povežeš sa ljudima u blizini.
            </Text>
            <TouchableOpacity style={styles.buttonPrimary} onPress={handleActivateLocation} disabled={updateProfileMutation.isPending}>
                <Text style={styles.buttonTextPrimary}>Aktiviraj lokaciju</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonSecondary} onPress={handleDeclineLocation} disabled={updateProfileMutation.isPending}>
                <Text style={styles.buttonTextSecondary}>Ne, hvala</Text>
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

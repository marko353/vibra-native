import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Platform,
    StatusBar,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthContext } from '../../context/AuthContext';
import { useProfileContext } from '../../context/ProfileContext';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import axios from 'axios';

const { width } = Dimensions.get('window');
const wp = (percentage: number) => (width * percentage) / 100;
const RF = (size: number) => size * (width / 375);

const API_B = process.env.EXPO_PUBLIC_API_BASE_URL;

const COLORS = {
    primary: '#E91E63',
    textPrimary: '#1E1E1E',
    cardBackground: '#FFFFFF',
    border: '#E0E0E0',
    white: '#FFFFFF',
    background: '#F0F2F5',
    textSecondary: '#666666',
    headerShadow: 'rgba(0, 0, 0, 0.08)',
    selectedChip: '#FFEBF1',
    selectedChipBorder: '#E91E63',
};

const options = [
    'Pas',
    'Mačka',
    'Riba',
    'Ptica',
    'Reptil',
    'Nijedan',
    'Nije bitno',
];

interface MutationPayload { field: string; value: any; }
interface UserProfile { pets: string | null; [key: string]: any; }

export default function PetsScreen() {
    const router = useRouter();
    const { user } = useAuthContext();
    const { setProfileField } = useProfileContext();
    const queryClient = useQueryClient();

    const { data: userProfile, isLoading: isProfileLoading, refetch } = useQuery<UserProfile>({
        queryKey: ['userProfile', user?.id],
        queryFn: async () => {
            if (!user?.token) throw new Error("Token not available");
            const response = await axios.get(
                `${API_B}/api/user/profile`,
                {
                    headers: { 'Authorization': `Bearer ${user.token}` },
                }
            );
            return response.data;
                },
        enabled: !!user?.token,
    });

    const [selectedPet, setSelectedPet] = useState<string | null>(null);

    useFocusEffect(
        useCallback(() => {
            if (user?.token) {
                refetch();
            }
        }, [user, refetch])
    );

    useEffect(() => {
        if (userProfile?.pets) {
            setSelectedPet(userProfile.pets);
        }
    }, [userProfile]);

    const hasChanges = useMemo(() => selectedPet !== userProfile?.pets, [selectedPet, userProfile]);

    const updateProfileMutation = useMutation({
        mutationFn: async (payload: MutationPayload) => {
            if (!user?.token) throw new Error("Token not available");
            const response = await axios.put(
                `${API_B}/api/user/update-profile`,
                payload,
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
            const fieldName = 'pets' as const;
            const newValue = variables.value as string;

            // 1. AŽURIRANJE LOKALNOG CONTEXTA
            setProfileField(fieldName, newValue);

            // 2. DIREKTNO AŽURIRANJE QUERY KEŠA (za trenutno osvežavanje roditeljskog ekrana)
            queryClient.setQueryData(['userProfile', user?.id], (oldData: any) => {
                if (!oldData) return oldData;
                return { ...oldData, [fieldName]: newValue };
            });

            // 3. TRENUTNO AŽURIRANJE LOKALNOG STANJA MODALA
            setSelectedPet(newValue);

            // 4. Zatvaranje modala
            router.back();
        },
        onError: (error: any) => {
            console.error('Greška pri čuvanju ljubimaca:', error.response?.data || error.message);
            Alert.alert('Greška', `Došlo je do greške prilikom čuvanja ljubimaca: ${error.response?.data?.message || error.message}`);
        },
    });

    const handleSave = () => {
        if (!selectedPet) {
            Alert.alert('Greška', 'Molimo odaberite opciju za ljubimca.');
            return;
        }
        if (!hasChanges || updateProfileMutation.isPending || isProfileLoading) return;
        updateProfileMutation.mutate({ field: 'pets', value: selectedPet });
    };

    const renderOption = (option: string) => {
        const isSelected = option === selectedPet;
        const isDisabled = updateProfileMutation.isPending || isProfileLoading;
        return (
            <TouchableOpacity
                key={option}
                style={[
                    styles.optionButton,
                    isSelected && styles.optionButtonSelected,
                    isDisabled && styles.optionButtonDisabled,
                ]}
                onPress={() => setSelectedPet(option)}
                disabled={isDisabled}
            >
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {option}
                </Text>
                {isSelected && (
                    <Ionicons
                        name="checkmark-circle"
                        size={RF(24)}
                        color={COLORS.primary}
                        style={styles.checkmarkIcon}
                    />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.cardBackground} />
            <View style={styles.header}>
                <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} disabled={updateProfileMutation.isPending || isProfileLoading}>
                    <Ionicons name="close-outline" size={RF(30)} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ljubimci</Text>
                <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleSave}
                    disabled={!hasChanges || updateProfileMutation.isPending || isProfileLoading || !selectedPet}
                >
                    {updateProfileMutation.isPending ? (
                        <ActivityIndicator color={COLORS.primary} />
                    ) : (
                        <Text style={[
                            styles.saveBtnText,
                            { color: (!hasChanges || !selectedPet) ? COLORS.textSecondary : COLORS.primary }
                        ]}>
                            Sačuvaj
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
            {isProfileLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Učitavanje...</Text>
                </View>
            ) : (
                <View style={styles.content}>
                    <Text style={styles.label}>Imaš li kućnog ljubimca?</Text>
                    {options.map(renderOption)}
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
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
    closeBtn: {
        padding: wp(1.5),
    },
    saveBtn: {
        padding: wp(1.5),
    },
    saveBtnText: {
        fontSize: RF(16),
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: RF(18),
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        flex: 1,
        textAlign: 'center',
        marginHorizontal: wp(2),
    },
    content: {
        flex: 1,
        padding: wp(5),
        backgroundColor: COLORS.background,
    },
    label: {
        fontSize: RF(18),
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: wp(5),
    },
    optionButton: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: RF(15),
        paddingVertical: wp(4.5),
        paddingHorizontal: wp(5),
        marginBottom: wp(3),
        borderWidth: 1,
        borderColor: COLORS.border,
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: RF(1) },
        shadowOpacity: 0.05,
        shadowRadius: RF(3),
        elevation: 2,
    },
    optionButtonSelected: {
        borderColor: COLORS.selectedChipBorder,
        backgroundColor: COLORS.selectedChip,
        shadowColor: COLORS.selectedChipBorder,
        shadowOffset: { width: 0, height: RF(4) },
        shadowOpacity: 0.1,
        shadowRadius: RF(10),
        elevation: 5,
    },
    optionButtonDisabled: {
        opacity: 0.6,
    },
    optionText: {
        fontSize: RF(16),
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    optionTextSelected: {
        color: COLORS.primary,
    },
    checkmarkIcon: {
        marginLeft: 'auto',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: RF(16),
        color: COLORS.textSecondary,
    },
});

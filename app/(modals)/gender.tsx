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
    FlatList,
    StatusBar,
    Dimensions,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthContext } from '../../context/AuthContext';
import { useProfileContext } from '../../context/ProfileContext';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_B = process.env.EXPO_PUBLIC_API_BASE_URL;

const { width } = Dimensions.get('window');
const wp = (percentage: number) => (width * percentage) / 100;
const RF = (size: number) => size * (width / 375);

const COLORS = {
    primary: '#E91E63',
    textPrimary: '#1E1E1E',
    cardBackground: '#FFFFFF',
    border: '#E0E0E0',
    white: '#FFFFFF',
    background: '#F0F2F5',
    selectedChip: '#FFEBF1',
    selectedChipBorder: '#E91E63',
    textSecondary: '#666666',
    iconColor: '#888',
    headerShadow: 'rgba(0, 0, 0, 0.08)',
};

// Detaljnije opcije za pol, sa ikonama
const genderOptions = [
    { style: 'Muško', description: 'Identifikujem se kao muškarac.', icon: 'male' },
    { style: 'Žensko', description: 'Identifikujem se kao žena.', icon: 'female' },
    { style: 'Transrodno - Muško', description: 'Identifikujem se kao transrodni muškarac.', icon: 'transgender' },
    { style: 'Transrodno - Žensko', description: 'Identifikujem se kao transrodna žena.', icon: 'transgender' },
    { style: 'Nebinarno', description: 'Moj rodni identitet nije isključivo muški ili ženski.', icon: 'genderless' },
    { style: 'Rodno fluidno', description: 'Moj rodni identitet se menja tokom vremena.', icon: 'arrows-alt-h' },
    { style: 'Drugo', description: 'Želim da navedem drugačiji rodni identitet.', icon: 'question' },
    { style: 'Ne želim da navedem', description: 'Preferiram da ne otkrivam svoj pol.', icon: 'user-secret' },
];

interface MutationPayload { field: string; value: any; }
interface UserProfile { gender: string | null; [key: string]: any; }


export default function GenderScreen() {
    const router = useRouter();
    const { user } = useAuthContext();
    const { setProfileField } = useProfileContext(); // DODATO ZA LOKALNI CONTEXT
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

    const [selectedGender, setSelectedGender] = useState<string>('');

    useFocusEffect(
        useCallback(() => {
            if (user?.token) {
                refetch();
            }
        }, [user, refetch])
    );

    useEffect(() => {
        if (userProfile?.gender) {
            setSelectedGender(userProfile.gender);
        }
    }, [userProfile]);

    const hasChanges = useMemo(() => selectedGender !== userProfile?.gender, [selectedGender, userProfile]);

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
            const fieldName = 'gender' as const;
            const newValue = variables.value as string;

            // 1. AŽURIRANJE LOKALNOG CONTEXTA
            setProfileField(fieldName, newValue);

            // 2. DIREKTNO AŽURIRANJE QUERY KEŠA
            queryClient.setQueryData(['userProfile', user?.id], (oldData: any) => {
                if (!oldData) return oldData;
                return { ...oldData, [fieldName]: newValue };
            });

            // 3. TRENUTNO AŽURIRANJE LOKALNOG STANJA MODALA
            setSelectedGender(newValue);

            // 4. Zatvaranje modala
            router.back();
        },
        onError: (error: any) => {
            console.error('Greška pri čuvanju pola:', error.response?.data || error.message);
            Alert.alert('Greška', `Došlo je do greške prilikom čuvanja pola: ${error.response?.data?.message || error.message}`);
        },
    });

    const handleSave = () => {
        if (!selectedGender) {
            Alert.alert('Greška', 'Molimo odaberite opciju za pol.');
            return;
        }
        if (!hasChanges || updateProfileMutation.isPending || isProfileLoading) return;
        updateProfileMutation.mutate({ field: 'gender', value: selectedGender });
    };

    const renderItem = ({ item }: { item: { style: string; description: string; icon: any } }) => {
        const isSelected = item.style === selectedGender;
        return (
            <TouchableOpacity
                style={[
                    styles.itemContainer,
                    isSelected && styles.itemContainerSelected,
                    (updateProfileMutation.isPending || isProfileLoading) && styles.itemContainerDisabled
                ]}
                onPress={() => setSelectedGender(item.style)}
                disabled={updateProfileMutation.isPending || isProfileLoading}
            >
                <View style={styles.itemContent}>
                    <FontAwesome5
                        name={item.icon}
                        size={RF(20)}
                        color={isSelected ? COLORS.primary : COLORS.iconColor}
                        style={styles.itemIcon}
                    />
                    <View style={styles.textContainer}>
                        <Text style={[styles.itemTitle, isSelected && styles.itemTitleSelected]}>
                            {item.style}
                        </Text>
                        {item.description && (
                            <Text style={[styles.itemDescription, isSelected && styles.itemDescriptionSelected]}>
                                {item.description}
                            </Text>
                        )}
                    </View>
                </View>
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
                <Text style={styles.headerTitle}>Pol</Text>
                <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleSave}
                    disabled={!hasChanges || updateProfileMutation.isPending || isProfileLoading || !selectedGender}
                >
                    {(updateProfileMutation.isPending || isProfileLoading) ? (
                        <ActivityIndicator color={COLORS.primary} />
                    ) : (
                        <Text style={[
                            styles.saveBtnText,
                            { color: (!hasChanges || !selectedGender) ? COLORS.textSecondary : COLORS.primary }
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
                <FlatList
                    data={genderOptions}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.style}
                    contentContainerStyle={styles.container}
                    showsVerticalScrollIndicator={false}
                />
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
    container: {
        padding: wp(5),
        paddingBottom: wp(10),
        backgroundColor: COLORS.background,
    },
    itemContainer: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: RF(15),
        padding: wp(5),
        marginBottom: wp(3),
        borderWidth: 1,
        borderColor: COLORS.border,
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: RF(1) },
        shadowOpacity: 0.05,
        shadowRadius: RF(3),
        elevation: 2,
    },
    itemContainerSelected: {
        borderColor: COLORS.selectedChipBorder,
        backgroundColor: COLORS.selectedChip,
        shadowColor: COLORS.selectedChipBorder,
        shadowOffset: { width: 0, height: RF(4) },
        shadowOpacity: 0.1,
        shadowRadius: RF(10),
        elevation: 5,
    },
    itemContainerDisabled: {
        opacity: 0.6,
    },
    itemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    itemIcon: {
        marginRight: wp(4),
        width: wp(5),
        textAlign: 'center',
    },
    textContainer: {
        flex: 1,
    },
    itemTitle: {
        fontSize: RF(18),
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    itemTitleSelected: {
        color: COLORS.primary,
    },
    itemDescription: {
        fontSize: RF(14),
        color: COLORS.textSecondary,
        marginTop: wp(1),
    },
    itemDescriptionSelected: {
        color: COLORS.textPrimary,
    },
    checkmarkIcon: {
        position: 'absolute',
        right: wp(4),
        top: '50%',
        transform: [{ translateY: -RF(12) }],
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

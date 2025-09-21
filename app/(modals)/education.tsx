import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthContext } from '../../context/AuthContext';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_B = process.env.EXPO_PUBLIC_API_BASE_URL;

const { width } = Dimensions.get('window');
// Dodata su 'number' tipovi za 'percentage' i 'size'
const wp = (percentage: number) => (width * percentage) / 100;
const RF = (size: number) => size * (width / 375);

const COLORS = {
    primary: '#E91E63',
    textPrimary: '#1A1A1A',
    textSecondary: '#6B7280',
    background: '#F8F8F8',
    cardBackground: '#FFFFFF',
    border: '#E0E0E0',
    white: '#FFFFFF',
    danger: '#DC3545',
    selectedChip: '#FFEBF1',
    selectedChipBorder: '#E91E63',
    headerShadow: 'rgba(0, 0, 0, 0.08)',
};

const educationOptions = [
    { style: 'Srednja škola', description: 'Završena srednja škola.' },
    { style: 'Viša škola', description: 'Završena viša škola.' },
    { style: 'Fakultet (osnovne studije)', description: 'Završene osnovne studije.' },
    { style: 'Fakultet (master studije)', description: 'Završene master studije.' },
    { style: 'Doktor nauka', description: 'Stečen akademski stepen doktora nauka.' },
    { style: 'Nije navedeno', description: 'Ne želim da navedem svoje obrazovanje.' },
];

export default function EducationScreen() {
    const router = useRouter();
    const { user } = useAuthContext();
    const queryClient = useQueryClient();

    // Dohvatanje najnovijih podataka o korisniku
    const { data: userProfile, isLoading: isProfileLoading, refetch } = useQuery({
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

    // Stanje koje prati trenutno odabrano obrazovanje
    const [selectedEducation, setSelectedEducation] = useState<string>('');

    // Koristi se za sinhronizaciju stanja kada se podaci o korisniku promene
    useEffect(() => {
        if (userProfile?.education && userProfile.education.length > 0) {
            setSelectedEducation(userProfile.education[0]);
        }
    }, [userProfile]);

    // Očistiti stanje kada se ekran unfokusira da se izbegnu greške pri ponovnom učitavanju
    useFocusEffect(
        useCallback(() => {
            if (user?.token) {
                refetch();
            }
            return () => {
                setSelectedEducation('');
            };
        }, [user, refetch])
    );

    // Proverava da li je došlo do promene u odnosu na početnu opciju
    const hasChanges = useMemo(() => {
        const initialEducation = userProfile?.education?.[0] || '';
        return selectedEducation !== initialEducation;
    }, [selectedEducation, userProfile]);

    const updateProfileMutation = useMutation({
        mutationFn: async (payload: { field: string; value: any }) => {
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
            // Optimizovano ažuriranje keša kako bi se odmah prikazale promene
            queryClient.setQueryData(['userProfile', user?.id], (oldData: any) => {
                if (!oldData) return oldData;
                return { ...oldData, [variables.field]: variables.value };
            });
            router.back();
        },
        onError: (error: any) => {
            console.error('Greška pri čuvanju obrazovanja:', error.response?.data || error.message);
            Alert.alert('Greška', `Došlo je do greške prilikom čuvanja obrazovanja: ${error.response?.data?.message || error.message}`);
        },
    });

    const handleSave = () => {
        if (!selectedEducation) {
            Alert.alert('Greška', 'Molimo odaberite opciju za obrazovanje pre nego što sačuvate.');
            return;
        }
        if (!hasChanges || updateProfileMutation.isPending || isProfileLoading) return;

        // Ažuriranje: Slanje niza umesto stringa
        updateProfileMutation.mutate({ field: 'education', value: [selectedEducation] });
    };

    const renderItem = ({ item }: { item: { style: string; description: string } }) => {
        const isSelected = item.style === selectedEducation;
        return (
            <TouchableOpacity
                style={[
                    styles.itemContainer,
                    isSelected && styles.itemContainerSelected,
                    (updateProfileMutation.isPending || isProfileLoading) && styles.itemContainerDisabled
                ]}
                onPress={() => setSelectedEducation(item.style)}
                disabled={updateProfileMutation.isPending || isProfileLoading}
            >
                <Text style={[styles.itemTitle, isSelected && styles.itemTitleSelected]}>
                    {item.style}
                </Text>
                <Text style={[styles.itemDescription, isSelected && styles.itemDescriptionSelected]}>
                    {item.description}
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
                <Text style={styles.headerTitle}>Obrazovanje</Text>
                <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleSave}
                    disabled={!hasChanges || updateProfileMutation.isPending || isProfileLoading || !selectedEducation}
                >
                    {(updateProfileMutation.isPending || isProfileLoading) ? (
                        <ActivityIndicator color={COLORS.primary} />
                    ) : (
                        <Text style={[
                            styles.saveBtnText,
                            { color: (!hasChanges || !selectedEducation) ? COLORS.textSecondary : COLORS.primary }
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
                    data={educationOptions}
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
        color: COLORS.textSecondary,
    },
    checkmarkIcon: {
        position: 'absolute',
        right: wp(4),
        top: wp(4),
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
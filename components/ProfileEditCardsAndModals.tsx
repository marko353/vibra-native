import React, { Dispatch, SetStateAction } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserProfile } from '../context/ProfileContext';

const COLORS = {
    primary: '#E91E63',
    accent: '#007AFF',
    textPrimary: '#1A1A1A',
    textSecondary: '#6B7280',
    background: '#F8F8F8',
    cardBackground: '#FFFFFF',
    border: '#E0E0E0',
    placeholder: '#A0A0A0',
    shadow: 'rgba(0,0,0,0.08)',
};

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

interface ProfileEditCardsAndModalsProps {
    profile: UserProfile;
    setProfileField: (field: keyof UserProfile, value: any) => void;
    setPendingUpdates: Dispatch<SetStateAction<{ field: string; value: any }[]>>;
    locationCity?: string | null;
    onOpenModal: (screenName: keyof typeof screens, params?: any) => void;
}

const ProfileEditCardsAndModals = ({
    profile,
    setProfileField,
    setPendingUpdates,
    locationCity,
    onOpenModal,
}: ProfileEditCardsAndModalsProps) => {
    const handleCardPress = (screen: keyof typeof screens, params?: any) => {
        onOpenModal(screen, params);
    };

    const renderCard = (
        title: string,
        value: string | null | undefined,
        screenKey: keyof typeof screens,
        params?: any,
        iconName?: keyof typeof Ionicons.glyphMap,
        isFirstCard: boolean = false
    ) => {
        const isBioCard = isFirstCard && title === 'O meni';
        const cardContentStyle = isBioCard ? styles.bioCardContent : styles.cardContent;

        return (
            <TouchableOpacity
                onPress={() => handleCardPress(screenKey, params)}
                style={[styles.cardContainer, isFirstCard && styles.firstCardContainer]}
            >
                {iconName && (
                    <Ionicons
                        name={iconName}
                        size={22}
                        color={COLORS.textSecondary}
                        style={styles.cardIcon}
                    />
                )}
                <View style={cardContentStyle}>
                    <Text style={styles.cardTitle}>{title}</Text>
                    <Text
                        style={styles.cardValue}
                        numberOfLines={isBioCard ? 2 : 1}
                        ellipsizeMode="tail"
                    >
                        {value || `Dodaj ${title.toLowerCase()}`}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
        );
    };

    const renderLocationCard = () => {
        const showLocation = profile?.showLocation ?? false;
        const locationValue =
            showLocation && locationCity ? locationCity : 'Isključeno';

        return (
            <TouchableOpacity
                onPress={() =>
                    handleCardPress('location', {
                        isLocationEnabled: showLocation, // šaljemo boolean
                        currentLocationCity: locationCity || '',
                    })
                }
                style={[styles.cardContainer, styles.locationCardContainer]}
            >
                <View style={styles.cardIconAndContent}>
                    <Ionicons
                        name="location"
                        size={24}
                        color={COLORS.primary}
                        style={styles.cardIcon}
                    />
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Lokacija</Text>
                        <Text style={styles.cardValue}>{locationValue}</Text>
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {renderCard('O meni', profile.bio, 'bio', { currentBio: profile.bio || '' }, 'person-outline', true)}
            {renderCard(
                'Jezici',
                profile.languages?.length ? profile.languages.join(', ') : null,
                'languages',
                { currentLanguages: JSON.stringify(profile.languages) },
                'language-outline'
            )}
            {renderCard(
                'Interesovanja',
                profile.interests?.length ? profile.interests.join(', ') : null,
                'interests',
                { currentInterests: JSON.stringify(profile.interests) },
                'bulb-outline'
            )}
            {renderCard(
                'Visina',
                profile.height ? `${profile.height} cm` : null,
                'height',
                { currentHeight: profile.height?.toString() || '' },
                'body-outline'
            )}
            {renderCard(
                'Stil komunikacije',
                profile.communicationStyle || null,
                'communicationStyle',
                { currentStyle: profile.communicationStyle || '' },
                'chatbubbles-outline'
            )}
            {renderCard(
                'Način ishrane',
                profile.diet || null,
                'diet',
                { currentDiet: profile.diet || '' },
                'nutrition-outline'
            )}
            {renderCard(
                'Piće',
                profile.drinks || null,
                'drinks',
                { currentDrinks: profile.drinks || '' },
                'beer-outline'
            )}
            {renderCard(
                'Obrazovanje',
                profile.education?.length ? profile.education.join(', ') : null,
                'education',
                { currentEducation: JSON.stringify(profile.education) },
                'school-outline'
            )}
            {renderCard(
                'Porodični planovi',
                profile.familyPlans || null,
                'familyPlans',
                { currentFamilyPlans: profile.familyPlans || '' },
                'people-outline'
            )}
            {renderCard(
                'Pol',
                profile.gender || null,
                'gender',
                { currentGender: profile.gender || '' },
                'male-female-outline'
            )}
            {renderCard(
                'Horoskop',
                profile.horoscope || null,
                'horoscope',
                { currentHoroscope: profile.horoscope || '' },
                'planet-outline'
            )}
            {renderCard(
                'Posao',
                profile.jobTitle || null,
                'job',
                { currentJobTitle: profile.jobTitle || '' },
                'briefcase-outline'
            )}
            {renderCard(
                'Tip veze',
                profile.relationshipType || null,
                'relationshipType',
                { currentType: profile.relationshipType || '' },
                'heart-outline'
            )}
            {renderCard(
                'Jezik ljubavi',
                profile.loveStyle || null,
                'loveStyle',
                { currentStyle: profile.loveStyle || '' },
                'flower-outline'
            )}
            {renderCard(
                'Ljubimci',
                profile.pets || null,
                'pets',
                { currentPets: profile.pets || '' },
                'paw-outline'
            )}
            {renderCard(
                'Pušenje',
                profile.smokes || null,
                'smokes',
                { currentSmokes: profile.smokes || '' },
                'bonfire-outline'
            )}
            {renderCard(
                'Vežbanje',
                profile.workout || null,
                'workout',
                { currentWorkout: profile.workout || '' },
                'barbell-outline'
            )}
            {renderCard(
                'Seksualna orijentacija',
                profile.sexualOrientation || null,
                'sexualOrientation',
                { currentOrientation: profile.sexualOrientation || '' },
                'transgender-outline'
            )}
            {renderLocationCard()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
    },
    cardContainer: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: 18,
        paddingVertical: 18,
        paddingHorizontal: 20,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderColor: COLORS.border,
        borderWidth: 1,
        ...Platform.select({
            ios: {
                shadowColor: COLORS.shadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 10,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    firstCardContainer: {
        marginTop: 0,
    },
    locationCardContainer: {
        marginBottom: 50,
    },
    cardIconAndContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    cardIcon: {
        marginRight: 15,
    },
    cardContent: {
        flex: 1,
    },
    bioCardContent: {
        flex: 1,
        minHeight: 50,
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    cardValue: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
});

export default ProfileEditCardsAndModals;
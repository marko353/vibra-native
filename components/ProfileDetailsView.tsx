import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

type IconNames = keyof typeof Ionicons.glyphMap;

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
}

interface ProfileDetailsViewProps {
    profile: UserProfileData;
    locationCity: string | null;
}

const ProfileDetailsView = ({ profile, locationCity }: ProfileDetailsViewProps) => {

    const renderInfoRow = (iconName: IconNames, title: string, value: any) => {
        if (title === 'Živi u') {
            const displayLocation = locationCity;
            if (profile.showLocation === false || !displayLocation) {
                return null;
            }
            value = displayLocation;
        }
        if (!value || (Array.isArray(value) && value.length === 0)) {
            return null;
        }
        let displayValue = value;
        if (Array.isArray(value)) {
            displayValue = value.join(', ');
        } else if (title === 'Visina') {
            displayValue = `${value} cm`;
        }

        return (
            <View style={styles.infoRow}>
                <Ionicons name={iconName} size={20} color={COLORS.textSecondary} style={styles.infoIcon} />
                <Text style={styles.infoTitle}>{title}:</Text>
                <Text style={styles.infoValue}>{displayValue}</Text>
            </View>
        );
    };

    const renderTagSection = (title: string, tags: string[]) => {
        if (!tags || tags.length === 0) {
            return null;
        }

        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{title}</Text>
                <View style={styles.tagsContainer}>
                    {tags.map((tag, index) => (
                        <View key={index} style={styles.tag}>
                            <Text style={styles.tagText}>{tag}</Text>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>O meni</Text>
                {profile.bio ? (
                    <Text style={styles.bioText}>{profile.bio}</Text>
                ) : (
                    <Text style={styles.placeholderText}>Nema unetih informacija o vama.</Text>
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Osnovne informacije</Text>
                {renderInfoRow('briefcase-outline', 'Posao', profile.jobTitle)}
                {renderInfoRow('school-outline', 'Obrazovanje', profile.education)}
                {renderInfoRow('location-outline', 'Živi u', profile.location?.locationCity)}
                {renderInfoRow('resize-outline', 'Visina', profile.height)}
                {renderInfoRow('person-outline', 'Pol', profile.gender)}
                {renderInfoRow('transgender-outline', 'Seksualna orijentacija', profile.sexualOrientation)}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Životni stil</Text>
                {renderInfoRow('paw-outline', 'Ljubimci', profile.pets)}
                {renderInfoRow('beer-outline', 'Piće', profile.drinks)}
                {renderInfoRow('bonfire-outline', 'Puši', profile.smokes)}
                {renderInfoRow('barbell-outline', 'Vežbanje', profile.workout)}
                {renderInfoRow('nutrition-outline', 'Ishrana', profile.diet)}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Osobine i stavovi</Text>
                {renderInfoRow('heart-outline', 'Tip veze', profile.relationshipType)}
                {renderInfoRow('star-outline', 'Horoskop', profile.horoscope)}
                {renderInfoRow('people-outline', 'Porodični planovi', profile.familyPlans)}
                {renderInfoRow('chatbox-outline', 'Stil komunikacije', profile.communicationStyle)}
                {renderInfoRow('heart-outline', 'Ljubavni stil', profile.loveStyle)}
            </View>

            {renderTagSection('Jezici', profile.languages)}
            {renderTagSection('Interesovanja', profile.interests)}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        marginTop: 20,
    },
    section: { marginBottom: 25 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 15 },
    bioText: {
        fontSize: 16,
        color: COLORS.textPrimary,
        lineHeight: 24,
        flexWrap: 'wrap',
    },
    placeholderText: { fontSize: 16, color: COLORS.placeholder, fontStyle: 'italic' },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
        flexWrap: 'wrap',
    },
    infoIcon: {
        marginRight: 10,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    infoValue: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginLeft: 5,
        flex: 1,
    },
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 5 },
    tag: {
        backgroundColor: COLORS.lightGray,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 10,
        marginBottom: 10,
    },
    tagText: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '500' },
});

export default ProfileDetailsView;
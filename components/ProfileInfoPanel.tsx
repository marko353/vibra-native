import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserProfile } from '../context/ProfileContext';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthContext } from '../context/AuthContext';
import Carousel from 'react-native-reanimated-carousel';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const HEADER_IMAGE_HEIGHT = windowHeight * 0.4;

const COLORS = {
  primary: '#E91E63',
  textPrimary: '#2c3e50',
  textSecondary: '#7f8c8d',
  cardBackground: '#ffffff',
  background: '#f4f7f9',
  skeleton: '#e1e9ee',
  like: '#4CCC93',
  nope: '#FF6B6B',
  white: '#FFFFFF',
};

// --- Skeleton Loader ---
const SkeletonLoader = () => (
    <View>
        <View style={{ height: HEADER_IMAGE_HEIGHT - 30 }} />
        <View style={detailsStyles.contentContainer}>
            <View style={detailsStyles.headerSection}>
                <View style={[detailsStyles.skeleton, { width: '60%', height: 30, borderRadius: 8, marginBottom: 15 }]} />
                <View style={[detailsStyles.skeleton, { width: '90%', height: 18, borderRadius: 4 }]} />
            </View>
            <View style={[detailsStyles.skeleton, { width: '40%', height: 22, borderRadius: 6, marginTop: 15, marginBottom: 15 }]} />
            <View style={detailsStyles.cardsContainer}>
                <View style={[detailsStyles.detailCard, detailsStyles.skeleton, { height: 70 }]} />
                <View style={[detailsStyles.detailCard, detailsStyles.skeleton, { height: 70 }]} />
            </View>
        </View>
    </View>
);

// --- DetailCard ---
interface DetailCardProps {
    iconName: keyof typeof Ionicons.glyphMap;
    title: string;
    value: string | number | string[] | null | undefined;
}
const DetailCard: React.FC<DetailCardProps> = ({ iconName, title, value }) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return null;
    const displayValue = Array.isArray(value) ? value.join(', ') : value;
    return (
        <View style={detailsStyles.detailCard}>
            <Ionicons name={iconName} size={24} color={COLORS.textSecondary} />
            <View style={detailsStyles.detailContent}>
                <Text style={detailsStyles.detailTitle}>{title}</Text>
                <Text style={detailsStyles.detailValue}>{String(displayValue)}</Text>
            </View>
        </View>
    );
};

// --- Glavni interfejs ---
interface ProfileInfoPanelProps {
    user: UserProfile | null;
    isVisible: boolean;
    onClose: () => void;
    onLike: () => void;
    onNope: () => void;
}

const ProfileInfoPanel: React.FC<ProfileInfoPanelProps> = ({ user, isVisible, onClose, onLike, onNope }) => {
    const { user: authUser } = useAuthContext();
    const slideAnim = useRef(new Animated.Value(windowHeight)).current;
    const scrollY = useRef(new Animated.Value(0)).current;

    const sectionAnims = useRef(Array(6).fill(null).map(() => ({
        opacity: new Animated.Value(0),
        translateY: new Animated.Value(30),
    }))).current;

    const { data: detailedProfile, isLoading } = useQuery({
        queryKey: ['detailedUserProfile', user?._id],
        queryFn: async () => {
            if (!user?._id || !authUser?.token) return user;
            try {
                const response = await axios.get(`${API_BASE_URL}/api/user/${user._id}`, {
                    headers: { Authorization: `Bearer ${authUser.token}` },
                });
                return response.data as UserProfile;
            } catch (error) {
                console.error("Neuspelo preuzimanje detaljnog profila:", error);
                return user;
            }
        },
        enabled: isVisible && !!user?._id,
    });

    useEffect(() => {
        Animated.spring(slideAnim, { toValue: isVisible ? 0 : windowHeight, tension: 50, friction: 12, useNativeDriver: true }).start();
        if (isVisible && !isLoading) {
            const animations = sectionAnims.map(anim => Animated.spring(anim.translateY, { toValue: 0, useNativeDriver: true, tension: 60, friction: 15 }));
            const opacities = sectionAnims.map(anim => Animated.timing(anim.opacity, { toValue: 1, duration: 400, useNativeDriver: true }));
            Animated.stagger(80, [...animations, ...opacities]).start();
        } else {
            sectionAnims.forEach(anim => {
                anim.opacity.setValue(0);
                anim.translateY.setValue(30);
            });
        }
    }, [isVisible, isLoading]);

    const profileData = detailedProfile || user;
    const images = profileData?.profilePictures?.filter(Boolean) as string[] || [];
    const age = user?.birthDate ? (new Date().getFullYear() - new Date(user.birthDate).getFullYear()) : null;

    const handleScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true });
    const imageTranslateY = scrollY.interpolate({ inputRange: [-HEADER_IMAGE_HEIGHT, 0, HEADER_IMAGE_HEIGHT], outputRange: [HEADER_IMAGE_HEIGHT / 2, 0, -HEADER_IMAGE_HEIGHT / 2], extrapolate: 'clamp' });
    const imageScale = scrollY.interpolate({ inputRange: [-HEADER_IMAGE_HEIGHT, 0], outputRange: [2, 1], extrapolate: 'clamp' });

    const hasAboutMeData = profileData?.horoscope || profileData?.relationshipType || profileData?.familyPlans || profileData?.communicationStyle || profileData?.loveStyle;
    const hasLifestyleData = profileData?.pets || profileData?.drinks || profileData?.smokes || profileData?.workout || profileData?.diet;
    const hasBasicsData = profileData?.height || profileData?.jobTitle || (profileData?.education?.length ?? 0) > 0 || profileData?.gender || profileData?.sexualOrientation;
    const hasAnyData = profileData?.bio || hasAboutMeData || hasLifestyleData || hasBasicsData || (profileData?.interests?.length ?? 0) > 0 || (profileData?.languages?.length ?? 0) > 0;

    const handleBlockUser = () => {
        Alert.alert("Blokiranje", `Da li ste sigurni da želite da blokirate korisnika ${profileData?.fullName}?`);
    };

    const handleReportUser = () => {
        Alert.alert("Prijava", `Da li ste sigurni da želite da prijavite korisnika ${profileData?.fullName}?`);
    };

    return (
        <Animated.View style={[detailsStyles.sliderOverlay, { transform: [{ translateY: slideAnim }] }]}>
            <TouchableOpacity style={detailsStyles.touchableOverlay} onPress={onClose} activeOpacity={1} />
            <View style={detailsStyles.sliderContainer}>
                <Animated.View style={[detailsStyles.headerImageContainer, { transform: [{ translateY: imageTranslateY }, { scale: imageScale }] }]}>
                    {images.length > 0 ? (
                        <Carousel
                            loop={true}
                            width={windowWidth}
                            height={HEADER_IMAGE_HEIGHT}
                            data={images}
                            renderItem={({ item }) => (
                                <Image source={{ uri: item }} style={detailsStyles.headerImage} />
                            )}
                        />
                    ) : (
                        <View style={[detailsStyles.headerImage, detailsStyles.skeleton]} />
                    )}
                    <View style={detailsStyles.headerGradient} />
                </Animated.View>

                <Animated.ScrollView onScroll={handleScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={detailsStyles.scrollViewContent}>
                    {isLoading ? <SkeletonLoader /> : (
                        <>
                            <View style={{ height: HEADER_IMAGE_HEIGHT - 30 }} />
                            <View style={detailsStyles.contentContainer}>
                                <Animated.View style={{ opacity: sectionAnims[0].opacity, transform: [{ translateY: sectionAnims[0].translateY }] }}>
                                    <View style={detailsStyles.headerSection}>
                                        <Text style={detailsStyles.fullNameText}>{profileData?.fullName}{age && `, ${age}`}</Text>
                                        {profileData?.bio && <Text style={detailsStyles.bioText}>{profileData.bio}</Text>}
                                    </View>
                                </Animated.View>

                                {hasAnyData ? (
                                    <>
                                        {hasAboutMeData && (
                                            <Animated.View style={{ opacity: sectionAnims[1].opacity, transform: [{ translateY: sectionAnims[1].translateY }] }}>
                                                <View style={detailsStyles.section}>
                                                    <Text style={detailsStyles.sectionTitle}>Više o meni</Text>
                                                    <View style={detailsStyles.cardsContainer}>
                                                        <DetailCard iconName="star-outline" title="Horoskop" value={profileData?.horoscope} />
                                                        <DetailCard iconName="heart-outline" title="Tip veze" value={profileData?.relationshipType} />
                                                        <DetailCard iconName="people-outline" title="Porodični planovi" value={profileData?.familyPlans} />
                                                        <DetailCard iconName="chatbox-outline" title="Stil komunikacije" value={profileData?.communicationStyle} />
                                                        <DetailCard iconName="heart-circle-outline" title="Ljubavni stil" value={profileData?.loveStyle} />
                                                    </View>
                                                </View>
                                            </Animated.View>
                                        )}
                                        
                                        {hasLifestyleData && (
                                            <Animated.View style={{ opacity: sectionAnims[2].opacity, transform: [{ translateY: sectionAnims[2].translateY }] }}>
                                                <View style={detailsStyles.section}>
                                                    <Text style={detailsStyles.sectionTitle}>Životni stil</Text>
                                                    <View style={detailsStyles.cardsContainer}>
                                                        <DetailCard iconName="paw-outline" title="Ljubimci" value={profileData?.pets} />
                                                        <DetailCard iconName="beer-outline" title="Piće" value={profileData?.drinks} />
                                                        <DetailCard iconName="bonfire-outline" title="Pušenje" value={profileData?.smokes} />
                                                        <DetailCard iconName="barbell-outline" title="Vežbanje" value={profileData?.workout} />
                                                        <DetailCard iconName="nutrition-outline" title="Ishrana" value={profileData?.diet} />
                                                    </View>
                                                </View>
                                            </Animated.View>
                                        )}

                                        {(profileData?.interests?.length ?? 0) > 0 && (
                                            <Animated.View style={{ opacity: sectionAnims[3].opacity, transform: [{ translateY: sectionAnims[3].translateY }] }}>
                                                <View style={detailsStyles.section}>
                                                    <Text style={detailsStyles.sectionTitle}>Interesi</Text>
                                                    <View style={detailsStyles.tagsContainer}>
                                                        {/* ===== ISPRAVKA ===== */}
                                                        {profileData?.interests?.map((interest, index) => (
                                                            <View key={index} style={detailsStyles.tag}><Text style={detailsStyles.tagText}>{interest}</Text></View>
                                                        ))}
                                                    </View>
                                                </View>
                                            </Animated.View>
                                        )}

                                        {(profileData?.languages?.length ?? 0) > 0 && (
                                            <Animated.View style={{ opacity: sectionAnims[4].opacity, transform: [{ translateY: sectionAnims[4].translateY }] }}>
                                                <View style={detailsStyles.section}>
                                                    <Text style={detailsStyles.sectionTitle}>Jezici</Text>
                                                    <View style={detailsStyles.tagsContainer}>
                                                        {/* ===== ISPRAVKA ===== */}
                                                        {profileData?.languages?.map((language, index) => (
                                                            <View key={index} style={detailsStyles.tag}><Text style={detailsStyles.tagText}>{language}</Text></View>
                                                        ))}
                                                    </View>
                                                </View>
                                            </Animated.View>
                                        )}
                                        
                                        {hasBasicsData && (
                                            <Animated.View style={{ opacity: sectionAnims[5].opacity, transform: [{ translateY: sectionAnims[5].translateY }] }}>
                                                <View style={detailsStyles.section}>
                                                    <Text style={detailsStyles.sectionTitle}>Osnove</Text>
                                                    <View style={detailsStyles.cardsContainer}>
                                                        <DetailCard iconName="resize-outline" title="Visina" value={profileData?.height ? `${profileData.height} cm` : null} />
                                                        <DetailCard iconName="briefcase-outline" title="Posao" value={profileData?.jobTitle} />
                                                        <DetailCard iconName="school-outline" title="Obrazovanje" value={profileData?.education} />
                                                        <DetailCard iconName="person-outline" title="Pol" value={profileData?.gender} />
                                                        <DetailCard iconName="transgender-outline" title="Seksualna orijentacija" value={profileData?.sexualOrientation} />
                                                    </View>
                                                </View>
                                            </Animated.View>
                                        )}
                                    </>
                                ) : (
                                    <Animated.View style={{ opacity: sectionAnims[1].opacity, transform: [{ translateY: sectionAnims[1].translateY }] }}>
                                        <View style={detailsStyles.emptyStateContainer}>
                                            <Ionicons name="sparkles-outline" size={60} color={COLORS.primary} style={detailsStyles.emptyStateIcon} />
                                            <Text style={detailsStyles.emptyStateTitle}>{profileData?.fullName} je još uvek misterija!</Text>
                                            <Text style={detailsStyles.emptyStateSubtitle}>
                                                Nema unetih detalja, ali to je prilika da započneš razgovor i saznaš više.
                                            </Text>
                                             <Text style={detailsStyles.emptyStateCTA}>Pošalji lajk da ga/je ohrabriš da popuni profil.</Text>
                                        </View>
                                    </Animated.View>
                                )}

                                <View style={detailsStyles.actionsContainer}>
                                    <TouchableOpacity style={detailsStyles.actionLinkButton} onPress={handleBlockUser}>
                                        <Text style={detailsStyles.actionLinkButtonText}>Blokiraj korisnika {profileData?.fullName}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={detailsStyles.actionLinkButton} onPress={handleReportUser}>
                                        <Text style={detailsStyles.actionLinkButtonText}>Prijavi korisnika {profileData?.fullName}</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={detailsStyles.footerLogoContainer}>
                                    <Image
                                        source={require('../assets/images/1000006381.png')}
                                        style={detailsStyles.footerLogo}
                                        resizeMode="contain"
                                    />
                                    <Text style={detailsStyles.footerLogoText}>Powered by App</Text>
                                </View>
                            </View>
                        </>
                    )}
                </Animated.ScrollView>

                <TouchableOpacity style={detailsStyles.closeButton} onPress={onClose}>
                    <Ionicons name="close-circle" size={36} color="rgba(255, 255, 255, 0.9)" />
                </TouchableOpacity>

                {!isLoading && (
                    <View style={detailsStyles.stickyFooter}>
                        <TouchableOpacity style={[detailsStyles.actionButton, { backgroundColor: COLORS.nope }]} onPress={() => { onNope(); onClose(); }}>
                            <Ionicons name="close" size={40} color={COLORS.white} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[detailsStyles.actionButton, { backgroundColor: COLORS.like }]} onPress={() => { onLike(); onClose(); }}>
                            <Ionicons name="heart" size={35} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </Animated.View>
    );
};

const detailsStyles = StyleSheet.create({
    sliderOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
    touchableOverlay: { flex: 1 },
    sliderContainer: { height: windowHeight * 0.9, backgroundColor: COLORS.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden' },
    headerImageContainer: { position: 'absolute', top: 0, left: 0, right: 0, height: HEADER_IMAGE_HEIGHT, zIndex: 0 },
    headerImage: { width: '100%', height: '100%' },
    headerGradient: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)' },
    scrollViewContent: { backgroundColor: 'transparent', paddingBottom: 120 },
    contentContainer: { backgroundColor: COLORS.background, paddingHorizontal: 20, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
    headerSection: { paddingTop: 30, marginBottom: 10 },
    closeButton: { position: 'absolute', top: 40, right: 20, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20, padding: 2 },
    fullNameText: { fontSize: 28, fontWeight: 'bold', color: COLORS.textPrimary },
    bioText: { fontSize: 16, color: COLORS.textSecondary, marginTop: 5, lineHeight: 22 },
    section: { marginBottom: 25 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 15 },
    cardsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    detailCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBackground, borderRadius: 12, padding: 15, marginBottom: 10, width: '48%', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    detailContent: { marginLeft: 10, flexShrink: 1 },
    detailTitle: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
    detailValue: { fontSize: 14, fontWeight: 'bold', color: COLORS.textPrimary, marginTop: 2 },
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag: { backgroundColor: '#FDECEC', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#FADBD8' },
    tagText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
    skeleton: { backgroundColor: COLORS.skeleton },
    stickyFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 15, paddingBottom: 30, backgroundColor: 'transparent', zIndex: 20 },
    actionButton: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', shadowColor: 'rgba(0, 0, 0, 0.15)', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 12, elevation: 10 },
    footerLogoContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 20 },
    footerLogo: { width: 40, height: 40, marginBottom: 4 },
    footerLogoText: { fontSize: 10, fontWeight: '600', color: COLORS.textSecondary },
    emptyStateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        backgroundColor: COLORS.cardBackground,
        borderRadius: 20,
        marginVertical: 20,
        borderWidth: 1,
        borderColor: COLORS.skeleton
    },
    emptyStateIcon: {
        marginBottom: 20,
    },
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: 10,
    },
    emptyStateSubtitle: {
        fontSize: 15,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    emptyStateCTA: {
        fontSize: 14,
        color: COLORS.primary,
        textAlign: 'center',
        marginTop: 20,
        fontWeight: '600'
    },
    actionsContainer: { marginTop: 40, borderTopWidth: 1, borderTopColor: '#e1e9ee', paddingTop: 20 },
    actionLinkButton: { backgroundColor: COLORS.cardBackground, paddingVertical: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e1e9ee' },
    actionLinkButtonText: { textAlign: 'center', color: COLORS.nope, fontSize: 16, fontWeight: '600' },
});

export default ProfileInfoPanel;
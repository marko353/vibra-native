import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, StatusBar, Platform } from 'react-native';
import { useAuthContext } from '../../context/AuthContext';
import axios from 'axios';
import LottieView from 'lottie-react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
    interpolate,
    Extrapolate
} from 'react-native-reanimated';
import { PanGestureHandler, TouchableOpacity, State, PanGestureHandlerGestureEvent, GestureHandlerStateChangeEvent } from 'react-native-gesture-handler';

// --- Constants ---
const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.95;
const CARD_HEIGHT = height * 0.77;
const SWIPE_THRESHOLD = width * 0.4;
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// --- Function to calculate age from birth date ---
const calculateAge = (birthDateString?: string | null): number | null => {
    if (!birthDateString) return null;
    const birthDate = new Date(birthDateString);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

// --- Butterfly Particle Component for "Like" ---
interface ButterflyParticleProps {
    onAnimationFinish: () => void;
    start: boolean;
}

const ButterflyParticle = ({ onAnimationFinish, start }: ButterflyParticleProps) => {
    const progress = useSharedValue(0);

    useEffect(() => {
        if (start) {
            progress.value = withTiming(1, { duration: 1500 }, (isFinished) => {
                if (isFinished) {
                    runOnJS(onAnimationFinish)();
                }
            });
        }
    }, [start]);

    const animatedStyle = useAnimatedStyle(() => {
        const translateY = interpolate(progress.value, [0, 0.5, 1], [0, -height * 0.5, -height]);
        const opacity = interpolate(progress.value, [0, 0.8, 1], [1, 1, 0]);
        const scale = interpolate(progress.value, [0, 1], [0.5, 1.5]);
        const rotate = interpolate(progress.value, [0, 1], [0, 360]);

        return {
            opacity,
            transform: [{ translateY }, { scale }, { rotate: `${rotate}deg` }],
        };
    });

    return (
        <Animated.View style={[styles.butterflyParticle, animatedStyle]}>
            <Icon name="heart" size={40} color="#FF69B4" />
        </Animated.View>
    );
};

// --- Card Component ---
interface CardProps {
    user: {
        _id: string;
        fullName: string;
        birthDate: string;
        bio: string;
        profilePictures: string[];
        location?: {
            locationCity: string;
            accuracy: number;
            latitude: number;
            longitude: number;
        } | null;
    };
    onSwipe: (id: string, direction: 'left' | 'right') => void;
}

const Card = ({ user, onSwipe }: CardProps) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    const onGestureEvent = ({ nativeEvent }: PanGestureHandlerGestureEvent) => {
        'worklet';
        const { translationX, translationY } = nativeEvent;
        translateX.value = translationX;
        translateY.value = translationY;
    };

    const onHandlerStateChange = ({ nativeEvent }: GestureHandlerStateChangeEvent) => {
        'worklet';
        const { state } = nativeEvent;
        const currentTranslationX = translateX.value;

        if (state === State.END) {
            const shouldSwipeRight = currentTranslationX > SWIPE_THRESHOLD;
            const shouldSwipeLeft = currentTranslationX < -SWIPE_THRESHOLD;

            if (shouldSwipeRight) {
                translateX.value = withTiming(width * 1.5, { duration: 300 }, () => {
                    runOnJS(onSwipe)(user._id, 'right');
                });
            } else if (shouldSwipeLeft) {
                translateX.value = withTiming(-width * 1.5, { duration: 300 }, () => {
                    runOnJS(onSwipe)(user._id, 'left');
                });
            } else {
                translateX.value = withSpring(0);
                translateY.value = withSpring(0);
            }
        }
    };

    const animatedStyle = useAnimatedStyle(() => {
        const rotateZ = interpolate(translateX.value, [-width / 2, width / 2], [-15, 15], Extrapolate.CLAMP);
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { rotateZ: `${rotateZ}deg` },
            ],
        };
    });

    const likeOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolate.CLAMP),
    }));

    const nopeOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], Extrapolate.CLAMP),
    }));

    const age = calculateAge(user.birthDate);
    
    console.log(`Lokacija za korisnika ${user.fullName}:`, user.location?.locationCity);

    return (
        <PanGestureHandler
            onGestureEvent={onGestureEvent}
            onHandlerStateChange={onHandlerStateChange}
        >
            <Animated.View style={[styles.card, animatedStyle]}>
                <Animated.Image
                    source={{ uri: user.profilePictures[0] || 'https://via.placeholder.com/500' }}
                    style={styles.cardImage}
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)']}
                    style={styles.gradientOverlay}
                />
                <View style={styles.cardInfo}>
                    <Text style={styles.name}>
                        {user.fullName}
                        {age !== null ? `, ${age}` : ''}
                    </Text>
                    
                    {/* --- IZMENJENI DEO KODA --- */}
                    {user.location && user.location.locationCity && (
                        <View style={styles.locationContainer}>
                            <Icon name="location-sharp" size={16} color="#fff" style={styles.locationIcon} />
                            <Text style={styles.locationText}>{user.location.locationCity}</Text>
                        </View>
                    )}
                    
                    <Text style={styles.bio} numberOfLines={2}>{user.bio}</Text>
                </View>

                <Animated.View style={[styles.choiceOverlay, { borderColor: '#4CCC93' }, likeOpacity]}>
                    <Text style={[styles.choiceText, { color: '#4CCC93' }]}>LIKE</Text>
                </Animated.View>
                <Animated.View style={[styles.choiceOverlay, { borderColor: '#FF6B6B', right: null, left: 20 }, nopeOpacity]}>
                    <Text style={[styles.choiceText, { color: '#FF6B6B' }]}>NOPE</Text>
                </Animated.View>
            </Animated.View>
        </PanGestureHandler>
    );
};

// --- Main HomeTab Component ---
export default function HomeTab() {
    const { user } = useAuthContext();
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [butterflyParticles, setButterflyParticles] = useState<any[]>([]);

    const fetchUsers = useCallback(async () => {
        console.log('Počinje dohvaćanje korisnika...');
        if (!user?.token || !user?.id) {
            console.log('Token ili ID korisnika nedostaje. Preskače se dohvaćanje.');
            setIsLoading(false);
            return;
        }
        console.log('Dostupan token:', user.token ? 'DA' : 'NE');
        console.log('Dostupan ID korisnika:', user.id ? 'DA' : 'NE');

        try {
            console.log('Pokušava se poziv na API URL:', `${API_BASE_URL}/api/user/all-users`);
            const response = await axios.get(`${API_BASE_URL}/api/user/all-users`, {
                headers: { Authorization: `Bearer ${user.token}` },
            });

            console.log('API odgovor uspješno primljen!');
            console.log('Broj dohvaćenih korisnika (prije filtriranja):', response.data.users.length);

            const filteredUsers = response.data.users.filter((u: any) => u._id !== user.id);
            
            console.log('Broj korisnika nakon filtriranja (uklonjen trenutni korisnik):', filteredUsers.length);
            setUsers(filteredUsers);
        } catch (error) {
            console.error('Greška pri dohvatanju korisnika:');
            if (axios.isAxiosError(error)) {
                console.error('Status greške:', error.response?.status);
                console.error('Podaci o grešci:', error.response?.data);
            } else {
                console.error('Nepoznata greška:', error);
            }
        } finally {
            console.log('Završeno dohvaćanje korisnika. Postavljanje isLoading na false.');
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        console.log('--- useEffect se pokrenuo ---');
        console.log('Trenutno stanje usera:', user);
        if (user?.token && user?.id) {
            console.log('Podaci o korisniku su dostupni, poziva se fetchUsers()...');
            fetchUsers();
        } else {
            console.log('Podaci o korisniku nisu dostupni, čekam na promjenu stanja...');
        }
    }, [user, fetchUsers]);

    const triggerButterflyAnimation = () => {
        const id = Date.now();
        setButterflyParticles(prev => [...prev, { id, start: true }]);
    };

    const removeParticle = (id: number | null) => {
        if (typeof id === 'number') {
            setButterflyParticles(prev => prev.filter(p => p.id !== id));
        }
    };

    const handleSwipe = useCallback(async (targetUserId: string, direction: 'left' | 'right') => {
        if (direction === 'right') {
            triggerButterflyAnimation();
        }

        setUsers(prevUsers => {
            const newUsers = [...prevUsers];
            newUsers.shift();
            return newUsers;
        });

        try {
            await axios.post(`${API_BASE_URL}/api/user/swipe`, {
                targetUserId,
                action: direction === 'right' ? 'like' : 'dislike',
            }, {
                headers: { Authorization: `Bearer ${user?.token}` },
            });
        } catch (error) {
            console.error('Greška pri slanju swipe-a:', error);
        }
    }, [user]);

    const handleButtonSwipe = (direction: 'left' | 'right') => {
        if (users.length > 0) {
            handleSwipe(users[0]._id, direction);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <LottieView
                    source={require('../../assets/animations/butterflies.json')}
                    autoPlay
                    loop
                    style={{ width: 250, height: 250 }}
                />
                <Text style={styles.loadingText}>Tražimo tvoju VIBRU...</Text>
            </View>
        );
    }
        
    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.header}>
                <Icon name="sparkles" size={32} color="#E91E63" />
                <Text style={styles.headerTitle}>vibra</Text>
            </View>

            <View style={styles.cardStack}>
                {users.length === 0 ? (
                    <View style={styles.noMoreCards}>
                        <LottieView
                            source={require('../../assets/animations/butterflies.json')}
                            autoPlay
                            loop={false}
                            style={{ width: 200, height: 200 }}
                        />
                        <Text style={styles.noMoreCardsText}>To je sve za sada!</Text>
                        <Text style={styles.noMoreCardsSubText}>Vrati se uskoro da vidiš nove ljude.</Text>
                        <TouchableOpacity style={styles.refreshButton} onPress={fetchUsers}>
                            <Icon name="refresh-outline" size={24} color="#E91E63" />
                            <Text style={styles.refreshButtonText}>Osveži</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    users.slice(0, 3).map((u: any, index) => {
                        const userWithSafeLocation = {
                          ...u,
                          location: u.location || null
                        };
                        return (
                            <View key={u._id} style={[styles.cardWrapper, { zIndex: users.length - index }]}>
                                <Card
                                    user={userWithSafeLocation}
                                    onSwipe={handleSwipe}
                                />
                            </View>
                        );
                    })
                )}
            </View>

            {butterflyParticles.map(p => (
                <ButterflyParticle
                    key={p.id}
                    start={p.start}
                    onAnimationFinish={() => removeParticle(p.id)}
                />
            ))}

            <View style={styles.controlsContainer}>
                <TouchableOpacity style={styles.controlButton} onPress={() => handleButtonSwipe('left')}>
                    <Icon name="close" size={40} color="#FF6B6B" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.starButton} onPress={() => { }}>
                    <Icon name="star" size={25} color="#6C5CE7" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.controlButton} onPress={() => handleButtonSwipe('right')}>
                    <Icon name="heart" size={40} color="#4CCC93" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

// --- Styles ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff', 
        paddingTop: (Platform.OS === 'android' && StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 60),
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#E91E63',
        marginLeft: 8,
        fontFamily: 'System',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        fontSize: 18,
        color: '#E91E63',
        fontWeight: '600',
        marginTop: -20,
    },
    cardStack: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 30,
    },
    cardWrapper: {
        position: 'absolute',
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    card: {
        width: '100%',
        height: '100%',
        borderRadius: 24,
        backgroundColor: '#fff',
    },
    cardImage: {
        width: '100%',
        height: '100%',
        borderRadius: 24,
    },
    gradientOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
        borderRadius: 24,
    },
    cardInfo: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    },
    name: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
        marginBottom: 4,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    locationIcon: {
        marginRight: 5,
    },
    locationText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 5,
    },
    bio: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 5,
    },
    controlsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        paddingBottom: 40,
        paddingTop: 40,
        zIndex:999,
    },
    controlButton: {
        width: 70,
        height: 70,
        top: 50,
        borderRadius: 35,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 8,
    },
    starButton: { 
        width: 55,
        height: 55,
        top: 50,
        borderRadius: 27.5,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 8,
    },
    choiceOverlay: {
        position: 'absolute',
        top: 40,
        right: 20,
        borderWidth: 4,
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 8,
        transform: [{ rotate: '15deg' }],
    },
    choiceText: {
        fontSize: 32,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    noMoreCards: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20
    },
    noMoreCardsText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#E91E63',
        marginTop: -20,
    },
    noMoreCardsSubText: {
        fontSize: 16,
        color: '#AD1457',
        textAlign: 'center',
        marginTop: 10
    },
    butterflyParticle: {
        position: 'absolute',
        bottom: 50,
        alignSelf: 'center',
        zIndex: 999,
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 25,
        paddingVertical: 12,
        paddingHorizontal: 25,
        marginTop: 20,
    },
    refreshButtonText: {
        color: '#E91E63',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});
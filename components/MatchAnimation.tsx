// components/MatchAnimation.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { UserProfile } from '../context/ProfileContext';
import { useAuthContext } from '../context/AuthContext';

interface MatchAnimationProps {
    matchedUser: UserProfile;
    onSendMessage: () => void;
    onClose: () => void;
}

export default function MatchAnimation({ matchedUser, onSendMessage, onClose }: MatchAnimationProps) {
    const { user } = useAuthContext();
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);

    useEffect(() => {
        opacity.value = withTiming(1, { duration: 300 });
        scale.value = withTiming(1, { duration: 500 });
    }, []);

    const animatedContainer = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return (
        <View style={styles.container}>
            <LottieView
                source={require('../assets/animations/confetti.json')} // Stavi tvoju animaciju ovde
                autoPlay
                loop={false}
                style={styles.lottie}
                resizeMode="cover"
            />
            <Animated.View style={[styles.content, animatedContainer]}>
                <Text style={styles.title}>IT S A VIBRATION!</Text>
                <Text style={styles.subtitle}>Ti i {matchedUser.fullName} ste se svideli jedno drugom.</Text>
                
                <View style={styles.avatarsContainer}>
                    <Image source={{ uri: user?.avatar }} style={styles.avatar} />
                    <Image source={{ uri: matchedUser.avatar }} style={styles.avatar} />
                </View>

                <TouchableOpacity style={styles.buttonPrimary} onPress={onSendMessage}>
                    <Text style={styles.buttonTextPrimary}>Pošalji poruku</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.buttonSecondary} onPress={onClose}>
                    <Text style={styles.buttonTextSecondary}>Nastavi sa prevlačenjem</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    lottie: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#fff',
        textTransform: 'uppercase',
        textShadowColor: 'rgba(233, 30, 99, 0.7)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 15,
    },
    subtitle: {
        fontSize: 16,
        color: '#eee',
        marginTop: 10,
        marginBottom: 30,
    },
    avatarsContainer: {
        flexDirection: 'row',
        marginBottom: 40,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#fff',
        marginHorizontal: -15,
    },
    buttonPrimary: {
        width: '100%',
        backgroundColor: '#fff',
        paddingVertical: 15,
        borderRadius: 30,
        alignItems: 'center',
        marginBottom: 15,
    },
    buttonTextPrimary: {
        color: '#E91E63',
        fontSize: 18,
        fontWeight: 'bold',
    },
    buttonSecondary: {
        paddingVertical: 15,
    },
    buttonTextSecondary: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
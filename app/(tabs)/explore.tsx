// Ažuriran fajl: ExploreScreen.js
import React from 'react';
import { View, Text, Button, StyleSheet, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthContext } from '../../context/AuthContext'; // Import AuthContext
import Header from '../../components/Header';

export default function ExploreScreen() {
    const router = useRouter();
    const { logout } = useAuthContext();

    const handleLogout = async () => {
        try {
            await logout();
            router.replace('/(auth)/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Header withShadow={false} />
            <View style={styles.header}>
                <Text style={styles.title}>Explore</Text>
            </View>
            <View style={styles.content}>
                <Text>This is the Explore content.</Text>
                {/* Ažuriran kod: Premestili smo dugme u 'content' */}
                <View style={styles.logoutButtonWrapper}>
                    <Button title="Logout" onPress={handleLogout} />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    title: { fontSize: 24, fontWeight: 'bold' },
    content: {
        flex: 1,
        justifyContent: 'center', // Ovo će centrirati sadržaj (i dugme) vertikalno
        alignItems: 'center',    // Ovo će centrirati sadržaj (i dugme) horizontalno
    },
    logoutButtonWrapper: {
        marginTop: 20, // Dodaje malo razmaka iznad dugmeta
        width: '80%', // Postavlja širinu dugmeta
    },
});
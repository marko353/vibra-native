// A new or existing file: ExploreScreen.js
import React from 'react';
import { View, Text, Button, SafeAreaView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthContext } from '../../context/AuthContext'; // Import the AuthContext

// This component would likely be in a file like 'explore.tsx' or 'index.tsx'
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
            <View style={styles.header}>
                <Text style={styles.title}>Explore</Text>
                {/* The logout button is now here */}
                <Button title="Logout" onPress={handleLogout} />
            </View>
            <View style={styles.content}>
                <Text>This is the Explore content.</Text>
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
        justifyContent: 'center',
        alignItems: 'center',
    },
});
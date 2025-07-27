import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Dobrodošao na početnu stranu VibrA!</Text>

      <Button
        title="Logout"
        color="#e63946"
        onPress={() => {
          // Ovde obrisi token ako koristiš async storage
          router.replace('/login');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20, fontWeight: '600', marginBottom: 20 },
});

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

export default function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Definišemo animaciju koja će se izvršiti
    Animated.sequence([
      // 1. Čekamo 1.5 sekundu
      Animated.delay(1500),
      // 2. Zatim, u isto vreme, smanjujemo i činimo sliku providnom u trajanju od 1 sekunde
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.85,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Kada se animacija završi, pozivamo onFinish funkciju
      onFinish();
    });
  }, []); // Prazan niz osigurava da se useEffect izvrši samo jednom

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../assets/images/1000006401.png')}
        style={[styles.image, { opacity, transform: [{ scale }] }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 200,
  },
});


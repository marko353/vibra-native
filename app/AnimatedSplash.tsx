import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

export default function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    console.log("Splash screen animacija započeta");

    const timeout = setTimeout(() => {
      console.log("Fallback: Animacija nije završena na vreme");
      onFinish();
    }, 3000); // Fallback nakon 3 sekunde

    Animated.sequence([
      Animated.delay(1500),
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
      clearTimeout(timeout); // Otkazujemo fallback ako animacija uspe
      console.log("Animacija završena, pozivamo onFinish");
      onFinish();
    });
  }, [onFinish, opacity, scale]); // Prazan niz osigurava da se useEffect izvrši samo jednom

  console.log("Renderovanje splash ekrana");

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require("../assets/images/1000006401.png")}
        style={[styles.image, { opacity, transform: [{ scale }] }]}
        resizeMode="contain"
        onLoad={() => console.log("Slika splash ekrana uspešno učitana")}
        onError={(error) =>
          console.log("Greška pri učitavanju slike splash ekrana:", error)
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: 200,
    height: 200,
  },
});

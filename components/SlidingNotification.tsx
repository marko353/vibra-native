import React, { useEffect, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface SlidingNotificationProps {
  title: string;
  message: string;
  onPress: () => void;
}

const SlidingNotification: React.FC<SlidingNotificationProps> = ({
  title,
  message,
  onPress,
}) => {
  const [slideAnim] = useState(new Animated.Value(-150)); // Početna pozicija izvan ekrana

  useEffect(() => {
    console.log("📩 [SlidingNotification] Nova notifikacija:", { title, message });

    // Resetovanje animacije pre prikaza
    slideAnim.setValue(-150);

    // Animacija prikazivanja
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 8,
      tension: 50,
      useNativeDriver: true,
    }).start();

    // Automatsko sakrivanje nakon 3 sekunde
    const timer = setTimeout(() => {
      console.log("📩 [SlidingNotification] Sakrivam notifikaciju.");
      Animated.timing(slideAnim, {
        toValue: -150,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 3000);

    return () => clearTimeout(timer);
  }, [title, message]); // Dodato osvežavanje kada se promene podaci

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY: slideAnim }] }]}
    >
      <TouchableOpacity style={styles.notification} onPress={onPress}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.message}>{message}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  notification: {
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 15,
    margin: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 5,
    marginBottom: 5,
  },
  title: {
    color: "#333",
    fontWeight: "bold",
    fontSize: 18,
  },
  body: {
    paddingTop: 5,
  },
  message: {
    color: "#555",
    fontSize: 16,
  },
});

export default SlidingNotification;
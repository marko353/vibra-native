import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface MatchToastProps {
  visible: boolean;
  matchedUserName: string;
  matchedUserAvatar?: string;
  chatId: string;
  onPress: (chatId: string) => void;
  onHide: () => void;
}

export const MatchToast: React.FC<MatchToastProps> = ({
  visible,
  matchedUserName,
  matchedUserAvatar,
  chatId,
  onPress,
  onHide,
}) => {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after 4 sekunde
      const timer = setTimeout(() => {
        hideToast();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => onHide());
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }], opacity },
      ]}
    >
      <TouchableOpacity
        style={styles.toast}
        onPress={() => {
          hideToast();
          onPress(chatId);
        }}
        activeOpacity={0.9}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {matchedUserAvatar ? (
            <Image source={{ uri: matchedUserAvatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>
                {matchedUserName?.[0]?.toUpperCase() || "?"}
              </Text>
            </View>
          )}
          {/* Heart badge */}
          <View style={styles.heartBadge}>
            <Text style={styles.heartEmoji}>❤️</Text>
          </View>
        </View>

        {/* Tekst */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Novi meč! 🎉</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            Ti i {matchedUserName} ste se spojili
          </Text>
          <Text style={styles.cta}>Tapni da pošalješ poruku →</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 12,
    right: 12,
    zIndex: 9999,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#FFE0CC",
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "#FF6A00",
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFE0CC",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FF6A00",
  },
  avatarPlaceholderText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FF6A00",
  },
  heartBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  heartEmoji: {
    fontSize: 13,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  subtitle: {
    fontSize: 13,
    color: "#666",
  },
  cta: {
    fontSize: 12,
    color: "#FF6A00",
    fontWeight: "600",
    marginTop: 2,
  },
});
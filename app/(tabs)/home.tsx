import React, { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import LottieView from "lottie-react-native";
import {
  Dimensions,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthContext } from "../../context/AuthContext";
import { useSocketContext } from "../../context/SocketContext";
import Card from "../../components/CardComponent";
import Header from "../../components/Header";
import LikeFilterModal from "../../components/likes/LikeFilterModal";
import MatchAnimation from "../../components/MatchAnimation";
import ProfileInfoPanel from "../../components/ProfileInfoPanel";
import { useFilterModal } from "../../context/FilterModalContext";
import { UserProfile } from "../../context/ProfileContext";

const { height, width } = Dimensions.get("window");
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "";

// --- ButterflyParticle ---
const ButterflyParticle = ({
  onAnimationFinish,
  start,
}: {
  onAnimationFinish: () => void;
  start: boolean;
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (start) {
      progress.value = withTiming(1, { duration: 1500 }, (isFinished?: boolean) => {
        if (isFinished) runOnJS(onAnimationFinish)();
      });
    }
  }, [start]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.8, 1], [1, 1, 0]),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -height]) },
      { scale: interpolate(progress.value, [0, 1], [0.5, 1.5]) },
      { rotate: `${interpolate(progress.value, [0, 1], [0, 360])}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.butterflyParticle, animatedStyle]}>
      <Ionicons name="heart" size={40} color="#FF69B4" />
    </Animated.View>
  );
};

// --- ControlButton --- premium okruglo dugme sa outer ring
const ControlButton = ({
  icon,
  size = 28,
  onPress,
  variant = "default",
}: {
  icon: keyof typeof Ionicons.glyphMap;
  size?: number;
  onPress?: () => void;
  variant?: "nope" | "like" | "super" | "default";
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const configs = {
    nope: {
      bg: "#FFFFFF",
      iconColor: "#FF4757",
      ringColor: "rgba(255,71,87,0.12)",
      shadowColor: "#FF4757",
      innerSize: 60,
      ringSize: 76,
    },
    like: {
      bg: "#FFFFFF",
      iconColor: "#FF6A00",
      ringColor: "rgba(255,106,0,0.12)",
      shadowColor: "#FF6A00",
      innerSize: 60,
      ringSize: 76,
    },
    super: {
      bg: "#FFFFFF",
      iconColor: "#A78BFA",
      ringColor: "rgba(167,139,250,0.12)",
      shadowColor: "#A78BFA",
      innerSize: 48,
      ringSize: 62,
    },
    default: {
      bg: "#FFFFFF",
      iconColor: "#8E8E93",
      ringColor: "rgba(0,0,0,0.06)",
      shadowColor: "#000",
      innerSize: 48,
      ringSize: 62,
    },
  };

  const c = configs[variant];

  return (
    <TouchableWithoutFeedback
      onPressIn={() => {
        scale.value = withSpring(0.88, { damping: 8, stiffness: 200 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 8, stiffness: 200 });
        onPress?.();
      }}
    >
      <Animated.View style={animatedStyle}>
        {/* Outer ring */}
        <View
          style={{
            width: c.ringSize,
            height: c.ringSize,
            borderRadius: c.ringSize / 2,
            backgroundColor: c.ringColor,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Inner button */}
          <View
            style={{
              width: c.innerSize,
              height: c.innerSize,
              borderRadius: c.innerSize / 2,
              backgroundColor: c.bg,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: c.shadowColor,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.22,
              shadowRadius: 14,
              elevation: 8,
            }}
          >
            <Ionicons name={icon} size={size} color={c.iconColor} />
          </View>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export default function HomeScreen() {
  const { isVisible, showModal, hideModal, filterValues, setFilterValues } = useFilterModal();
  const { user } = useAuthContext();
  const { socket } = useSocketContext();
  const queryClient = useQueryClient();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [butterflyParticles, setButterflyParticles] = useState<any[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPanelVisible, setPanelVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [matchData, setMatchData] = useState<UserProfile | null>(null);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!user?.token || !user?.id) { setIsLoading(false); return; }
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/user/potential-matches`, {
        headers: { Authorization: `Bearer ${user.token}` },
        params: {
          minAge: filterValues.ageRange[0],
          maxAge: filterValues.ageRange[1],
          maxDistance: filterValues.distance,
          gender: filterValues.gender,
          latitude: user.location?.latitude,
          longitude: user.location?.longitude,
        },
      });
      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Greška pri dohvatanju korisnika:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, filterValues]);

  useEffect(() => {
    if (user?.token && user?.id) fetchUsers();
  }, [user, fetchUsers, filterValues]);

  const handleInfoPress = (userToShow: UserProfile) => {
    setSelectedUser(userToShow);
    setPanelVisible(true);
  };

  const handleClosePanel = () => {
    setPanelVisible(false);
    setTimeout(() => setSelectedUser(null), 300);
  };

  const triggerButterflyAnimation = () => {
    const id = Date.now();
    setButterflyParticles((prev) => [...prev, { id, start: true }]);
  };

  const removeParticle = (id: number) => {
    setButterflyParticles((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSwipe = useCallback(async (targetUserId: string, direction: "left" | "right") => {
    if (direction === "right") triggerButterflyAnimation();
    setUsers((prev) => prev.slice(1));
    setCurrentImageIndex(0);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/user/swipe`,
        { targetUserId, action: direction === "right" ? "like" : "dislike" },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      if (direction === "right" && !response.data.match) {
        socket?.emit("likeSent", { targetUserId });
      }
      if (response.data.match) {
        queryClient.invalidateQueries({ queryKey: ["incoming-likes", user?.id] });
        queryClient.invalidateQueries({ queryKey: ["matches-and-conversations", user?.id] });
        setMatchData(response.data.matchedUser);
      }
    } catch (error) {
      console.error("❌ Greška pri swipe-u:", error);
    }
  }, [user?.token, user?.id, socket, queryClient]);

  const handleButtonSwipe = (direction: "left" | "right") => {
    const topUser = users[0];
    if (topUser?._id) handleSwipe(topUser._id, direction);
  };

  const closeMatchAnimation = () => setMatchData(null);

  const handleSendMessageFromMatch = useCallback(async (message: string) => {
    if (!matchData || !user?.token || !user?.id) { closeMatchAnimation(); return; }
    const targetUserId = matchData._id;
    const trimmedMessage = message.trim();
    if (trimmedMessage) {
      queryClient.setQueryData(["matches-and-conversations", user.id], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          newMatches: (oldData.newMatches || []).filter((m: any) => m._id !== targetUserId),
          conversations: [
            {
              chatId: "temp-" + Date.now(),
              user: { _id: targetUserId, fullName: matchData.fullName, avatar: matchData.avatar },
              lastMessage: { text: trimmedMessage, timestamp: new Date().toISOString() },
              has_unread: false,
            },
            ...(oldData.conversations || []),
          ],
        };
      });
      try {
        await axios.post(
          `${API_BASE_URL}/api/user/message`,
          { recipientId: targetUserId, text: trimmedMessage },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        showToast("Poruka uspešno poslata!", "success");
        queryClient.invalidateQueries({ queryKey: ["matches-and-conversations", user.id] });
      } catch {
        showToast("Greška pri slanju poruke.", "error");
        queryClient.invalidateQueries({ queryKey: ["matches-and-conversations", user.id] });
      }
    } else {
      showToast("Match sačuvan!", "success");
    }
    closeMatchAnimation();
  }, [matchData, user, queryClient, showToast]);

  const handleImageChange = (direction: "left" | "right") => {
    if (users.length === 0) return;
    setCurrentImageIndex((prev) => {
      const total = users[0]?.profilePictures?.length || 0;
      if (total <= 1) return prev;
      return direction === "right" ? (prev + 1) % total : (prev - 1 + total) % total;
    });
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FCFCFD" />
        <Header onFilterClick={showModal} />

        <View style={styles.contentContainer}>

          {/* ── Loading ── */}
          {isLoading && (
            <View style={styles.centerState}>
              <LottieView
                source={require("../../assets/animations/butterflies.json")}
                autoPlay
                loop
                style={{ width: 200, height: 200 }}
              />
              <Text style={styles.stateTitle}>Tražimo tvoju VIBRU...</Text>
            </View>
          )}

          {/* ── Empty ── */}
          {!isLoading && users.length === 0 && (
            <View style={styles.centerState}>
              <View style={styles.emptyCircle}>
                <Ionicons name="heart-dislike-outline" size={32} color="#FF6A00" />
              </View>
              <Text style={styles.stateTitle}>To je sve za sada!</Text>
              <Text style={styles.stateSubtitle}>Vrati se uskoro da vidiš nove ljude.</Text>
              <TouchableOpacity onPress={fetchUsers} activeOpacity={0.8} style={styles.refreshBtn}>
                <Ionicons name="refresh-outline" size={18} color="#FF6A00" />
                <Text style={styles.refreshBtnText}>Osveži</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Cards ── */}
          {!isLoading && users.length > 0 && (
            <View style={styles.cardStack}>
              {users.slice(0, 3).reverse().map((userItem, index, arr) => {
                const isTopCard = index === arr.length - 1;
                return (
                  <Card
                    key={userItem._id}
                    user={userItem}
                    onSwipe={handleSwipe}
                    currentImageIndex={isTopCard ? currentImageIndex : 0}
                    onImageChange={handleImageChange}
                    isTopCard={isTopCard}
                    onInfoPress={handleInfoPress}
                  />
                );
              })}
            </View>
          )}

          {/* ── Particles ── */}
          {butterflyParticles.map((p) => (
            <ButterflyParticle key={p.id} start={p.start} onAnimationFinish={() => removeParticle(p.id)} />
          ))}

          {/* ── Controls ── */}
          {!isLoading && users.length > 0 && (
            <View style={styles.controlsWrapper}>
              <ControlButton
                icon="close"
                size={26}
                variant="nope"
                onPress={() => handleButtonSwipe("left")}
              />
              <ControlButton
                icon="star"
                size={20}
                variant="super"
                onPress={() => console.log("Super like")}
              />
              <ControlButton
                icon="heart"
                size={26}
                variant="like"
                onPress={() => handleButtonSwipe("right")}
              />
            </View>
          )}
        </View>

        {/* ── Profile Panel ── */}
        <Modal animationType="none" transparent visible={isPanelVisible} onRequestClose={handleClosePanel}>
          <ProfileInfoPanel
            user={selectedUser}
            isVisible={isPanelVisible}
            onClose={handleClosePanel}
            onLike={() => { if (selectedUser?._id) { handleSwipe(selectedUser._id, "right"); handleClosePanel(); } }}
            onNope={() => { if (selectedUser?._id) { handleSwipe(selectedUser._id, "left"); handleClosePanel(); } }}
          />
        </Modal>

        {/* ── Match ── */}
        {!!matchData && (
          <Modal visible transparent animationType="fade" onRequestClose={closeMatchAnimation}>
            <View style={styles.fullScreenMatch}>
              <MatchAnimation
                matchedUser={matchData}
                onSendMessage={handleSendMessageFromMatch}
                onClose={closeMatchAnimation}
              />
            </View>
          </Modal>
        )}

        {/* ── Toast ── */}
        {!!toastMessage && (
          <View style={[styles.toast, toastMessage.type === "success" ? styles.toastSuccess : styles.toastError]}>
            <Ionicons
              name={toastMessage.type === "success" ? "checkmark-circle" : "alert-circle"}
              size={18}
              color="#fff"
            />
            <Text style={styles.toastText}>{toastMessage.message}</Text>
          </View>
        )}
      </View>

      <LikeFilterModal
        visible={isVisible}
        onClose={hideModal}
        initialFilters={filterValues}
        onApply={(filters) => { setFilterValues(filters); hideModal(); }}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCFCFD",
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 55,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  stateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  stateSubtitle: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 20,
  },
  emptyCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFF3EC",
    borderWidth: 1.5,
    borderColor: "#FFD0A8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#FFD0A8",
    backgroundColor: "#FFF3EC",
  },
  refreshBtnText: {
    color: "#FF6A00",
    fontWeight: "700",
    fontSize: 15,
  },
  cardStack: {
    flex: 1,
    
  },
  butterflyParticle: {
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
    zIndex: 999,
  },
  // Controls — outer ring + inner shadow
  controlsWrapper: {
    position: "absolute",
    bottom: 5,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  fullScreenMatch: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  toast: {
    position: "absolute",
    top: 56,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    maxWidth: width - 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 99999,
  },
  toastSuccess: { backgroundColor: "#1C1C1E" },
  toastError: { backgroundColor: "#FF3B30" },
  toastText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    flexShrink: 1,
  },
});
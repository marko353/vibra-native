import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  State,
  TapGestureHandler,
  TapGestureHandlerStateChangeEvent,
} from "react-native-gesture-handler";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Icon from "react-native-vector-icons/Ionicons";
import { UserProfile } from "../context/ProfileContext";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width;
const SWIPE_THRESHOLD = width * 0.27;

const ORANGE = "#FF6A00";

interface InfoItemData {
  icon: string;
  text: string | number;
  label?: string;
}

interface CardProps {
  user: UserProfile;
  onSwipe: (userId: string, direction: "left" | "right") => void;
  currentImageIndex: number;
  isTopCard: boolean;
  onImageChange: (direction: "left" | "right") => void;
  onInfoPress: (user: UserProfile) => void;
  cardStyle?: StyleProp<ViewStyle>;
}

const InfoItem = ({ icon, text }: { icon: string; text: string | number }) => (
  <View style={styles.infoBadge}>
    <Icon name={icon} size={13} color="rgba(255,255,255,0.9)" />
    <Text style={styles.infoBadgeText} numberOfLines={1}>
      {text}
    </Text>
  </View>
);

const TabItem = ({ text }: { text: string | number }) => (
  <View style={styles.interestBadge}>
    <Text style={styles.interestBadgeText}>{text}</Text>
  </View>
);

const Card: React.FC<CardProps> = ({
  user,
  onSwipe,
  currentImageIndex,
  isTopCard,
  onImageChange,
  onInfoPress,
  cardStyle,
}) => {
  const tapRef = useRef(null);
  const panRef = useRef(null);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scaleOnTap = useSharedValue(1);
  const imageOpacity = useSharedValue(1);
  const prevImageOpacity = useSharedValue(0);

  const calculateAge = (birthDateString?: string | null): number | null => {
    if (!birthDateString) return null;
    const birthDate = new Date(birthDateString);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const age = calculateAge(user.birthDate);
  const imageUri = user.profilePictures?.[currentImageIndex] || "https://placehold.co/500x700?text=No+Image";
  const [prevImageUri, setPrevImageUri] = useState<string | null>(imageUri);

  useEffect(() => {
    if (!imageUri || prevImageUri === imageUri) return;
    prevImageOpacity.value = 1;
    imageOpacity.value = 0;
    prevImageOpacity.value = withTiming(0, { duration: 280 });
    imageOpacity.value = withTiming(1, { duration: 280 }, () => {
      runOnJS(setPrevImageUri)(imageUri);
    });
  }, [currentImageIndex, imageUri]);

  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    "worklet";
    translateX.value = event.nativeEvent.translationX;
    translateY.value = event.nativeEvent.translationY;
  };

  const onPanHandlerStateChange = useCallback(
    (event: PanGestureHandlerGestureEvent) => {
      "worklet";
      const { state, translationX, velocityX } = event.nativeEvent;
      if (state === State.END) {
        const swipeSpeed = Math.abs(velocityX);
        const shouldSwipeRight = translationX > SWIPE_THRESHOLD || (translationX > 0 && swipeSpeed > 800);
        const shouldSwipeLeft = translationX < -SWIPE_THRESHOLD || (translationX < 0 && swipeSpeed > 800);

        if (shouldSwipeRight || shouldSwipeLeft) {
          const direction = shouldSwipeRight ? "right" : "left";
          const userId = user._id || "";
          translateX.value = withTiming(
            width * (direction === "right" ? 1.5 : -1.5),
            { duration: 250 },
            () => { runOnJS(onSwipe)(userId, direction); }
          );
        } else {
          translateX.value = withSpring(0, { damping: 15 });
          translateY.value = withSpring(0, { damping: 15 });
        }
      }
    },
    [user, onSwipe]
  );

  const onTapHandlerStateChange = useCallback(
    (event: TapGestureHandlerStateChangeEvent) => {
      "worklet";
      if (event.nativeEvent.state === State.ACTIVE) {
        const isLeftTap = event.nativeEvent.x < CARD_WIDTH / 2;
        runOnJS(onImageChange)(isLeftTap ? "left" : "right");
        scaleOnTap.value = withTiming(0.985, { duration: 80 }, () => {
          scaleOnTap.value = withTiming(1, { duration: 120 });
        });
      }
    },
    [onImageChange]
  );

  const animatedStyle = useAnimatedStyle(() => {
    const rotateZ = interpolate(translateX.value, [-width / 2, width / 2], [-10, 10], "clamp");
    const scale = interpolate(Math.abs(translateX.value), [0, width / 2], [1, 0.96], "clamp");
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotateZ: `${rotateZ}deg` },
        { scale: scaleOnTap.value * scale },
      ],
    };
  });

  const animatedImageStyle = useAnimatedStyle(() => ({ opacity: imageOpacity.value }));
  const animatedPrevImageStyle = useAnimatedStyle(() => ({ opacity: prevImageOpacity.value }));

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [20, 100], [0, 1], "clamp"),
  }));
  const nopeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-20, -100], [0, 1], "clamp"),
  }));

  // Info bedževi
  const allAvailableInfo: InfoItemData[][] = [];
  const addSingleInfo = (icon: string, text: string | number | undefined | null) => {
    if (text) allAvailableInfo.push([{ icon, text }]);
  };

  if (user.showLocation && user.location?.locationCity) {
    addSingleInfo("location-outline", user.location.locationCity);
  }
  addSingleInfo("heart-outline", user.relationshipType);
  addSingleInfo("briefcase-outline", user.jobTitle);

  if (user.languages?.length) {
    allAvailableInfo.push([{ icon: "language-outline", text: user.languages.join(", ") }]);
  }

  const validInterests = (user.interests || []).slice(0, 5);
  if (validInterests.length > 0) {
    allAvailableInfo.push([
      { icon: "sparkles", text: "Interesovanja", label: "header" },
      ...validInterests.map((i) => ({ icon: "", text: i, label: "tab" })),
    ]);
  }

  const infoCount = allAvailableInfo.length;
  const visibleInfoSet = currentImageIndex < infoCount ? allAvailableInfo[currentImageIndex] : [];
  const isInterestsSet = visibleInfoSet.length > 0 && visibleInfoSet[0].label === "header";

  const totalImages = (user.profilePictures || []).length;

  const CardView = () => (
    <View style={styles.card}>
      {/* Blurred background */}
      <Image source={{ uri: imageUri }} style={styles.imageBackground} blurRadius={20} />

      {/* Crossfade images */}
      {prevImageUri && (
        <Animated.Image source={{ uri: prevImageUri }} style={[styles.imageMain, animatedPrevImageStyle]} />
      )}
      <Animated.Image source={{ uri: imageUri }} style={[styles.imageMain, animatedImageStyle]} />

      {/* Top gradient — za vidljivost indikatora */}
      <LinearGradient
        colors={["rgba(0,0,0,0.35)", "transparent"]}
        style={styles.gradientTop}
      />

      {/* Like/Nope overlays */}
      {isTopCard && (
        <>
          <Animated.View style={[styles.swipeOverlay, styles.likeOverlay, likeOpacity]}>
            <View style={styles.swipeBadge}>
              <Icon name="heart" size={22} color="#4ADE80" />
              <Text style={[styles.swipeBadgeText, { color: "#4ADE80" }]}>LIKE</Text>
            </View>
          </Animated.View>
          <Animated.View style={[styles.swipeOverlay, styles.nopeOverlay, nopeOpacity]}>
            <View style={styles.swipeBadge}>
              <Icon name="close" size={22} color="#FF4757" />
              <Text style={[styles.swipeBadgeText, { color: "#FF4757" }]}>NOPE</Text>
            </View>
          </Animated.View>
        </>
      )}

      {/* Bottom gradient */}
      <LinearGradient
        colors={[
          "transparent",
          "rgba(0,0,0,0.1)",
          "rgba(0,0,0,0.65)",
          "rgba(0,0,0,0.95)",
        ]}
        locations={[0, 0.45, 0.72, 1]}
        style={styles.gradientBottom}
      />

      {/* Photo indicators */}
      {totalImages > 1 && (
        <View style={styles.indicators}>
          {user.profilePictures!.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                currentImageIndex === index && styles.indicatorActive,
              ]}
            />
          ))}
        </View>
      )}

      {/* Bottom info */}
      <View style={styles.infoSection}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {user.fullName}
            <Text style={styles.age}>  {age}</Text>
          </Text>
        </View>

        {visibleInfoSet.length > 0 && (
          <View style={styles.infoRow}>
            {isInterestsSet ? (
              <>
                <View style={styles.interestHeaderIcon}>
                  <Icon name="sparkles" size={13} color={ORANGE} />
                </View>
                {visibleInfoSet.slice(1).map((item, i) => (
                  <TabItem key={i} text={item.text} />
                ))}
              </>
            ) : (
              visibleInfoSet.map((item, i) => (
                <InfoItem key={i} icon={item.icon} text={item.text} />
              ))
            )}
          </View>
        )}
      </View>
    </View>
  );

  const InfoButton = () => (
    <TouchableOpacity
      style={styles.infoButton}
      onPress={() => onInfoPress(user)}
      activeOpacity={0.75}
    >
      <View style={styles.infoButtonInner}>
        <Icon name="information-circle-outline" size={24} color="rgba(255,255,255,0.95)" />
      </View>
    </TouchableOpacity>
  );

  if (!isTopCard) {
    return (
      <View style={[styles.cardWrapper, styles.backCardStyle, cardStyle]}>
        <CardView />
      </View>
    );
  }

  return (
    <PanGestureHandler onGestureEvent={onGestureEvent} onHandlerStateChange={onPanHandlerStateChange}>
      <Animated.View style={[styles.cardWrapper, animatedStyle, cardStyle]}>
        <TapGestureHandler onHandlerStateChange={onTapHandlerStateChange}>
          <Animated.View style={styles.innerCardContainer}>
            <CardView />
          </Animated.View>
        </TapGestureHandler>
        <InfoButton />
      </Animated.View>
    </PanGestureHandler>
  );
};

export default Card;

const styles = StyleSheet.create({
  cardWrapper: {
    width: CARD_WIDTH,
    height: "100%",
    borderRadius: 24,
    position: "absolute",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  backCardStyle: {
    transform: [{ scale: 0.94 }, { translateY: 10 }],
    opacity: 0.8,
  },
  innerCardContainer: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
  },
  card: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: "#0f172a",
    overflow: "hidden",
  },
  imageBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  imageMain: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    position: "absolute",
  },
  gradientTop: {
    position: "absolute",
    top: 0,
    height: "18%",
    width: "100%",
    zIndex: 10,
  },
  gradientBottom: {
    position: "absolute",
    bottom: 0,
    height: "65%",
    width: "100%",
  },
  swipeOverlay: {
    position: "absolute",
    top: 52,
    zIndex: 30,
  },
  likeOverlay: { left: 20 },
  nopeOverlay: { right: 20 },
  swipeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 2,
    borderColor: "currentColor",
  },
  swipeBadgeText: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1,
  },
  indicators: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 3,
    zIndex: 25,
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 28,
    backgroundColor: "transparent",
  },
  indicator: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 4,
  },
  indicatorActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 5,
  },
  infoSection: {
    position: "absolute",
    bottom: 40,
    left: 18,
    right: 68,
    zIndex: 10,
  },
  titleRow: {
    marginBottom: 10,
  },
  name: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  age: {
    fontSize: 22,
    fontWeight: "300",
    color: "rgba(255,255,255,0.82)",
    letterSpacing: 0,
  },
  infoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
  },
  infoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(255,106,0,0.5)",
  },
  infoBadgeText: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  interestHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: "rgba(255,106,0,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,106,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  interestBadge: {
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(255,106,0,0.5)",
  },
  interestBadgeText: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 12,
    fontWeight: "600",
  },
  infoButton: {
    position: "absolute",
    bottom: 40,
    right: 16,
    zIndex: 20,
  },
  infoButtonInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    justifyContent: "center",
    alignItems: "center",
  },
});
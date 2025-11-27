import React, { useState, useEffect, useCallback, memo } from "react";
import {
  View,
  StyleSheet,
  Image,
  Text,
  useWindowDimensions,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Carousel from "react-native-reanimated-carousel";
import Animated, {
  useAnimatedStyle,
  interpolate,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
  white: "#FFFFFF",
  black: "#000000",
  primary: "#E91E63",
};

// --------------------
// TYPES
// --------------------
type CarouselItemProps = {
  item: string;
  animationValue: any;
};

type IndicatorProps = {
  index: number;
  currentIndex: number;
};

type ProfileCarouselProps = {
  images: string[];
  fullName?: string;
  age?: number | null;
  locationCity?: string;
  showLocation?: boolean;
  onShowSlider: () => void;
};

// --------------------
// CAROUSEL ITEM
// --------------------
const ParallaxCarouselItem = memo(
  ({ item, animationValue }: CarouselItemProps) => {
    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [
          {
            scale: interpolate(animationValue.value, [-1, 0, 1], [
              0.9,
              1,
              1.03,
            ]),
          },
          {
            translateY: interpolate(animationValue.value, [-1, 0, 1], [
              -8,
              0,
              6,
            ]),
          },
        ],
      };
    });

    return (
      <Animated.View style={[styles.carouselItem, animatedStyle]}>
        <Image source={{ uri: item }} style={styles.carouselImage} />
      </Animated.View>
    );
  }
);
ParallaxCarouselItem.displayName = "ParallaxCarouselItem";

// --------------------
// INDICATOR DOT
// --------------------
const AnimatedIndicator = memo(
  ({ index, currentIndex }: IndicatorProps) => {
    const progress = useSharedValue(currentIndex);

    useEffect(() => {
      progress.value = withTiming(currentIndex, { duration: 200 });
    }, [currentIndex]);

    const animatedStyle = useAnimatedStyle(() => {
      const isActive = index === Math.round(progress.value);
      return {
        width: withTiming(isActive ? 22 : 8),
        backgroundColor: isActive
          ? COLORS.white
          : "rgba(255,255,255,0.35)",
        height: 4,
        borderRadius: 2,
        marginHorizontal: 3,
      };
    });

    return <Animated.View style={animatedStyle} />;
  }
);
AnimatedIndicator.displayName = "AnimatedIndicator";

// --------------------
// MAIN COMPONENT
// --------------------
const ProfileCarousel: React.FC<ProfileCarouselProps> = ({
  images,
  fullName,
  age,
  onShowSlider,
  locationCity,
  showLocation,
}) => {
  const filteredImages = images.filter(Boolean);
  const [currentIndex, setCurrentIndex] = useState(0);

  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const carouselHeight = screenHeight * 0.88;

  const isStackMode = filteredImages.length > 1;
  const carouselMode = isStackMode ? "horizontal-stack" : "parallax";

  const renderItem = useCallback(
    ({
      item,
      animationValue,
    }: {
      item: string;
      animationValue: any;
    }) => (
      <ParallaxCarouselItem
        item={item}
        animationValue={animationValue}
      />
    ),
    []
  );

  if (filteredImages.length === 0) {
    return (
      <View style={[styles.noImagesContainer, { height: carouselHeight }]}>
        <Ionicons name="camera-outline" size={80} color="#ccc" />
        <Text style={styles.noImagesText}>Nema fotografija za prikaz.</Text>
        <Text style={styles.noImagesSubtext}>
          Dodajte slike u modu za uređivanje.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.mainContainer, { height: carouselHeight }]}>
      {/* Indicator dots */}
      <View
        style={[styles.paginationContainer, { top: insets.top + 10 }]}
      >
        {filteredImages.map((_, index) => (
          <AnimatedIndicator
            key={index}
            index={index}
            currentIndex={currentIndex}
          />
        ))}
      </View>

      {/* CAROUSEL */}
      <Carousel
        loop={isStackMode}
        width={screenWidth}
        height={carouselHeight}
        data={filteredImages}
        onSnapToItem={setCurrentIndex}
        autoPlay={false}
        renderItem={renderItem}
        mode={carouselMode as any}
        modeConfig={
          isStackMode
            ? {
                snapDirection: "left",
                stackInterval: screenWidth * 0.12,
                scaleInterval: 0.08,
                opacityInterval: 0.15,
              }
            : undefined
        }
      />

      {/* GRADIENT OVERLAY */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.8)", "rgba(0,0,0,0.95)"]}
        style={[
          styles.gradientOverlay,
          {
            paddingBottom: 40 + insets.bottom,
            height: carouselHeight * 0.45,
          },
        ]}
      >
        <View style={styles.overlayTextContainer}>
          <Text numberOfLines={1} style={styles.overlayNameText}>
            {fullName || ""}
            {age !== null && age !== undefined && (
              <Text style={styles.overlayAgeText}>{`, ${age}`}</Text>
            )}
          </Text>

          {showLocation && locationCity && (
            <View style={styles.locationContainer}>
              <Ionicons
                name="location-sharp"
                size={16}
                color={COLORS.white}
                style={{ marginRight: 5 }}
              />
              <Text style={styles.locationText}>{locationCity}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.downArrowButton, { bottom: 5 + insets.bottom }]}
          onPress={onShowSlider}
        >
          <Ionicons name="chevron-down" size={30} color={COLORS.white} />
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

ProfileCarousel.displayName = "ProfileCarousel";

export default ProfileCarousel;

// ----------------------------
// STYLES
// ----------------------------
const styles = StyleSheet.create({
  mainContainer: {
    width: "100%",
    position: "relative",
    backgroundColor: COLORS.black,
  },

  carouselItem: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#222",
    marginHorizontal: 10,
    elevation: 10,
  },

  carouselImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  paginationContainer: {
    position: "absolute",
    width: "100%",
    zIndex: 20,
    flexDirection: "row",
    justifyContent: "center",
  },

  gradientOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
  },

  overlayTextContainer: {
    paddingHorizontal: 25,
    marginBottom: 15,
  },

  overlayNameText: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: "700",
  },

  overlayAgeText: {
    fontSize: 24,
    fontWeight: "300",
  },

  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  locationText: {
    color: COLORS.white,
    fontSize: 15,
  },

  downArrowButton: {
    position: "absolute",
    right: 25,
  },

  noImagesContainer: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },

  noImagesText: {
    fontSize: 20,
    marginTop: 15,
    color: "#777",
  },

  noImagesSubtext: {
    fontSize: 16,
    color: "#999",
  },
});

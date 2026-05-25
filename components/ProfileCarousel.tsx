import React, { useState, useCallback, useEffect, memo } from "react";
import {
  View,
  StyleSheet,
  Text,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Carousel from "react-native-reanimated-carousel";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Image } from "expo-image";

const COLORS = {
  white: "#FFFFFF",
  black: "#000000",
  primary: "#FF7F00", // Vibra narandžasta
  darkBg: "#0B0B0F",
  cardBg: "#16161A",
};

type CarouselItemProps = { item: string; height: number };
type IndicatorProps = { index: number; currentIndex: number };

// Premium kartica sa unutrašnjim ivicama
const CarouselItem = memo(({ item, height }: CarouselItemProps) => (
  <View style={[styles.carouselCard, { height: height }]}>
    <Image 
      source={{ uri: item }} 
      style={styles.carouselImage} 
      contentFit="cover"
      contentPosition="center" // Sada radi savršeno jer je kontejner u 3:4 proporciji
      transition={300}
    />
  </View>
));
CarouselItem.displayName = "CarouselItem";

// Premium tačkasti indikatori
const DotIndicator = memo(({ index, currentIndex }: IndicatorProps) => {
  const active = useSharedValue(index === currentIndex ? 1 : 0);

  useEffect(() => {
    active.value = withTiming(index === currentIndex ? 1 : 0, { duration: 250 });
  }, [currentIndex]);

  const animStyle = useAnimatedStyle(() => ({
    width: active.value ? 20 : 6,
    opacity: active.value ? 1 : 0.4,
    backgroundColor: active.value ? COLORS.primary : "#FFFFFF",
  }));

  return <Animated.View style={[styles.dotTrack, animStyle]} />;
});
DotIndicator.displayName = "DotIndicator";

interface ProfileCarouselProps {
  images: string[];
  fullName?: string;
  age?: number | null;
  locationCity?: string;
  showLocation?: boolean;
}

export default function ProfileCarousel({
  images,
  fullName,
  age,
  locationCity,
  showLocation,
}: ProfileCarouselProps) {
  const filteredImages = images.filter(Boolean);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { width: screenWidth } = useWindowDimensions();
  
  // ── MATEMATIKA ZA ZAŠTITU PROPORCIJA ──
  // Kartica zauzima tačno 90% širine ekrana
  const carouselWidth = screenWidth * 0.90; 
  // Visina se računa po formuli za 3:4 portrait odnos (širina * 1.333)
  const carouselHeight = (carouselWidth * 4) / 3;

  const renderItem = useCallback(
    ({ item }: { item: string }) => <CarouselItem item={item} height={carouselHeight} />,
    [carouselHeight]
  );

  if (filteredImages.length === 0) {
    return (
      <View style={[styles.noImagesContainer, { height: carouselHeight }]}>
        <Ionicons name="images-outline" size={36} color="#333" />
        <Text style={styles.noImagesText}>Nema fotografija</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainWrapper}>
      
      {/* Glavni Carousel sa fiksiranom 3:4 visinom */}
      <View style={{ height: carouselHeight, width: screenWidth }}>
        <Carousel
          loop={false}
          style={styles.carouselStyle}
          width={screenWidth}
          height={carouselHeight}
          snapEnabled={true}
          pagingEnabled={true}
          mode="horizontal-stack"
          modeConfig={{
            snapDirection: "left",
            stackInterval: 18, 
            scaleInterval: 0.08, 
          }}
          data={filteredImages}
          onSnapToItem={setCurrentIndex}
          renderItem={renderItem}
        />
      </View>

      {/* Info Panel ispod kartice (Sada ima više mesta i izgleda prozračno) */}
      <View style={styles.metaContainer}>
        
        {/* Indikatori slika */}
        {filteredImages.length > 1 && (
          <View style={styles.dotsRow}>
            {filteredImages.map((_, i) => (
              <DotIndicator key={i} index={i} currentIndex={currentIndex} />
            ))}
          </View>
        )}

        {/* Informacije profila */}
        <View style={styles.infoBlock}>
          <Text numberOfLines={1} style={styles.nameText}>
            {fullName || "Neko Poseban"}
            {age != null && <Text style={styles.ageText}>{`, ${age}`}</Text>}
          </Text>

          {showLocation && locationCity && (
            <View style={styles.locationRow}>
              <View style={styles.livePulse} />
              <Text style={styles.locationText}>{locationCity}</Text>
            </View>
          )}
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    width: "100%",
    backgroundColor: COLORS.darkBg,
    paddingTop: 10,
  },
  carouselStyle: {
    width: "100%",
    height: "100%",
  },
  carouselCard: {
    width: "90%", 
    alignSelf: "center",
    borderRadius: 28, 
    overflow: "hidden",
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)", 
    
    // Premium senka
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  carouselImage: {
    width: "100%",
    height: "100%",
  },
  metaContainer: {
    paddingHorizontal: 24,
    marginTop: 20, // Malo više prostora ispod izdužene kartice
    flexDirection: "column",
    gap: 12,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dotTrack: {
    height: 6,
    borderRadius: 3,
  },
  infoBlock: {
    gap: 4,
  },
  nameText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  ageText: {
    fontWeight: "300",
    color: "rgba(255, 255, 255, 0.85)",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981", 
  },
  locationText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  noImagesContainer: {
    width: "90%",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    borderRadius: 28,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  noImagesText: {
    fontSize: 15,
    color: "#444",
    fontWeight: "600",
  },
});
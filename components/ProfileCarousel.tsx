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
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
  white: "#FFFFFF",
  black: "#000000",
  primary: "#FF7F00", // Vibra narandžasta
  darkBg: "#0B0B0F",
  cardBg: "#16161A",
};

type CarouselItemProps = { item: string; width: number; height: number };
type IndicatorProps = { index: number; currentIndex: number };

// Premium kartica sa unutrašnjim ivicama
const CarouselItem = memo(({ item, width, height }: CarouselItemProps) => (
  <View style={[styles.carouselCard, { width: width, height: height }]}>
    <Image 
      source={{ uri: item }} 
      style={styles.carouselImage} 
      contentFit="cover"
      contentPosition="center"
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
  
  // Dinamičko preuzimanje bezbednih margina uređaja
  const insets = useSafeAreaInsets();
  
  // ── MATEMATIKA ZA ZAŠTITU PROPORCIJA ──
  const cardWidth = screenWidth * 0.90; 
  const cardHeight = (cardWidth * 4) / 3;

  const renderItem = useCallback(
    ({ item }: { item: string }) => (
      <CarouselItem item={item} width={cardWidth} height={cardHeight} />
    ),
    [cardWidth, cardHeight]
  );

  // Kombinovani stil koji dinamički dodaje bezbedan gornji prostor
  const dynamicWrapperStyle = [
    styles.mainWrapper,
    { 
      paddingTop: Math.max(insets.top, 20),
      paddingBottom: Math.max(insets.bottom, 20) 
    }
  ];

  // Slučaj 1: Nema slika uopšte
  if (filteredImages.length === 0) {
    return (
      <View style={dynamicWrapperStyle}>
        <View style={[styles.noImagesContainer, { width: cardWidth, height: cardHeight }]}>
          <Ionicons name="images-outline" size={36} color="#444" />
          <Text style={styles.noImagesText}>Nema fotografija</Text>
        </View>
        <RenderProfileInfo 
          fullName={fullName} 
          age={age} 
          showLocation={showLocation} 
          locationCity={locationCity} 
          filteredImages={filteredImages} 
          currentIndex={currentIndex} 
        />
      </View>
    );
  }

  return (
    <View style={dynamicWrapperStyle}>
      
      {/* Glavni vizuelni kontejner */}
      <View style={[styles.centerAligner, { height: cardHeight }]}>
        {filteredImages.length === 1 ? (
          // Slučaj 2: Tačno jedna slika (Izbegavamo bagoviti Stack Carousel)
          <CarouselItem item={filteredImages[0]} width={cardWidth} height={cardHeight} />
        ) : (
          // Slučaj 3: Više slika (Carousel radi bezbedno i fluidno)
          <Carousel
            loop={false}
            style={{ width: cardWidth, height: cardHeight }}
            width={cardWidth}
            height={cardHeight}
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
        )}
      </View>

      {/* Info Panel ispod kartice */}
      <RenderProfileInfo 
        fullName={fullName} 
        age={age} 
        showLocation={showLocation} 
        locationCity={locationCity} 
        filteredImages={filteredImages} 
        currentIndex={currentIndex} 
      />
    </View>
  );
}

interface InfoProps extends Omit<ProfileCarouselProps, 'images'> {
  filteredImages: string[];
  currentIndex: number;
}

const RenderProfileInfo = ({ fullName, age, showLocation, locationCity, filteredImages, currentIndex }: InfoProps) => (
  <View style={styles.metaContainer}>
    
    {/* Indikatori slika (Prikazuju se samo ako ima više od 1 slike) */}
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
);

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    width: "100%",
    backgroundColor: COLORS.darkBg,
    justifyContent: "center", // Savršeno vertikalno centriranje na svim rezolucijama
  },
  centerAligner: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 60,
  },
  carouselCard: {
    borderRadius: 28, 
    overflow: "hidden",
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)", 
    
    // Premium senka (sada radi stabilno na Androidu i iOS-u)
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
    marginTop: 20,
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
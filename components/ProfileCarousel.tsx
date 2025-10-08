import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, Text, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Carousel from 'react-native-reanimated-carousel';
import Animated, { useAnimatedStyle, interpolate, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const COLORS = {
  white: '#FFFFFF',
  black: '#000000',
  primary: '#E91E63',
};

interface ProfileCarouselProps {
  images: string[];
  fullName: string | null;
  age: number | null;
  onShowSlider: () => void;
  locationCity: string | null;
  showLocation: boolean;
}

// Komponenta za jedan slajd
const ParallaxCarouselItem: React.FC<any> = ({ item, animationValue }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(animationValue.value, [-1, 0, 1], [0.95, 1, 1.02]);
    const translateY = interpolate(animationValue.value, [-1, 0, 1], [-5, 0, 5]);
    return { transform: [{ scale }, { translateY }] };
  });

  return (
    <Animated.View style={[styles.carouselItem, animatedStyle]}>
      <Image source={{ uri: item }} style={styles.carouselImage} />
    </Animated.View>
  );
};

// Animirani indikator
interface AnimatedIndicatorProps {
  index: number;
  currentIndex: number;
}

const AnimatedIndicator: React.FC<AnimatedIndicatorProps> = ({ index, currentIndex }) => {
  const progress = useSharedValue(currentIndex);

  useEffect(() => {
    progress.value = withTiming(currentIndex, { duration: 250 });
  }, [currentIndex]);

  const animatedStyle = useAnimatedStyle(() => {
    const isActive = index === Math.round(progress.value);
    return {
      width: withTiming(isActive ? 20 : 8),
      backgroundColor: isActive ? COLORS.white : 'rgba(255,255,255,0.4)',
      borderRadius: 2,
      marginHorizontal: 3,
      height: 3,
    };
  });

  return <Animated.View style={animatedStyle} />;
};

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

  if (filteredImages.length === 0) {
    return (
      <View style={[styles.noImagesContainer, { height: windowHeight * 0.7 }]}>
        <Ionicons name="camera-outline" size={80} color="#ccc" />
        <Text style={styles.noImagesText}>Nema fotografija za prikaz.</Text>
        <Text style={styles.noImagesSubtext}>Dodajte slike u modu za uređivanje.</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      {/* Indikatori slika */}
      <View style={[styles.paginationContainer, { top: insets.top + 10 }]}>
        {filteredImages.map((_, index) => (
          <AnimatedIndicator key={`indicator-${index}`} index={index} currentIndex={currentIndex} />
        ))}
      </View>

      <Carousel
        loop={false}
        width={windowWidth}
        height={windowHeight * 0.92}
        autoPlay={false}
        data={filteredImages}
        onSnapToItem={(index) => setCurrentIndex(index)}
        renderItem={(info) => <ParallaxCarouselItem {...info} />}
        mode="horizontal-stack"
        modeConfig={{
          snapDirection: 'left',
          stackInterval: 18,
          scaleInterval: 0.02,
          opacityInterval: 0.2,
        }}
      />

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
        style={[styles.gradientOverlay, { paddingBottom: 60 + insets.bottom }]}
      >
        <View style={styles.overlayTextContainer}>
          <Text style={styles.overlayNameText} numberOfLines={1} ellipsizeMode="tail">
            {fullName || ''}
            {age !== null && <Text style={styles.overlayAgeText}>{`, ${age}`}</Text>}
          </Text>

          {showLocation && locationCity && (
            <View style={styles.locationContainer}>
              <Ionicons name="location-sharp" size={16} color={COLORS.white} style={{ marginRight: 5 }} />
              <Text style={styles.locationText}>{locationCity}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={[styles.downArrowButton, { bottom: 10 + insets.bottom }]} onPress={onShowSlider}>
          <Ionicons name="chevron-down" size={28} color={COLORS.white} />
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    width: windowWidth,
    height: windowHeight * 0.92,
    position: 'relative',
    backgroundColor: COLORS.black,
  },
  carouselItem: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
    marginHorizontal: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  paginationContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
    justifyContent: 'flex-end',
  },
  overlayTextContainer: {
    paddingHorizontal: 25,
    marginBottom: 20,
  },
  overlayNameText: {
    color: COLORS.white,
    fontSize: 25,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 5,
  },
  overlayAgeText: {
    fontWeight: '300',
    fontSize: 24,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    opacity: 0.9,
  },
  locationText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
  downArrowButton: {
    position: 'absolute',
    right: 25,
    zIndex: 10,
  },
  noImagesContainer: {
    width: windowWidth,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  noImagesText: {
    fontSize: 20,
    color: '#888',
    textAlign: 'center',
    marginTop: 15,
    fontWeight: '600',
  },
  noImagesSubtext: {
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
    marginTop: 5,
  },
});

export default ProfileCarousel;

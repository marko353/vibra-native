import React, { useState } from 'react';
import { View, StyleSheet, Image, Text, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Carousel from 'react-native-reanimated-carousel';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const COLORS = {
  white: '#FFFFFF',
  black: '#000000',
  textPrimary: '#2c3e50',
};

interface ProfileCarouselProps {
  images: (string | null)[];
  fullName: string | undefined | null;
  age: number | null;
  onShowSlider: () => void;
  locationCity: string | null;
  showLocation: boolean;
}

const ProfileCarousel: React.FC<ProfileCarouselProps> = ({ 
  images, 
  fullName, 
  age, 
  onShowSlider,
  locationCity,
  showLocation,
}) => {
  const filteredImages = images.filter((img): img is string => img !== null);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (filteredImages.length === 0) {
    return (
      <View style={styles.noImagesContainer}>
        <Text style={styles.noImagesText}>Nema fotografija za prikaz.</Text>
      </View>
    );
  }

  return (
    <View style={styles.carouselContainer}>
      {/* Indikatori slika na vrhu */}
      <View style={styles.paginationContainer}>
        <FlatList
          data={filteredImages}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, index: number) => `indicator-${index}`}
          renderItem={({ index }: { item: string, index: number }) => (
            <View
              style={[
                styles.indicator,
                { width: (windowWidth - 40) / filteredImages.length - 6 },
                index === currentIndex ? styles.activeIndicator : null,
              ]}
            />
          )}
        />
      </View>

      <Carousel
        loop
        width={windowWidth}
        // IZMENJENA LINIJA: Visina je sada 70% ekrana
        height={windowHeight * 0.95}
        autoPlay={false}
        data={filteredImages}
        onProgressChange={(_, absoluteProgress) => {
          setCurrentIndex(Math.round(absoluteProgress));
        }}
        renderItem={({ item }) => (
          <View style={styles.carouselItem}>
            <Image
              source={{ uri: item }}
              style={styles.carouselImage}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              locations={[0.5, 1]}
              style={styles.gradientOverlay}
            />
            <View style={styles.overlayTextContainer}>
              <Text style={styles.overlayNameText}>
                {fullName}
                {age !== null && <Text style={styles.overlayAgeText}>, {age}</Text>}
              </Text>

              {showLocation && locationCity && (
                <View style={styles.locationContainer}>
                  <Ionicons name="location-sharp" size={18} color={COLORS.white} style={{ marginRight: 5 }} />
                  <Text style={styles.locationText}>{locationCity}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      />

      {/* Dugme sa strelicom */}
      <TouchableOpacity style={styles.downArrowButton} onPress={onShowSlider}>
        <Ionicons name="chevron-down-outline" size={30} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  carouselContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start', 
    position: 'relative',
  },
  paginationContainer: {
    position: 'absolute',
    top: 5,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  indicator: {
    height: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 3,
    borderRadius: 5,
  },
  activeIndicator: {
    backgroundColor: COLORS.white,
  },
  carouselItem: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    resizeMode: 'cover',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  overlayTextContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    zIndex: 1,
  },
  overlayNameText: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: 'bold',
  },
  overlayAgeText: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '600',
    marginLeft: 5,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  locationText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  noImagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noImagesText: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
  },
  downArrowButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});

export default ProfileCarousel;
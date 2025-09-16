import React, { useState } from 'react';
import { View, StyleSheet, Image, Text, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Carousel from 'react-native-reanimated-carousel';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const COLORS = {
  white: '#FFFFFF',
  black: '#000000',
  textPrimary: '#2c3e50',
  primary: '#E91E63',
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
        <Ionicons name="camera-outline" size={80} color="#ccc" />
        <Text style={styles.noImagesText}>Nema fotografija za prikaz.</Text>
        <Text style={styles.noImagesSubtext}>Dodajte slike u modu za uređivanje.</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      {/* Indikatori slika na vrhu */}
      <View style={styles.paginationContainer}>
        {filteredImages.map((_, index: number) => (
          <View
            key={`indicator-${index}`}
            style={[
              styles.indicator,
              { width: (windowWidth - 40) / filteredImages.length - 6 },
              index === currentIndex ? styles.activeIndicator : null,
            ]}
          />
        ))}
      </View>

      <Carousel
        loop
        width={windowWidth}
        height={windowHeight * 0.98} 
        autoPlay={false}
        data={filteredImages}
        onSnapToItem={(index) => setCurrentIndex(index)}
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
                {fullName || ''}
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
  mainContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
    marginTop: 15,
  },
  paginationContainer: {
    position: 'absolute',
    top: 30,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  indicator: {
    height: 4, 
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 3,
    borderRadius: 2,
    marginTop: -10,
  },
  activeIndicator: {
    backgroundColor: COLORS.white,
  },
  carouselItem: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center', // Centriranje sadržaja unutar karusela
    alignItems: 'center', // Centriranje sadržaja unutar karusela
  },
  carouselImage: {
    width: '97%', // Smanjena širina na 90%
    height: '97%', // Smanjena visina na 90%
    resizeMode: 'cover',
    borderRadius: 20, 
    transform: [{ translateY: 10 }],
   // Povećana vrednost za više pomeranje
    
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
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
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
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
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  noImagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    marginHorizontal: 20,
    marginVertical: 40,
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
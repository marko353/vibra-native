import React from 'react';
import { View, StyleSheet, Image, Text, Dimensions, FlatList } from 'react-native'; // Dodao FlatList
import Carousel from 'react-native-reanimated-carousel';
import { LinearGradient } from 'expo-linear-gradient';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height; // Dodao windowHeight da bi se Carousel pravilno skalirao

interface ProfileCarouselProps {
  images: (string | null)[];
  fullName: string | undefined | null;
  age: number | null;
}

export default function ProfileCarousel({ images, fullName, age }: ProfileCarouselProps) {
  const filteredImages = images.filter((img): img is string => img !== null);
  const [currentIndex, setCurrentIndex] = React.useState(0); // Stanje za praćenje trenutnog indeksa

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
          keyExtractor={(_, index) => `indicator-${index}`}
          renderItem={({ index }) => (
            <View
              style={[
                styles.indicator,
                // Dinamička širina indikatora, prilagođava se broju slika
                { width: (windowWidth - 40) / filteredImages.length - 6 }, // -40 za paddingContainer, -6 za marginHorizontal * 2
                index === currentIndex ? styles.activeIndicator : null,
              ]}
            />
          )}
        />
      </View>

      <Carousel
        loop
        width={400} // Originalna širina karusela
        height={595} // Originalna visina karusela
        autoPlay={false}
        data={filteredImages}
        onProgressChange={(_, absoluteProgress) => {
          // Ažurirajte trenutni indeks na osnovu progresije karusela
          setCurrentIndex(Math.round(absoluteProgress));
        }}
        renderItem={({ item }) => (
          <View style={styles.carouselItem}>
            <Image
              source={{ uri: item }}
              style={styles.carouselImage}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,1)', 'rgba(0,0,0,0.9)']} // Vaše originalne boje gradijenta
              locations={[0.7, 0.9, 1.0]}
              style={styles.gradientOverlay}
            />
            <View style={styles.overlayTextContainer}>
              <Text style={styles.overlayNameText}>
                {fullName}
              </Text>
              {age !== null && (
                <Text style={styles.overlayAgeText}>
                  , {age}
                </Text>
              )}
            </View>
          </View>
        )}
        customConfig={() => ({ type: 'positive', setting: 'width' })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  carouselContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Novi stilovi za indikatore
paginationContainer: {
  position: 'absolute',
  top: windowHeight / 2 - 320,
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
  backgroundColor: 'rgba(20, 19, 19, 0.5)', // Transparentna crna za neaktivne
  marginHorizontal: 3,
  borderRadius: 5,
  // Dodajemo suptilnu ivicu za sve indikatore
  borderWidth: 1, // Debljina ivice
  borderColor: 'rgba(14, 13, 13, 0.3)', // Blago prozirna bela ivica
},
activeIndicator: {
  backgroundColor: '#fff', // Bela boja za aktivni indikator
  borderRadius: 5,
  // Zatamnjena ivica za aktivni indikator da se istakne
  borderWidth: 1, // Debljina ivice
  borderColor: 'rgba(0, 0, 0, 1)', // Diskretna crna ivica
},
  // Originalni stilovi karusela
  carouselItem: {
    width: '100%',
    height: '100%',
    borderRadius: 20, // Vraćeno na 20
    overflow: 'hidden',
    position: 'relative',
  },
  carouselImage: {
    width: '100%', // Vraćeno na 100%
    height: '100%', // Vraćeno na 100%
    borderRadius: 20, // Vraćeno na 20
    resizeMode: 'cover',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%', // Vraćeno na 100%
    borderBottomLeftRadius: 20, // Vraćeno na 20
    borderBottomRightRadius: 20, // Vraćeno na 20
  },
  overlayTextContainer: {
    position: 'absolute',
    bottom: 20, // Vraćeno na 20
    left: 20,
    flexDirection: 'row',
    alignItems: 'baseline',
    zIndex: 1,
  },
  overlayNameText: {
    color: '#fff',
    fontSize: 28, // Vraćeno na 28
    fontWeight: 'bold',
    top: -40, // Vraćeno na -40
  },
  overlayAgeText: {
    color: '#fff',
    fontSize: 22, // Vraćeno na 22
    fontWeight: '600',
    marginLeft: 5,
    top: -40, // Vraćeno na -40
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
});
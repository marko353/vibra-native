import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Text, FlatList, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#E91E63',
  textPrimary: '#2c3e50',
  white: '#FFFFFF',
  placeholderBackground: '#f0f2f5',
  placeholderBorder: '#e0e0e0',
};

const windowWidth = Dimensions.get('window').width;
const HORIZONTAL_PADDING = 20;
const CARD_MARGIN = 10;

interface ProfilePhotoGridProps {
  images: (string | null)[];
  uploadingIndex: number | null;
  onAddImagePress: (index: number) => void;
  onRemoveImage: (index: number, url: string) => void;
  mode: 'edit' | 'view';
}

const ProfilePhotoGrid: React.FC<ProfilePhotoGridProps> = ({
  images,
  uploadingIndex,
  onAddImagePress,
  onRemoveImage,
  mode,
}) => {
  const renderPhotoItem = ({ item, index }: { item: string | null; index: number }) => {
    // Calculate card width dynamically
    const cardWidth = (windowWidth - HORIZONTAL_PADDING * 2 - CARD_MARGIN * 2) / 3;

    return (
      <View style={[styles.card, { width: cardWidth }]}>
        {item ? (
          <>
            <Image source={{ uri: item }} style={styles.image} />
            {mode === 'edit' && (
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => onRemoveImage(index, item)}
              >
                <Ionicons name="close-circle" size={24} color={COLORS.white} />
              </TouchableOpacity>
            )}
          </>
        ) : (
          <TouchableOpacity
            style={styles.placeholderCard}
            onPress={() => onAddImagePress(index)}
            disabled={uploadingIndex === index || mode === 'view'}
          >
            {uploadingIndex === index ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={40} color={COLORS.primary} />
                <Text style={styles.addText}>Dodaj sliku</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.photosTitle}>Galerija slika</Text> 
      <FlatList
        data={images}
        keyExtractor={(_, index) => `image-${index}`}
        renderItem={renderPhotoItem}
        numColumns={3}
        scrollEnabled={false}
        columnWrapperStyle={styles.columnWrapper}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 100,
  },
  photosTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 15,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: CARD_MARGIN,
  },
  card: {
    aspectRatio: 3 / 4,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderCard: {
    flex: 1,
    backgroundColor: COLORS.placeholderBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
  },
  addText: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  removeBtn: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    padding: 2,
  },
});

export default ProfilePhotoGrid;
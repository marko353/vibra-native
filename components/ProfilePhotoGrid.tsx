import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Text, FlatList, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#E91E63',
  textPrimary: '#2c3e50',
  textSecondary: '#7f8c8d',
  cardBackground: '#ffffff',
  border: '#dddddd',
  white: '#FFFFFF',
};

const windowWidth = Dimensions.get('window').width;

interface ProfilePhotoGridProps {
  images: (string | null)[];
  uploadingIndex: number | null;
  onAddImage: (index: number) => void;
  onRemoveImage: (index: number) => void;
}

const ProfilePhotoGrid: React.FC<ProfilePhotoGridProps> = ({
  images,
  uploadingIndex,
  onAddImage,
  onRemoveImage,
}) => {
  const renderPhotoItem = ({ item, index }: { item: string | null; index: number }) => (
    <View style={styles.card}>
      {item ? (
        <>
          <Image source={{ uri: item }} style={styles.image} />
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => onRemoveImage(index)}
          >
            <Ionicons name="close" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.placeholderContainer}>
          <View style={styles.placeholder}>
            <Text style={styles.plus}>+</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => onAddImage(index)}
            disabled={uploadingIndex === index}
          >
            {uploadingIndex === index ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Ionicons name="add-circle" size={35} color={COLORS.primary} />
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View>
      <Text style={styles.photosTitle}>Dodajte svoje fotografije</Text>
      <FlatList
        data={images}
        keyExtractor={(_, index) => `image-${index}`}
        renderItem={renderPhotoItem}
        numColumns={3}
        scrollEnabled={false}
        contentContainerStyle={{ paddingHorizontal: 10 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  photosTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
    marginTop: 20,
    marginHorizontal: 15,
  },
  card: {
    width: (windowWidth - 80) / 3, // Prilagođena širina za 3 kolone sa razmakom
    aspectRatio: 3 / 4,
    borderRadius: 15,
    overflow: 'hidden',
    margin: 10,
    backgroundColor: COLORS.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plus: {
    fontSize: 40,
    color: '#aaa',
  },
  addBtn: {
    position: 'absolute',
    bottom: -3,
    right: -2,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    padding: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  removeBtn: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 15,
    padding: 2,
  },
});

export default ProfilePhotoGrid;
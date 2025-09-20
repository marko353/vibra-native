import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

const COLORS = {
  primary: '#E91E63',
  textPrimary: '#2c3e50',
  white: '#FFFFFF',
  placeholderBackground: '#f0f2f5',
};

const windowWidth = Dimensions.get('window').width;
const HORIZONTAL_PADDING = 20;
const CARD_MARGIN = 10;

interface ProfilePhotoGridProps {
  images: string[];
  uploadingIndex: number | null;
  onAddImagePress: (index: number) => void;
  onRemoveImage: (index: number, url: string) => void;
  onReorderImages: (newOrder: string[]) => void;
  mode: 'edit' | 'view';
}

interface DraggableCardProps {
  uri?: string | null;
  index: number;
  cardWidth: number;
  onReorder: (from: number, to: number) => void;
  onRemoveImage?: (index: number, uri: string) => void;
  onAddImagePress?: (index: number) => void;
  uploadingIndex?: number | null;
  mode?: 'edit' | 'view';
  draggable?: boolean;
}

const DraggableCard: React.FC<DraggableCardProps> = ({
  uri,
  index,
  cardWidth,
  onReorder,
  onRemoveImage,
  onAddImagePress,
  uploadingIndex,
  mode,
  draggable = true,
}) => {
  const translateX = useSharedValue((index % 3) * (cardWidth + CARD_MARGIN));
  const translateY = useSharedValue(Math.floor(index / 3) * (cardWidth * 4/3 + CARD_MARGIN));

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (!draggable) return;
      translateX.value = event.translationX + (index % 3) * (cardWidth + CARD_MARGIN);
      translateY.value = event.translationY + Math.floor(index / 3) * (cardWidth * 4/3 + CARD_MARGIN);
    })
    .onEnd(() => {
      if (!draggable) return;
      const col = Math.round(translateX.value / (cardWidth + CARD_MARGIN));
      const row = Math.round(translateY.value / (cardWidth * 4/3 + CARD_MARGIN));
      const newIndex = row * 3 + col;
      translateX.value = withSpring((col < 0 ? 0 : col) * (cardWidth + CARD_MARGIN));
      translateY.value = withSpring((row < 0 ? 0 : row) * (cardWidth * 4/3 + CARD_MARGIN));
      runOnJS(onReorder)(index, newIndex);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    width: cardWidth,
    aspectRatio: 3/4,
    borderRadius: 15,
    overflow: 'hidden',
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[animatedStyle, styles.card]}>
        {uri ? (
          <>
            <Image source={{ uri }} style={styles.image} />
            {mode === 'edit' && onRemoveImage && (
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => onRemoveImage(index, uri)}
              >
                <Ionicons name="close-circle" size={24} color={COLORS.white} />
              </TouchableOpacity>
            )}
          </>
        ) : (
          <TouchableOpacity
            style={styles.placeholderCard}
            onPress={() => onAddImagePress && onAddImagePress(index)}
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
      </Animated.View>
    </GestureDetector>
  );
};

const ProfilePhotoGrid: React.FC<ProfilePhotoGridProps> = ({
  images,
  uploadingIndex,
  onAddImagePress,
  onRemoveImage,
  onReorderImages,
  mode,
}) => {
  const cardWidth = (windowWidth - HORIZONTAL_PADDING * 2 - CARD_MARGIN * 2) / 3;

  const reorder = (from: number, to: number) => {
    if (from === to || to < 0 || to >= images.length) return;
    const updated = [...images];
    const moved = updated.splice(from, 1)[0];
    updated.splice(to, 0, moved);
    onReorderImages(updated);
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <Text style={styles.photosTitle}>Galerija slika</Text>
      <View style={[styles.gridContainer, { minHeight: Math.ceil(images.length / 3) * (cardWidth * 4/3 + CARD_MARGIN) + 50 }]}>
        {images.map((uri, index) => (
          <DraggableCard
            key={`${uri || 'placeholder'}-${index}`}
            uri={uri}
            index={index}
            cardWidth={cardWidth}
            onReorder={reorder}
            onRemoveImage={onRemoveImage}
            onAddImagePress={onAddImagePress}
            uploadingIndex={uploadingIndex}
            mode={mode}
            draggable={!!uri} // Samo stvarne slike mogu da se drag-uju
          />
        ))}
      </View>
    </GestureHandlerRootView>
  );
};

// Svi stilovi dole
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  photosTitle: {
  fontSize: 22,
  fontWeight: '700',
  color: COLORS.textPrimary,
  marginBottom: 8,      // malo iznad kartica
  paddingHorizontal: HORIZONTAL_PADDING,
},

gridContainer: {
  paddingHorizontal: HORIZONTAL_PADDING,
  marginTop: 10,        // mali razmak od naslova
  width: windowWidth - HORIZONTAL_PADDING * 2,
  alignSelf: 'center',
},

  card: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderRadius: 15,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeBtn: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    padding: 2,
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
});

export default ProfilePhotoGrid;

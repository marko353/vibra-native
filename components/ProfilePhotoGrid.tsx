import React, { useEffect } from 'react';
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

/* ================= CONSTANTS ================= */

const COLORS = {
  primary: '#ff7f00',
  textPrimary: '#1a1a1a',
  textSecondary: '#999',
  white: '#FFFFFF',
  background: '#fff',
  border: '#ECECEC',
  placeholder: '#FAFAFA',
  shadow: '#ff7f00',
};

const windowWidth = Dimensions.get('window').width;
const HORIZONTAL_PADDING = 20;
const CARD_MARGIN = 10;

/* ================= TYPES ================= */

interface ProfilePhotoGridProps {
  images: (string | null)[];
  uploadingIndex: number | null;
  onAddImagePress: (index: number) => void;
  onRemoveImage: (index: number, url: string) => void;
  onReorderImages: (newOrder: (string | null)[]) => void;
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
  maxIndex: number;
}

/* ================= DRAGGABLE CARD ================= */

const DraggableCard: React.FC<DraggableCardProps> = ({
  uri,
  index,
  cardWidth,
  onReorder,
  onRemoveImage,
  onAddImagePress,
  uploadingIndex,
  mode,
  maxIndex,
}) => {
  const colSize = cardWidth + CARD_MARGIN;
  const rowSize = (cardWidth * 4) / 3 + CARD_MARGIN;

  const targetX = (index % 3) * colSize;
  const targetY = Math.floor(index / 3) * rowSize;

  const translateX = useSharedValue(targetX);
  const translateY = useSharedValue(targetY);
  const isPressed = useSharedValue(false);

  useEffect(() => {
    if (!isPressed.value) {
      translateX.value = withSpring(targetX, { damping: 20, stiffness: 90 });
      translateY.value = withSpring(targetY, { damping: 20, stiffness: 90 });
    }
  }, [index, targetX, targetY]);

  const panGesture = Gesture.Pan()
    .minDistance(10)
    .enableTrackpadTwoFingerGesture(false)
    .onBegin(() => {
      if (!uri || mode !== 'edit') return;
      isPressed.value = true;
    })
    .onUpdate((event) => {
      if (mode !== 'edit' || !uri) return;
      translateX.value = event.translationX + targetX;
      translateY.value = event.translationY + targetY;
    })
    .onEnd((event) => {
      isPressed.value = false;
      if (mode !== 'edit' || !uri) return;

      const rawCol = Math.round(translateX.value / colSize);
      const rawRow = Math.round(translateY.value / rowSize);

      const safeCol = Math.max(0, Math.min(2, rawCol));
      const safeRow = Math.max(0, Math.min(2, rawRow));

      const newIndex = safeRow * 3 + safeCol;

      if (!isNaN(newIndex) && newIndex <= maxIndex && newIndex >= 0 && newIndex !== index) {
        runOnJS(onReorder)(index, newIndex);
      } else {
        translateX.value = withSpring(targetX);
        translateY.value = withSpring(targetY);
      }
    })
    .onFinalize(() => {
      isPressed.value = false;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    width: cardWidth,
    aspectRatio: 3 / 4,
    zIndex: isPressed.value ? 1000 : (uri ? 10 : 1),
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: withSpring(isPressed.value ? 1.05 : 1) },
    ],
  }));

  return (
    <GestureDetector gesture={uri ? panGesture : Gesture.Pan().enabled(false)}>
      <Animated.View style={[animatedStyle]}>
        {uri ? (
          <View style={styles.imageCard}>
            <Image source={{ uri }} style={styles.image} />
            {mode === 'edit' && onRemoveImage && (
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => onRemoveImage(index, uri)}
              >
                <Ionicons name="close-circle" size={24} color="#fff" />
              </TouchableOpacity>
            )}
            {/* Badge za prvu sliku */}
            {index === 0 && (
              <View style={styles.mainBadge}>
                <Text style={styles.mainBadgeText}>Main</Text>
              </View>
            )}
          </View>
        ) : (
          <TouchableOpacity
            style={styles.placeholderCard}
            onPress={() => onAddImagePress && onAddImagePress(index)}
            disabled={uploadingIndex === index || mode === 'view'}
            activeOpacity={0.7}
          >
            {uploadingIndex === index ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <View style={styles.placeholderInner}>
                <View style={styles.addIconCircle}>
                  <Ionicons name="add" size={22} color={COLORS.primary} />
                </View>
                <Text style={styles.addText}>Add photo</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </Animated.View>
    </GestureDetector>
  );
};

/* ================= MAIN GRID ================= */

const ProfilePhotoGrid: React.FC<ProfilePhotoGridProps> = ({
  images,
  uploadingIndex,
  onAddImagePress,
  onRemoveImage,
  onReorderImages,
  mode,
}) => {
  const cardWidth = (windowWidth - HORIZONTAL_PADDING * 2 - CARD_MARGIN * 2) / 3;
  const rowHeight = (cardWidth * 4) / 3 + CARD_MARGIN;

  const realImages = images.filter((img): img is string => typeof img === 'string');

  const handleReorder = (from: number, to: number) => {
    if (from === to) return;
    const updated = [...realImages];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    const filled = [...updated, ...Array(9 - updated.length).fill(null)];
    onReorderImages(filled);
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.photosTitle}>Photos</Text>
        <Text style={styles.photosSubtitle}>{realImages.length} / 9</Text>
      </View>

      {/* Hint */}
      {mode === 'edit' && (
        <View style={styles.hintRow}>
          <Ionicons name="information-circle-outline" size={13} color={COLORS.primary} />
          <Text style={styles.hintText}>Hold & drag to reorder</Text>
        </View>
      )}

      <View style={[styles.gridContainer, { height: rowHeight * 3 }]}>
        {images.map((uri, index) => (
          <DraggableCard
            key={uri ? `img-${uri}` : `empty-slot-${index}`}
            uri={uri}
            index={index}
            cardWidth={cardWidth}
            onReorder={handleReorder}
            onRemoveImage={onRemoveImage}
            onAddImagePress={onAddImagePress}
            uploadingIndex={uploadingIndex}
            mode={mode}
            maxIndex={Math.max(0, realImages.length - 1)}
          />
        ))}
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: HORIZONTAL_PADDING,
    marginBottom: 4,
    marginTop: 8,
  },
  photosTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  photosSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginHorizontal: HORIZONTAL_PADDING,
    marginBottom: 12,
  },
  hintText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '500',
  },
  gridContainer: {
    marginHorizontal: HORIZONTAL_PADDING,
    position: 'relative',
  },
  imageCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 14,
    zIndex: 20,
    padding: 1,
  },
  mainBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  mainBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  placeholderCard: {
    flex: 1,
    backgroundColor: COLORS.placeholder,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderInner: {
    alignItems: 'center',
    gap: 6,
  },
  addIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff5ec',
    borderWidth: 1.5,
    borderColor: '#ffd0a8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});

export default ProfilePhotoGrid;
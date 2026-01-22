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
  primary: '#E91E63',
  textPrimary: '#2c3e50',
  white: '#FFFFFF',
  placeholderBackground: '#f0f2f5',
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

  // Izračunavamo target koordinate direktno u renderu na osnovu PROPS-a
  const targetX = (index % 3) * colSize;
  const targetY = Math.floor(index / 3) * rowSize;

  const translateX = useSharedValue(targetX);
  const translateY = useSharedValue(targetY);
  const isPressed = useSharedValue(false);

  // ✅ Sinhornizacija: Kada roditelj promeni redosled, useEffect pomera karticu
  useEffect(() => {
    if (!isPressed.value) {
      translateX.value = withSpring(targetX, { damping: 20, stiffness: 90 });
      translateY.value = withSpring(targetY, { damping: 20, stiffness: 90 });
    }
  }, [index, targetX, targetY]);

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      if (!uri || mode !== 'edit') return;
      isPressed.value = true;
      console.log(`[DRAG START] Slot: ${index}, Uri: ${uri?.substring(0, 30)}...`);
    })
    .onUpdate((event) => {
      if (mode !== 'edit' || !uri) return;
      
      // Koristimo targetX/Y kao bazu za prevlačenje
      translateX.value = event.translationX + targetX;
      translateY.value = event.translationY + targetY;
    })
    .onEnd((event) => {
      isPressed.value = false;
      if (mode !== 'edit' || !uri) return;

      const rawCol = Math.round(translateX.value / colSize);
      const rawRow = Math.round(translateY.value / rowSize);

      const safeCol = Math.max(0, Math.min(2, rawCol));
      const safeRow = Math.max(0, Math.min(2, rawRow)); // Grid je 3x3 (max 9 polja)

      const newIndex = safeRow * 3 + safeCol;

      console.log(`[DRAG END] Prebacivanje sa ${index} na ${newIndex} (SafeCol: ${safeCol}, SafeRow: ${safeRow})`);

      if (!isNaN(newIndex) && newIndex <= maxIndex && newIndex >= 0 && newIndex !== index) {
        console.log(`✅ USPEŠAN REORDER: ${index} -> ${newIndex}`);
        runOnJS(onReorder)(index, newIndex);
      } else {
        console.log("❌ REORDER PONIŠTEN: Vraćanje na originalnu poziciju.");
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
    // Slike su uvek iznad placeholdera, a aktivna slika je iznad svih
    zIndex: isPressed.value ? 1000 : (uri ? 10 : 1),
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: withSpring(isPressed.value ? 1.1 : 1) },
    ],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, animatedStyle]}>
        {uri ? (
          <View style={{ flex: 1 }}>
            <Image source={{ uri }} style={styles.image} />
            {mode === 'edit' && onRemoveImage && (
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => onRemoveImage(index, uri)}
              >
                <Ionicons name="close-circle" size={26} color={COLORS.white} />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <TouchableOpacity
            style={styles.placeholderCard}
            onPress={() => onAddImagePress && onAddImagePress(index)}
            disabled={uploadingIndex === index || mode === 'view'}
          >
            {uploadingIndex === index ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Ionicons name="add-circle" size={36} color={COLORS.primary} />
                <Text style={styles.addText}>Dodaj</Text>
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

  // Filtriramo samo URL-ove da bismo znali limit pomeranja
  const realImages = images.filter((img): img is string => typeof img === 'string');

  const handleReorder = (from: number, to: number) => {
    console.log(`[HANDLE REORDER] Logika: Splice sa ${from} na ${to}`);
    
    if (from === to) return;

    // Radimo samo sa "realnim" slikama da ne bismo pomerali "Dodaj sliku" dugmiće
    const updated = [...realImages];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);

    // Popunjavamo nazad do 9 mesta sa null (placeholderi)
    const filled = [...updated, ...Array(9 - updated.length).fill(null)];
    
    console.log("[FINAL SEND] Niz spreman za roditelja.");
    onReorderImages(filled);
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <Text style={styles.photosTitle}>Galerija slika</Text>
      <View style={[styles.gridContainer, { height: rowHeight * 3 }]}>
        {images.map((uri, index) => (
          <DraggableCard
            // ✅ STABILAN KLJUČ: Koristimo URI ako postoji, inače fiksni slot
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
  container: { paddingBottom: 20 },
  photosTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginHorizontal: HORIZONTAL_PADDING,
    marginBottom: 10,
  },
  gridContainer: {
    marginHorizontal: HORIZONTAL_PADDING,
    position: 'relative',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  removeBtn: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 15,
    zIndex: 20,
  },
  placeholderCard: {
    flex: 1,
    backgroundColor: COLORS.placeholderBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addText: { fontSize: 12, color: COLORS.primary, marginTop: 4, fontWeight: '700' },
});

export default ProfilePhotoGrid;
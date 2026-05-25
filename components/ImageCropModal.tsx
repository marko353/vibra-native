import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as ImageManipulator from 'expo-image-manipulator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CROP_WIDTH = SCREEN_WIDTH - 32;
const CROP_HEIGHT = (CROP_WIDTH * 4) / 3;

interface ImageCropModalProps {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
  onCropSave: (croppedUri: string) => void;
}

export default function ImageCropModal({ visible, imageUri, onClose, onCropSave }: ImageCropModalProps) {
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  // Reanimated deljene vrednosti
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const startScale = useSharedValue(1);
  const startTranslateX = useSharedValue(0);
  const startTranslateY = useSharedValue(0);

  // Pomoćna funkcija na UI niti koja vraća sliku u dozvoljene granice (izbacuje crne praznine)
  const clampOffsets = (currentScale: number, animated: boolean) => {
    'worklet';
    // Koliko je slika realno šira i viša od okvira kada se uračuna trenutni scale
    const maxTx = (CROP_WIDTH * (currentScale - 1)) / 2;
    const maxTy = (CROP_HEIGHT * (currentScale - 1)) / 2;

    const targetX = Math.max(-maxTx, Math.min(translateX.value, maxTx));
    const targetY = Math.max(-maxTy, Math.min(translateY.value, maxTy));

    if (animated) {
      // Koristimo sa oprugom za prirodan "Tinder/Instagram" bounce-back efekat
      translateX.value = withSpring(targetX, { damping: 15 });
      translateY.value = withSpring(targetY, { damping: 15 });
    } else {
      translateX.value = targetX;
      translateY.value = targetY;
    }
  };

  // 1. ZOOM Gesta
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      startScale.value = scale.value;
    })
    .onUpdate((e) => {
      scale.value = Math.max(1, startScale.value * e.scale);
      // Tokom zumiranja dinamički držimo sliku unutar granica da ne "beži"
      clampOffsets(scale.value, false);
    })
    .onEnd(() => {
      // Ako se zum završi, proveravamo granice sa glatkom animacijom
      clampOffsets(scale.value, true);
    });

  // 2. POMERANJE Gesta
  const panGesture = Gesture.Pan()
    .onStart(() => {
      startTranslateX.value = translateX.value;
      startTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      // Dozvoljavamo blago "probijanje" ivica dok korisnik vuče prst radi boljeg osećaja (friction)
      const maxTx = (CROP_WIDTH * (scale.value - 1)) / 2;
      const maxTy = (CROP_HEIGHT * (scale.value - 1)) / 2;

      let nextX = startTranslateX.value + e.translationX;
      let nextY = startTranslateY.value + e.translationY;

      // Ako vuče preko granice, ublažavamo kretanje (otpor ekrana)
      if (nextX > maxTx) nextX = maxTx + (nextX - maxTx) * 0.3;
      if (nextX < -maxTx) nextX = -maxTx + (nextX + maxTx) * 0.3;
      if (nextY > maxTy) nextY = maxTy + (nextY - maxTy) * 0.3;
      if (nextY < -maxTy) nextY = -maxTy + (nextY + maxTy) * 0.3;

      translateX.value = nextX;
      translateY.value = nextY;
    })
    .onEnd(() => {
      // Čim korisnik pusti prst, vraćamo sliku tačno na ivicu narandžastog okvira
      clampOffsets(scale.value, true);
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handleCrop = async () => {
    if (!imageUri) return;
    setLoading(true);

    try {
      const imgInfo = await ImageManipulator.manipulateAsync(imageUri, [], { format: ImageManipulator.SaveFormat.JPEG });
      const imgWidth = imgInfo.width;
      const imgHeight = imgInfo.height;

      const scaleFactor = imgWidth / CROP_WIDTH;
      
      let cropWidthInPixels = imgWidth / scale.value;
      let cropHeightInPixels = (cropWidthInPixels * 4) / 3;

      if (cropWidthInPixels > imgWidth) {
        cropWidthInPixels = imgWidth;
        cropHeightInPixels = (imgWidth * 4) / 3;
      }
      if (cropHeightInPixels > imgHeight) {
        cropHeightInPixels = imgHeight;
        cropWidthInPixels = (imgHeight * 3) / 4;
      }

      let originX = (imgWidth - cropWidthInPixels) / 2 - (translateX.value * scaleFactor) / scale.value;
      let originY = (imgHeight - cropHeightInPixels) / 2 - (translateY.value * scaleFactor) / scale.value;

      originX = Math.max(0, Math.min(originX, imgWidth - cropWidthInPixels));
      originY = Math.max(0, Math.min(originY, imgHeight - cropHeightInPixels));

      const finalCrop = {
        originX: Math.round(originX),
        originY: Math.round(originY),
        width: Math.round(cropWidthInPixels),
        height: Math.round(cropHeightInPixels),
      };

      if (finalCrop.originX + finalCrop.width > imgWidth) {
        finalCrop.width = imgWidth - finalCrop.originX;
      }
      if (finalCrop.originY + finalCrop.height > imgHeight) {
        finalCrop.height = imgHeight - finalCrop.originY;
      }

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { crop: finalCrop }, 
          { resize: { width: 640, height: 853 } }
        ],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
      );

      runOnJS(onCropSave)(result.uri);
    } catch (err) {
      console.error('Greška pri kropovanju:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetAnimations = () => {
    scale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    startScale.value = 1;
    startTranslateX.value = 0;
    startTranslateY.value = 0;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onShow={resetAnimations}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.container}>
          
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + 6, height: 64 + insets.top }]}>
            <TouchableOpacity onPress={onClose} style={styles.navBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={26} color="#aaa" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Uredi sliku</Text>
            <TouchableOpacity onPress={handleCrop} disabled={loading} style={styles.navBtn} activeOpacity={0.7}>
              {loading ? (
                <ActivityIndicator color="#ff7f00" size="small" />
              ) : (
                <View style={styles.saveBtnBubble}>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Radni prostor */}
          <View style={styles.cropContainer}>
            <GestureDetector gesture={composedGesture}>
              <View style={styles.cropBox}>
                {imageUri && (
                  <Animated.View style={[styles.imageWrapper, animatedStyle]}>
                    <Image 
                      source={{ uri: imageUri }} 
                      style={styles.image} 
                      contentFit="cover" 
                    />
                  </Animated.View>
                )}
              </View>
            </GestureDetector>

            {/* Maske */}
            <View style={[styles.overlayTop, { top: 0 }]} pointerEvents="none" />
            <View style={[styles.overlayBottom, { bottom: 0 }]} pointerEvents="none" />
          </View>

          {/* Footer */}
          <View style={[styles.footer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }]}>
            <Text style={styles.hint}>Pinch-to-zoom za uvećanje • Prevucite za pomeranje</Text>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const overlayHeight = (SCREEN_HEIGHT - (64 + (Platform.OS === 'ios' ? 44 : 20)) - 70 - CROP_HEIGHT) / 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#121212',
    borderBottomWidth: 1,
    borderColor: '#222',
  },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#fff', letterSpacing: 0.2 },
navBtn: { 
    width: 44, 
    height: 44, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
    saveBtnBubble: {
    backgroundColor: '#ff7f00',
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff7f00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cropContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cropBox: {
    width: CROP_WIDTH,
    height: CROP_HEIGHT,
    borderWidth: 2,
    borderColor: '#ff7f00',
    borderRadius: 8,
    overflow: 'hidden', 
    backgroundColor: '#000',
    zIndex: 5,
  },
  imageWrapper: { width: '100%', height: '100%' },
  image: { width: '100%', height: '100%' },
  overlayTop: {
    position: 'absolute',
    left: 0, right: 0,
    height: overlayHeight,
    backgroundColor: 'rgba(10, 10, 10, 0.85)',
    zIndex: 2,
  },
  overlayBottom: {
    position: 'absolute',
    left: 0, right: 0,
    height: overlayHeight,
    backgroundColor: 'rgba(10, 10, 10, 0.85)',
    zIndex: 2,
  },
  footer: {
    height: 70,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#222',
  },
  hint: { color: '#666', fontSize: 13, fontWeight: '500' },
});
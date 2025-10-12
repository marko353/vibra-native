import React, { useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  State,
  PanGestureHandlerGestureEvent,
  TapGestureHandler,
  TapGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';
import { UserProfile } from '../context/ProfileContext';

interface CardProps {
  user: UserProfile;
  onSwipe: (userId: string, direction: 'left' | 'right') => void;
  currentImageIndex: number;
  isTopCard: boolean;
  onImageChange: (direction: 'left' | 'right') => void;
  onInfoPress: (user: UserProfile) => void;
  cardStyle?: StyleProp<ViewStyle>;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.95;
const SWIPE_THRESHOLD = width * 0.25;

const Card: React.FC<CardProps> = ({
  user,
  onSwipe,
  currentImageIndex,
  isTopCard,
  onImageChange,
  onInfoPress,
  cardStyle,
}) => {
  const tapRef = useRef(null);
  const panRef = useRef(null);

  const calculateAge = (birthDateString?: string | null): number | null => {
    if (!birthDateString) return null;
    const birthDate = new Date(birthDateString);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scaleOnTap = useSharedValue(1);
  const age = calculateAge(user.birthDate);

  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    'worklet';
    translateX.value = event.nativeEvent.translationX;
    translateY.value = event.nativeEvent.translationY;
  };

  const onPanHandlerStateChange = useCallback(
    (event: PanGestureHandlerGestureEvent) => {
      'worklet';
      const { state, translationX, velocityX } = event.nativeEvent;

      if (state === State.END) {
        const swipeSpeed = Math.abs(velocityX);
        const shouldSwipeRight = translationX > SWIPE_THRESHOLD || (translationX > 0 && swipeSpeed > 800);
        const shouldSwipeLeft = translationX < -SWIPE_THRESHOLD || (translationX < 0 && swipeSpeed > 800);

        if (shouldSwipeRight || shouldSwipeLeft) {
          const direction = shouldSwipeRight ? 'right' : 'left';
          const userId = user._id || '';
          translateX.value = withTiming(width * (direction === 'right' ? 1.5 : -1.5), { duration: 300 }, () => {
            runOnJS(onSwipe)(userId, direction);
          });
        } else {
          translateX.value = withSpring(0, { damping: 10, stiffness: 100 });
          translateY.value = withSpring(0, { damping: 10, stiffness: 100 });
        }
      }
    },
    [user, onSwipe, translateX, translateY]
  );

  const onTapHandlerStateChange = useCallback(
    (event: TapGestureHandlerStateChangeEvent) => {
      'worklet';
      if (event.nativeEvent.state === State.ACTIVE) {
        const isLeftTap = event.nativeEvent.x < CARD_WIDTH / 2;
        runOnJS(onImageChange)(isLeftTap ? 'left' : 'right');

        scaleOnTap.value = withTiming(0.98, { duration: 100 }, () => {
          scaleOnTap.value = withTiming(1, { duration: 100 });
        });
      }
    },
    [onImageChange, scaleOnTap]
  );

  const animatedStyle = useAnimatedStyle(() => {
    const rotateZ = interpolate(translateX.value, [-width / 2, width / 2], [-15, 15], Extrapolate.CLAMP);
    const scale = interpolate(translateX.value, [-width * 0.9, 0, width * 0.9], [0.95, 1, 0.95], Extrapolate.CLAMP);

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotateZ: `${rotateZ}deg` },
        { scale: scaleOnTap.value * scale },
      ],
    };
  });

  const CardView = ({ user, currentImageIndex }: { user: UserProfile; currentImageIndex: number }) => (
    <View style={styles.card}>
      <Animated.Image
        source={{
          uri:
            (user.profilePictures && user.profilePictures[currentImageIndex]) ||
            'https://placehold.co/500x700/e0e0e0/e0e0e0?text=.',
        }}
        style={styles.cardImage}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']}
        locations={[0.5, 0.7, 1]}
        style={styles.gradientOverlayBottom}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'transparent']}
        locations={[0, 0.3]}
        style={styles.gradientOverlayTop}
      />
      <View style={styles.imageIndicatorContainer}>
        {(user.profilePictures || []).map((_, index: number) => (
          <View key={index} style={[styles.indicator, currentImageIndex === index && styles.activeIndicator]} />
        ))}
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.name}>
          {user.fullName}
          {age !== null ? `, ${age}` : ''}
        </Text>
        {user.location?.locationCity && (
          <View style={styles.locationContainer}>
            <Icon name="location-sharp" size={16} color="#fff" />
            <Text style={styles.locationText}>{user.location.locationCity}</Text>
          </View>
        )}
      </View>
      <TouchableOpacity style={styles.infoButton} onPress={() => onInfoPress(user)} activeOpacity={0.8}>
        <Icon name="information-circle-outline" size={40} color="#fff" />
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.choiceOverlay,
          { borderColor: '#4CCC93' },
          {
            opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolate.CLAMP),
          },
        ]}
      >
        <Text style={[styles.choiceText, { color: '#4CCC93' }]}>LIKE</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.choiceOverlay,
          { borderColor: '#FF6B6B', right: null, left: 20 },
          {
            opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], Extrapolate.CLAMP),
          },
        ]}
      >
        <Text style={[styles.choiceText, { color: '#FF6B6B' }]}>NOPE</Text>
      </Animated.View>
    </View>
  );

  if (!isTopCard) {
    return (
      <View style={[styles.cardWrapper, { zIndex: 0, transform: [{ scale: 0.9 }] }, cardStyle]}>
        <CardView user={user} currentImageIndex={0} />
      </View>
    );
  }

  return (
    <PanGestureHandler
      ref={panRef}
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onPanHandlerStateChange}
      activeOffsetX={[-10, 10]}
      maxPointers={1}
      waitFor={tapRef}
    >
      <Animated.View style={[styles.cardWrapper, { zIndex: 1 }, animatedStyle, cardStyle]}>
        <TapGestureHandler ref={tapRef} onHandlerStateChange={onTapHandlerStateChange} maxDurationMs={250}>
          <Animated.View style={{ flex: 1, borderRadius: 20, overflow: 'hidden' }}>
            <CardView user={user} currentImageIndex={currentImageIndex} />
          </Animated.View>
        </TapGestureHandler>
      </Animated.View>
    </PanGestureHandler>
  );
};

export default Card;

const styles = StyleSheet.create({
  cardWrapper: {
    width: CARD_WIDTH,
    height: '93%',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
    position: 'absolute',
    alignSelf: 'center',
    top: '2%',
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  gradientOverlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
  },
  imageIndicatorContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    zIndex: 2,
  },
  indicator: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 3,
  },
  activeIndicator: {
    backgroundColor: '#fff',
  },
  cardInfo: {
    position: 'absolute',
    bottom: 70,
    left: 20,
    right: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 8,
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 6,
    marginLeft: 5,
  },
  bio: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.98)',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 6,
  },
  choiceOverlay: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
    borderWidth: 4,
    borderRadius: 5,
    transform: [{ rotate: '15deg' }],
  },
  choiceText: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  infoButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 3,
  },
});

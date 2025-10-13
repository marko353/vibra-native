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

const InfoChip = ({ icon, text }: { icon: string; text: string | number }) => (
  <View style={styles.chip}>
    <Icon name={icon} size={14} color="#FFFFFF" style={styles.chipIcon} />
    <Text style={styles.chipText} numberOfLines={1}>
      {text}
    </Text>
  </View>
);

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
  
  const CardView = ({ user, currentImageIndex }: { user: UserProfile; currentImageIndex: number }) => {
    let infoComponents: React.ReactNode[] = [];

    // --- Logika za grupisanje i prikazivanje informacija po slikama ---
    switch (currentImageIndex) {
        case 0:
            // Na prvoj slici prikazujemo Osnovne Info
            if (user.location?.locationCity) infoComponents.push(<InfoChip key="loc" icon="location-outline" text={user.location.locationCity} />);
            if (user.relationshipType) infoComponents.push(<InfoChip key="rel" icon="heart-outline" text={user.relationshipType} />);
            if (user.horoscope) infoComponents.push(<InfoChip key="horo" icon="star-outline" text={user.horoscope} />);
            break;
        case 1:
            // Na drugoj slici prikazujemo Atribute i Posao
            if (user.height) infoComponents.push(<InfoChip key="height" icon="resize-outline" text={`${user.height} cm`} />);
            if (user.workout) infoComponents.push(<InfoChip key="work" icon="barbell-outline" text={user.workout} />);
            if (user.jobTitle) infoComponents.push(<InfoChip key="job" icon="briefcase-outline" text={user.jobTitle} />);
            break;
        case 2:
            // Na trećoj slici prikazujemo Interesovanja
            if (user.interests && user.interests.length > 0) {
                user.interests.slice(0, 4).forEach(interest => { // Prikazujemo najviše 4
                    infoComponents.push(<InfoChip key={interest} icon="sparkles-outline" text={interest} />);
                });
            }
            break;
        case 3:
            // Na četvrtoj slici prikazujemo Stil života
            if (user.pets) infoComponents.push(<InfoChip key="pets" icon="paw-outline" text={user.pets} />);
            if (user.drinks) infoComponents.push(<InfoChip key="drinks" icon="beer-outline" text={user.drinks} />);
            if (user.smokes) infoComponents.push(<InfoChip key="smokes" icon="bonfire-outline" text={user.smokes} />);
            break;
        default:
            // Na ostalim slikama nema dodatnih informacija
            infoComponents = [];
    }

    return (
      <View style={styles.card}>
        <Animated.Image
          source={{ uri: (user.profilePictures && user.profilePictures[currentImageIndex]) || 'https://placehold.co/500x700/e0e0e0/e0e0e0?text=.' }}
          style={styles.cardImage}
        />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']} locations={[0.5, 0.7, 1]} style={styles.gradientOverlayBottom} />
        <LinearGradient colors={['rgba(0,0,0,0.4)', 'transparent']} locations={[0, 0.3]} style={styles.gradientOverlayTop} />
        
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
          
          {infoComponents.length > 0 && (
            <View style={styles.chipsContainer}>
              {infoComponents}
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.infoButton} onPress={() => onInfoPress(user)} activeOpacity={0.8}>
          <Icon name="information-circle-outline" size={32} color="#fff" />
        </TouchableOpacity>

        {/* ... ostatak JSX-a za LIKE/NOPE ... */}
      </View>
    );
  };

  if (!isTopCard) {
    return (
      <View style={[styles.cardWrapper, { zIndex: 0, transform: [{ scale: 0.9 }] }, cardStyle]}>
        <CardView user={user} currentImageIndex={0} />
      </View>
    );
  }

  return (
    <PanGestureHandler ref={panRef} onGestureEvent={onGestureEvent} onHandlerStateChange={onPanHandlerStateChange} activeOffsetX={[-10, 10]} maxPointers={1} waitFor={tapRef}>
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
    height: '95%',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
    position: 'absolute',
    alignSelf: 'center',
    top: '1.5%',
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  cardImage: { width: '100%', height: '100%' },
  gradientOverlayBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%' },
  gradientOverlayTop: { position: 'absolute', top: 0, left: 0, right: 0, height: '30%' },
  imageIndicatorContainer: { position: 'absolute', top: 10, left: 10, right: 10, flexDirection: 'row', zIndex: 2 },
  indicator: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255, 255, 255, 0.5)', marginHorizontal: 3 },
  activeIndicator: { backgroundColor: '#fff' },
  cardInfo: {
    position: 'absolute',
    bottom: 90, 
    left: 20,
    right: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 8,
    marginBottom: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    borderColor: 'rgba(233, 30, 99, 0.5)',
    borderWidth: 1.5,
  },
  chipIcon: {
    marginRight: 6,
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  infoButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 3,
  },
  choiceOverlay: {
    position: 'absolute', top: 40, right: 20, padding: 10, borderWidth: 4, borderRadius: 5, transform: [{ rotate: '15deg' }],
  },
  choiceText: { fontSize: 28, fontWeight: 'bold', letterSpacing: 2 },
});
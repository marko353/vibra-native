import React, { useCallback, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StyleProp,
  ViewStyle,
  TouchableOpacity,
  Image,
} from 'react-native';
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
// Koristimo centralnu definiciju tipa
import { UserProfile } from '../context/ProfileContext';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 1
const SWIPE_THRESHOLD = width * 0.25;

// Definisanje strukture za pojedinačnu info stavku
interface InfoItemData {
  icon: string;
  text: string | number;
  label?: string; // Koristi se za Interesovanja / Languages
}

interface CardProps {
  user: UserProfile;
  onSwipe: (userId: string, direction: 'left' | 'right') => void;
  currentImageIndex: number;
  isTopCard: boolean;
  onImageChange: (direction: 'left' | 'right') => void;
  onInfoPress: (user: UserProfile) => void;
  cardStyle?: StyleProp<ViewStyle>;
}

// Komponenta za prikaz pojedinačne informacije (jedna ikonica + tekst)
const InfoItem = ({ icon, text }: { icon: string; text: string | number }) => (
  <View style={styles.infoItem}>
    <Icon name={icon} size={18} color="#fff" />
    <Text style={styles.infoText}>{text}</Text>
  </View>
);

// Komponenta za prikaz grupisanih tabova (za Interesovanja)
const TabItem = ({ text }: { text: string | number }) => (
  <View style={styles.tabItem}>
    <Text style={styles.tabText}>{text}</Text>
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
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scaleOnTap = useSharedValue(1);

  const [prevImageUri, setPrevImageUri] = useState<string | null>(null);
  const imageOpacity = useSharedValue(1);
  const prevImageOpacity = useSharedValue(0);

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

  const age = calculateAge(user.birthDate);
  const imageUri = user.profilePictures?.[currentImageIndex] || 'https://placehold.co/500x700?text=No+Image';

  // 🔥 Crossfade između slika
  useEffect(() => {
    if (imageUri) {
      setPrevImageUri((prev) => {
        if (prev === imageUri) return prev;
        return prev ? prev : imageUri;
      });

      prevImageOpacity.value = 1;
      imageOpacity.value = 0;

      prevImageOpacity.value = withTiming(0, { duration: 350 });
      imageOpacity.value = withTiming(1, { duration: 350 });
    }
  }, [currentImageIndex, imageUri]); // Dodata imageUri u dependencies

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
          translateX.value = withSpring(0);
          translateY.value = withSpring(0);
        }
      }
    },
    [user, onSwipe]
  );

  const onTapHandlerStateChange = useCallback(
    (event: TapGestureHandlerStateChangeEvent) => {
      'worklet';
      if (event.nativeEvent.state === State.ACTIVE) {
        const isLeftTap = event.nativeEvent.x < CARD_WIDTH / 2;
        runOnJS(onImageChange)(isLeftTap ? 'left' : 'right');
        scaleOnTap.value = withTiming(0.97, { duration: 100 }, () => {
          scaleOnTap.value = withTiming(1, { duration: 100 });
        });
      }
    },
    [onImageChange]
  );

  const animatedStyle = useAnimatedStyle(() => {
    const rotateZ = interpolate(translateX.value, [-width / 2, width / 2], [-15, 15], Extrapolate.CLAMP);
    const scale = interpolate(Math.abs(translateX.value), [0, width / 2], [1, 0.95], Extrapolate.CLAMP);
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotateZ: `${rotateZ}deg` },
        { scale: scaleOnTap.value * scale },
      ],
    };
  });

  const animatedImageStyle = useAnimatedStyle(() => ({ opacity: imageOpacity.value }));
  const animatedPrevImageStyle = useAnimatedStyle(() => ({ opacity: prevImageOpacity.value }));

  // --- NOVA LOGIKA ZA DINAMIČKI PRIKAZ INFORMACIJA ---
  const allAvailableInfo: InfoItemData[][] = [];

  // Helper za dodavanje pojedinačne stavke (koja se prikazuje kao InfoItem)
  // Ispravljeno: Dodat 'null' u listu dozvoljenih tipova za ulazni argument 'text'
  const addSingleInfo = (icon: string, text: string | number | undefined | null) => {
    // Proverava da li je vrednost validna (nije undefined, null, ili prazan string)
    if (text) {
      // Svaka stavka je array od jednog elementa za InfoRow
      allAvailableInfo.push([{ icon, text }]);
    }
  };

  // 1. Prioritet: Lokacija
  addSingleInfo('location-outline', user.location?.locationCity);
  
  // 2. Prioritet: Tip veze
  addSingleInfo('heart-outline', user.relationshipType);
  
  // 3. Prioritet: Posao/Zanimanje
  addSingleInfo('briefcase-outline', user.jobTitle);

  // 4. Prioritet: Jezici (prikazuje se kao jedna linija)
  if (user.languages?.length) {
      allAvailableInfo.push([{ 
          icon: 'language-outline', 
          // Spajamo sve jezike u jedan string
          text: user.languages.join(', ') 
      }]);
  }

  // 5. Prioritet: Interesovanja (Specijalni slučaj: Prikazuje se do 6 tabova)
  const validInterests = (user.interests || []).slice(0, 6);
  if (validInterests.length > 0) {
      // Dodajemo poseban "slot" za interesovanja
      allAvailableInfo.push([
          // Prvi element je labela, ostali su tabovi
          { icon: 'sparkles-outline', text: 'Interesovanja', label: 'header' },
          ...validInterests.map(i => ({ icon: '', text: i, label: 'tab' })) 
      ]);
  }
  // --- KRAJ LOGIKE ZA INFO LISTU ---

  // Odabir seta informacija za trenutnu sliku (rotacija)
  const infoCount = allAvailableInfo.length;
  
  // Prikazuje se samo ako je currentImageIndex manji od infoCount.
  const visibleInfoSet = (currentImageIndex < infoCount) 
    ? allAvailableInfo[currentImageIndex] 
    : [];
    
  // Proveravamo da li je trenutni set Interesovanja
  const isInterestsSet = visibleInfoSet.length > 0 && visibleInfoSet[0].label === 'header';


  const CardView = () => (
    <View style={styles.card}>
      {/* Pozadinski blur sloj */}
      <Image source={{ uri: imageUri }} style={styles.imageBackground} blurRadius={20} />

      {/* Prethodna slika (fade out) */}
      {prevImageUri && (
        <Animated.Image source={{ uri: prevImageUri }} style={[styles.imageMain, animatedPrevImageStyle]} />
      )}

      {/* Nova slika (fade in) */}
      <Animated.Image source={{ uri: imageUri }} style={[styles.imageMain, animatedImageStyle]} />

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)']}
        style={styles.gradientBottom}
      />

      {/* Indikatori */}
      <View style={styles.indicators}>
        {(user.profilePictures || []).map((_, index) => (
          <View key={index} style={[styles.indicator, currentImageIndex === index && styles.indicatorActive]} />
        ))}
      </View>

      {/* Info sekcija */}
      <View style={styles.infoSection}>
        <Text style={styles.name}>
          {user.fullName} {age ? `${age}` : ''}
        </Text>

        {/* Prikazivanje Interesovanja (kao tabovi) ili jedne Info Stavke */}
        <View style={styles.infoRow}>
          {isInterestsSet ? (
            <>
              {/* Naslov za interesovanja */}
              <Text style={styles.infoGroupHeader}>{visibleInfoSet[0].text}:</Text>
              {/* Tabovi za interesovanja, počevši od drugog elementa u setu */}
              {visibleInfoSet.slice(1).map((item, i) => (
                  <TabItem key={i} text={item.text} />
              ))}
            </>
          ) : (
            // Prikaz jedne standardne info stavke
            visibleInfoSet.map((item, i) => (
                <InfoItem key={i} icon={item.icon} text={item.text} />
            ))
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.infoButton} onPress={() => onInfoPress(user)}>
        <Icon name="information-circle-outline" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  if (!isTopCard) {
    return (
      <View style={[styles.cardWrapper, { transform: [{ scale: 0.92 }], opacity: 0.9 }, cardStyle]}>
        <CardView />
      </View>
    );
  }

  return (
    <PanGestureHandler onGestureEvent={onGestureEvent} onHandlerStateChange={onPanHandlerStateChange}>
      <Animated.View style={[styles.cardWrapper, animatedStyle, cardStyle]}>
        <TapGestureHandler onHandlerStateChange={onTapHandlerStateChange}>
          <Animated.View style={{ flex: 1, borderRadius: 25, overflow: 'hidden' }}>
            <CardView />
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

  height: height * 0.78, 
  borderRadius: 25,
  position: 'absolute',
  alignSelf: 'center',

  
  // Dodaj senku da kartica ne izgleda ravno na pravom ekranu
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 10,
  elevation: 10, // Za Android
},
  card: {
    flex: 1,
    borderRadius: 25,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  imageBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  imageMain: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    position: 'absolute',
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    height: '50%',
    width: '100%',
  },
  indicators: {
    position: 'absolute',
    top: 10,
    left: 15,
    right: 15,
    flexDirection: 'row',
  },
  indicator: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 3,
  },
  indicatorActive: {
    backgroundColor: '#c2aeaeff',
  },
  infoSection: {
    position: 'absolute',
    bottom: 70,
    left: 20,
    right: 20,
  },
  name: {
    fontSize: 34, // Malo veći font za bolji naglasak
    fontWeight: '800', // Jači bold
    color: '#fff',
    marginBottom: 8, // Dodat razmak
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    // Sada je cela stavka samostalna, bez marginRight-a
    marginRight: 12, 
    marginBottom: 6,
  },
  infoText: {
    color: '#fff',
    fontSize: 18, // Malo veći font za samostalnu stavku
    fontWeight: '600',
    marginLeft: 10, // Veći razmak od ikonice
  },
  infoGroupHeader: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 10,
    marginBottom: 10,
  },
  tabItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)', // Poluprovidna pozadina za tab
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
    marginBottom: 8,
  },
  tabText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import LottieView from 'lottie-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import Icon from 'react-native-vector-icons/Ionicons';
import { UserProfile } from '../context/ProfileContext';
import { useAuthContext } from '../context/AuthContext';
import { useProfileContext } from '../context/ProfileContext'; 

interface MatchAnimationProps {
  matchedUser: UserProfile;
  onSendMessage: (message: string) => void;
  onClose: () => void;
}

export default function MatchAnimation({ matchedUser, onSendMessage, onClose }: MatchAnimationProps) {
  const { user } = useAuthContext();
  const { profile } = useProfileContext(); 
  
  const [message, setMessage] = useState('');
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
    scale.value = withTiming(1, { duration: 600 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handleSend = () => {
    onSendMessage(message.trim());
    setMessage('');
  };

  const userAvatarSource = 
    (profile?.profilePictures && profile.profilePictures.length > 0)
      ? { uri: profile.profilePictures[0] }
      : undefined;

  const matchedAvatarSource = matchedUser?.avatar ? { uri: matchedUser.avatar } : undefined;


  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      pointerEvents="box-none" 
    >
      
      {/* BlurView je pozadina, zIndex: 1 */}
      <BlurView intensity={70} tint="dark" style={styles.blurBackground} />

      {/* ✨ OMOTAČ ZA LottieView: REŠENJE ZA TYPESCRIPT GREŠKU */}
      <View 
        style={styles.lottieWrapper} 
        pointerEvents="none" // pointerEvents sada na View-u (Ispravno)
      >
        <LottieView
          source={require('../assets/animations/confetti.json')}
          autoPlay
          loop={false}
          style={styles.lottieInner} 
        />
      </View>

      {/* Animirani sadržaj sa dugmadima i inputom, zIndex: 3 */}
      <Animated.View style={[styles.content, animatedStyle]}>
        <Text style={styles.title}>IT&#39;S A VIBRATION!</Text>
        <Text style={styles.subtitle}>
          Ti i <Text style={styles.highlight}>{matchedUser.fullName}</Text> ste se svideli jedno drugom 💫
        </Text>

        <View style={styles.avatarsContainer}>
          <Image 
            source={userAvatarSource} 
            style={[styles.avatar, { zIndex: 3, marginRight: -20 }]} 
            onError={(error) => console.log("Greška pri učitavanju mog avatara:", error.nativeEvent.error)}
          />
          <Image 
            source={matchedAvatarSource} 
            style={styles.avatar} 
          />
        </View>

        {/* Input Container - prima dodire */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder="Pošalji prvu poruku..." 
            placeholderTextColor="#C9C9C9" 
            value={message}
            onChangeText={setMessage}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity 
            onPress={handleSend} 
            style={styles.sendButton} 
          >
            <Icon name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Dugme Zatvori - prima dodire */}
        <TouchableOpacity 
            style={styles.buttonSecondary} 
            onPress={onClose}
            activeOpacity={0.7}
        >
          <Text style={styles.buttonSecondaryText}>Zatvori i nastavi prevlačenje</Text>
        </TouchableOpacity>
      </Animated.View>
      
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.08)', 
  },
  
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
    // Z-INDEKS 1: NAJNIŽI SLOJ
    zIndex: 1, 
  },
  
  // ✨ NOVI STILOVI ZA LOTTIE OMOTAČ
  lottieWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    // Z-INDEKS 2: SREDNJI SLOJ (na omotaču)
    zIndex: 2, 
  },
  lottieInner: {
    width: '100%',
    height: '100%',
  },
  
  content: {
    alignItems: 'center',
    paddingHorizontal: 25,
    width: '100%',
    // Z-INDEKS 3: NAJVIŠI SLOJ (interaktivni elementi)
    zIndex: 3, 
  },
  
  title: {
    fontSize: 44,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(255,105,180,0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  subtitle: {
    fontSize: 18,
    color: '#eee',
    textAlign: 'center',
    marginBottom: 40,
  },
  highlight: { fontWeight: 'bold', color: '#fff' },
  avatarsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  avatar: {
    width: 160, 
    height: 160,
    borderRadius: 80, 
    borderWidth: 4,
    borderColor: '#fff',
    resizeMode: 'cover', 
    backgroundColor: 'rgba(50, 50, 50, 0.5)', 
  },
  inputContainer: {
    flexDirection: 'row',
    width: '90%', 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    borderRadius: 30, 
    paddingHorizontal: 15,
    paddingVertical: 4, 
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  messageInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 10, 
    paddingHorizontal: 5,
  },
  sendButton: {
    backgroundColor: '#FF4500', 
    width: 44, 
    height: 44,
    borderRadius: 22,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF4500', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
    elevation: 8, 
  },
  sendButtonDisabled: { 
    backgroundColor: 'rgba(255, 69, 0, 0.4)', 
    shadowOpacity: 0.2, 
    elevation: 2,
  },
  buttonSecondary: {
    paddingVertical: 10,
  },
  buttonSecondaryText: {
    color: '#ccc',
    fontSize: 16,
    fontWeight: '600',
  },
});
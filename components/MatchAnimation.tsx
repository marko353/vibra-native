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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';

import { UserProfile } from '../context/ProfileContext';
import { useProfileContext } from '../context/ProfileContext';

interface MatchAnimationProps {
  matchedUser: UserProfile;
  onSendMessage: (message: string) => Promise<void>;
  onClose: () => void;
}

export default function MatchAnimation({
  matchedUser,
  onSendMessage,
  onClose,
}: MatchAnimationProps) {
  const { profile } = useProfileContext();

  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

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

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed || isSending) return;

    try {
      setIsSending(true);
      await onSendMessage(trimmed); // ⬅️ parent obezbeđuje conversation
      setMessage('');
    } catch (err) {
      console.log('❌ Greška pri slanju poruke:', err);
    } finally {
      setIsSending(false);
    }
  };

  const userAvatarSource =
    profile?.profilePictures?.length
      ? { uri: profile.profilePictures[0] }
      : undefined;

  const matchedAvatarSource = matchedUser?.avatar
    ? { uri: matchedUser.avatar }
    : undefined;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* 🎉 Confetti */}
      <View style={styles.lottieWrapper} pointerEvents="none">
        <LottieView
          source={require('../assets/animations/confetti.json')}
          autoPlay
          loop={false}
          style={styles.lottieInner}
        />
      </View>

      {/* 🎯 Content */}
      <Animated.View style={[styles.content, animatedStyle]}>
        <Text style={styles.title}>IT&#39;S A VIBRATION!</Text>

        <Text style={styles.subtitle}>
          Ti i{' '}
          <Text style={styles.highlight}>{matchedUser.fullName}</Text>{' '}
          ste se svideli jedno drugom 💫
        </Text>

        {/* Avatari */}
        <View style={styles.avatarsContainer}>
          <Image
            source={userAvatarSource}
            style={[styles.avatar, { marginRight: -20 }]}
          />
          <Image source={matchedAvatarSource} style={styles.avatar} />
        </View>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder="Pošalji prvu poruku..."
            placeholderTextColor="#C9C9C9"
            value={message}
            onChangeText={setMessage}
            onSubmitEditing={handleSend}
            editable={!isSending}
            returnKeyType="send"
          />

          <TouchableOpacity
            onPress={handleSend}
            disabled={isSending || !message.trim()}
            style={[
              styles.sendButton,
              (isSending || !message.trim()) &&
                styles.sendButtonDisabled,
            ]}
          >
            <Icon name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Close */}
        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonSecondaryText}>
            Zatvori i nastavi prevlačenje
          </Text>
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

  lottieWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
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
    zIndex: 3,
  },

  title: {
    fontSize: 44,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(255,105,180,0.7)',
    textShadowRadius: 15,
  },
  subtitle: {
    fontSize: 18,
    color: '#eee',
    textAlign: 'center',
    marginBottom: 40,
  },
  highlight: {
    fontWeight: 'bold',
    color: '#fff',
  },

  avatarsContainer: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  avatar: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: 'rgba(50,50,50,0.5)',
  },

  inputContainer: {
    flexDirection: 'row',
    width: '90%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 30,
    paddingHorizontal: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  messageInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 10,
  },
  sendButton: {
    backgroundColor: '#FF4500',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255,69,0,0.4)',
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

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface LikesCTAProps {
  isPremium: boolean;
  onPress?: () => void;
}

const LikesCTA: React.FC<LikesCTAProps> = ({ isPremium, onPress }) => {
  if (isPremium) return null;

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={styles.button}>
        <View style={styles.iconBox}>
          <Ionicons name="flash" size={16} color="#ff7f00" />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.title}>See who likes you</Text>
          <Text style={styles.subtitle}>Unlock all likes with Premium</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="rgba(255,127,0,0.5)" />
      </TouchableOpacity>
    </View>
  );
};

export default LikesCTA;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    alignItems: 'center',
    zIndex: 100,
  },
  button: {
    width: width * 0.88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ffd0a8',
    shadowColor: '#ff7f00',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff5ec',
    borderWidth: 1,
    borderColor: '#ffd0a8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
    marginTop: 1,
  },
});
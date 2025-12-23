import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width / 2 - 18;
const CARD_HEIGHT = CARD_WIDTH * 1.45;

/* ================= TYPES ================= */

interface LikeUser {
  _id: string;
  fullName: string;
  avatar: string | null;
  chatId: string;
  has_unread: boolean;
  age?: number;
}

interface LikeCardProps {
  user: LikeUser;
  isPremium: boolean;
  onPress?: () => void; // kasnije: premium unlock / open chat
}

/* ================= COMPONENT ================= */

const LikeCard: React.FC<LikeCardProps> = ({ user, isPremium, onPress }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      disabled={!isPremium} // ❌ bez premium nema klika
      style={styles.wrapper}
    >
      {/* IMAGE */}
      <Image
        source={{
          uri:
            user.avatar ||
            'https://placehold.co/400x600?text=No+Image',
        }}
        style={styles.image}
        blurRadius={isPremium ? 0 : 28} // 🔥 Tinder blur
      />

      {/* DARK OVERLAY */}
      {!isPremium && <View style={styles.blurOverlay} />}

      {/* AGE BADGE */}
      {!!user.age && (
        <View style={styles.ageBadge}>
          <Text style={styles.ageText}>{user.age}</Text>
        </View>
      )}

      {/* UNREAD DOT (optional) */}
      {user.has_unread && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
};

export default LikeCard;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  wrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#eee',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  ageBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  unreadDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff3b30', // iOS red
  },
});

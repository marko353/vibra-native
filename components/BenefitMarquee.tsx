import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width: windowWidth } = Dimensions.get('window');

const BENEFITS = [
  { text: 'No ads, ever', icon: 'ban-outline', color: '#ff7f00' },
  { text: 'Gold badge on profile', icon: 'star-outline', color: '#ff7f00' },
  { text: 'Priority in search', icon: 'trending-up-outline', color: '#ff7f00' },
  { text: 'Unlimited chat', icon: 'chatbubble-outline', color: '#ff7f00' },
  { text: 'Exclusive profile styles', icon: 'color-palette-outline', color: '#ff7f00' },
  { text: 'See who liked you', icon: 'heart-outline', color: '#ff7f00' },
];

const ITEM_WIDTH = 210;
const DURATION = 28000;

const BenefitMarquee = () => {
  const scrollX = useSharedValue(0);

  useEffect(() => {
    scrollX.value = withRepeat(
      withTiming(-ITEM_WIDTH * BENEFITS.length, {
        duration: DURATION,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: scrollX.value }],
  }));

  const fullList = [...BENEFITS, ...BENEFITS];

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <View style={[styles.fade, styles.fadeLeft]} pointerEvents="none" />

        <Animated.View style={[styles.track, animatedStyle]}>
          {fullList.map((item, index) => (
            <View key={`${item.text}-${index}`} style={styles.item}>
              <View style={styles.iconBox}>
                <Ionicons name={item.icon as any} size={14} color={item.color} />
              </View>
              <Text style={styles.text}>{item.text}</Text>
            </View>
          ))}
        </Animated.View>

        <View style={[styles.fade, styles.fadeRight]} pointerEvents="none" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // wrapper kompenzuje horizontalni padding parenta (20px sa svake strane)
  wrapper: {
    marginHorizontal: -20,
  },
  container: {
    width: windowWidth,
    height: 48,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ECECEC',
    justifyContent: 'center',
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    width: ITEM_WIDTH * BENEFITS.length * 2,
  },
  item: {
    width: ITEM_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  iconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#fff5ec',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffd0a8',
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    letterSpacing: 0.1,
  },
  fade: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 40,
    zIndex: 10,
  },
  fadeLeft: {
    left: 0,
  },
  fadeRight: {
    right: 0,
  },
});

export default BenefitMarquee;
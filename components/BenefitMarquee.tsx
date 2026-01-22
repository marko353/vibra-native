import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width: windowWidth } = Dimensions.get('window');

const BENEFITS = [
  { text: 'Bez reklama, zauvek', icon: 'volume-off', color: '#E91E63' },
  { text: 'Zlatna značka na profilu', icon: 'crown', color: '#FFD700' },
  { text: 'Prioritet u pretragama', icon: 'trending-up', color: '#2563EB' },
  { text: 'Neograničen chat sa svima', icon: 'chat', color: '#4CAF50' },
  { text: 'Ekskluzivni stilovi profila', icon: 'palette', color: '#9C27B0' },
];

const ITEM_WIDTH = 250; 
const DURATION = 30000; 

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
  }, [scrollX]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: scrollX.value }],
    };
  });

  const fullBenefitsList = [...BENEFITS, ...BENEFITS];

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.marqueeContent, animatedStyle]}>
        {fullBenefitsList.map((item, index) => (
          <View key={`${item.text}-${index}`} style={styles.benefitItem}>
            <Icon name={item.icon} size={24} color={item.color} />
            <Text style={styles.benefitText}>{item.text}</Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: windowWidth,
    height: 60, 
    overflow: 'hidden', 
    backgroundColor: '#f5f5f5',
    marginVertical: 20,
  },
  marqueeContent: {
    flexDirection: 'row',
    width: ITEM_WIDTH * BENEFITS.length * 2, 
    alignItems: 'center',
  },
  benefitItem: {
    width: ITEM_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  benefitText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});

export default BenefitMarquee;
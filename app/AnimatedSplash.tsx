// AnimatedSplash.tsx
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

export default function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  console.log('🔄 Rendering AnimatedSplash...');

  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log('🚀 Starting splash animation...');
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      console.log('✅ Animation finished, calling onFinish()');
      onFinish();
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('@/assets/images/1000006401.png')}
        style={[styles.image, { opacity }]}
        resizeMode="contain"
        onLoad={() => console.log('🖼️ Splash image loaded')}
        onError={(e) => console.log('❌ Error loading splash image:', e.nativeEvent.error)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 200,
  },
});

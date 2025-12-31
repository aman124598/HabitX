import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Dimensions, StatusBar } from 'react-native';
import Theme from '../lib/theme';

const { width, height } = Dimensions.get('window');

interface Props {
  onFinish: () => void;
  duration?: number;
}

const FirstInstallLogo: React.FC<Props> = ({ onFinish, duration = 2200 }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
      ]),
      Animated.delay(duration),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.95, duration: 300, useNativeDriver: true }),
      ]),
    ]).start(() => {
      onFinish();
    });
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <Animated.View style={[styles.logoWrap, { opacity, transform: [{ scale }] }]}>
        <Image
          source={require('../assets/images/logo-minimal.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.brand.primary,
  },
  logoWrap: {
    width: Math.min(320, width * 0.8),
    height: Math.min(160, height * 0.25),
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
});

export default FirstInstallLogo;

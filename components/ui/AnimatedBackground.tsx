import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../lib/themeContext';

const { width, height } = Dimensions.get('window');

interface AnimatedBackgroundProps {
  children: React.ReactNode;
  colors?: string[];
  duration?: number;
  variant?: 'default' | 'premium' | 'subtle';
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  children,
  colors: customColors,
  duration = 12000,
  variant = 'default',
}) => {
  const { colors: themeColors, isDark } = useTheme();
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.15)).current;

  // Premium gradient colors based on theme
  const getPremiumColors = () => {
    if (customColors) return customColors;
    
    if (variant === 'premium') {
      return isDark 
        ? ['#1E293B', '#0F172A', '#312E81', '#1E293B']
        : ['#F5F3FF', '#EDE9FE', '#DBEAFE', '#F0FDFA'];
    } else if (variant === 'subtle') {
      return isDark
        ? ['#0F172A', '#1E293B', '#0F172A']
        : ['#FAFAFA', '#F5F5F5', '#FAFAFA'];
    }
    
    // Default variant
    return [
      themeColors.brand.gradient[0],
      themeColors.brand.gradientOcean[0],
      themeColors.brand.gradientSunset[0],
      themeColors.brand.gradient[1],
    ];
  };

  const colors = getPremiumColors();

  useEffect(() => {
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: duration,
        useNativeDriver: true,
      })
    );

    const scaleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: duration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ])
    );

    const opacityAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: variant === 'premium' ? 0.3 : 0.2,
          duration: duration / 3,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: variant === 'premium' ? 0.15 : 0.08,
          duration: duration / 3,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: variant === 'premium' ? 0.25 : 0.15,
          duration: duration / 3,
          useNativeDriver: true,
        }),
      ])
    );

    rotateAnimation.start();
    scaleAnimation.start();
    opacityAnimation.start();

    return () => {
      rotateAnimation.stop();
      scaleAnimation.stop();
      opacityAnimation.stop();
    };
  }, [duration, variant]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Primary Background */}
      <LinearGradient
        colors={colors}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Animated Overlay */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: opacityAnim,
            transform: [
              { rotate: spin },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={[
            'rgba(255,255,255,0.1)',
            'rgba(255,255,255,0.05)',
            'rgba(255,255,255,0.2)',
            'rgba(255,255,255,0.05)',
            'rgba(255,255,255,0.1)',
          ]}
          style={styles.overlayGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Content */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  overlay: {
    position: 'absolute',
    width: width * 1.5,
    height: height * 1.5,
    left: -width * 0.25,
    top: -height * 0.25,
  },
  overlayGradient: {
    flex: 1,
  },
});

export default AnimatedBackground;
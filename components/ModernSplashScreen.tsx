import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface ModernSplashScreenProps {
  onAnimationComplete: () => void;
}

const ModernSplashScreen: React.FC<ModernSplashScreenProps> = ({ onAnimationComplete }) => {
  // Animation values
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotation = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(30)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const backgroundScale = useRef(new Animated.Value(1.2)).current;

  // Create animated circles
  const circles = useRef(
    Array.from({ length: 3 }, () => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0.3),
    }))
  ).current;

  useEffect(() => {
    // Background animation
    const backgroundAnimation = Animated.timing(backgroundScale, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    });

    // Logo animations
    const logoAnimation = Animated.sequence([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(logoRotation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]);

    // Text animations
    const textAnimation = Animated.parallel([
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(textTranslateY, {
        toValue: 0,
        tension: 80,
        friction: 12,
        useNativeDriver: true,
      }),
    ]);

    // Progress bar animation
    const progressAnimation = Animated.timing(progressWidth, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: false,
    });

    // Circle animations
    const circleAnimations = Animated.stagger(
      200,
      circles.map((circle) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(circle.scale, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(circle.scale, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        )
      )
    );

    // Execute all animations
    backgroundAnimation.start();
    logoAnimation.start(() => {
      textAnimation.start();
      progressAnimation.start();
    });
    circleAnimations.start();

    // Complete splash screen
    setTimeout(() => {
      onAnimationComplete();
    }, 3000);

    return () => {
      circleAnimations.stop();
    };
  }, []);

  const rotationInterpolation = logoRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressInterpolation = progressWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Animated background */}
      <Animated.View
        style={[
          styles.backgroundContainer,
          {
            transform: [{ scale: backgroundScale }],
          },
        ]}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2', '#f093fb']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Animated circles */}
      {circles.map((circle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.circle,
            {
              width: 100 + index * 50,
              height: 100 + index * 50,
              borderRadius: (100 + index * 50) / 2,
              transform: [{ scale: circle.scale }],
              opacity: circle.opacity,
            },
          ]}
        />
      ))}

      {/* Main content */}
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [
                { scale: logoScale },
                { rotate: rotationInterpolation },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['#ffffff', '#f0f0f0']}
            style={styles.logoGradient}
          >
            <Ionicons name="checkmark-circle" size={70} color="#667eea" />
          </LinearGradient>
        </Animated.View>

        {/* Text content */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
            },
          ]}
        >
          <Text style={styles.title}>Habit Tracker</Text>
          <Text style={styles.subtitle}>Transform your life, one habit at a time</Text>
        </Animated.View>

        {/* Progress bar */}
        <Animated.View
          style={[
            styles.progressContainer,
            {
              opacity: textOpacity,
            },
          ]}
        >
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressInterpolation,
                },
              ]}
            />
          </View>
          <Text style={styles.loadingText}>Loading your journey...</Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundContainer: {
    position: 'absolute',
    left: -width * 0.1,
    right: -width * 0.1,
    top: -height * 0.1,
    bottom: -height * 0.1,
  },
  gradient: {
    flex: 1,
  },
  circle: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logoGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 15,
    },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 15,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '300',
    letterSpacing: 0.5,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  progressContainer: {
    alignItems: 'center',
    width: 250,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400',
    letterSpacing: 0.5,
  },
});

export default ModernSplashScreen;
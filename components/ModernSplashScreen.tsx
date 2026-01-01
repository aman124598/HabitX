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
    textAnimation.start();
    progressAnimation.start();
    circleAnimations.start();

    // Complete splash screen
    setTimeout(() => {
      onAnimationComplete();
    }, 3000);

    return () => {
      circleAnimations.stop();
    };
  }, []);



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
          <View style={styles.brandContainer}>
            <Text style={styles.title}>HABIT</Text>
            <LinearGradient
              colors={['#8B5CF6', '#06B6D4']}
              style={styles.xContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.titleX}>X</Text>
            </LinearGradient>
          </View>
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
  textContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  xContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 6,
  },
  titleX: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 2,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 4,
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
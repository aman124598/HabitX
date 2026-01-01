import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, StatusBar, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Theme from '../lib/theme';

const { width, height } = Dimensions.get('window');

interface Props {
  onFinish: () => void;
  duration?: number;
}

const FirstInstallLogo: React.FC<Props> = ({ onFinish, duration = 2800 }) => {
  // Main animations
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotation = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.5)).current;
  
  // Text animations
  const habitOpacity = useRef(new Animated.Value(0)).current;
  const habitTranslateX = useRef(new Animated.Value(-50)).current;
  const xOpacity = useRef(new Animated.Value(0)).current;
  const xScale = useRef(new Animated.Value(0)).current;
  const xRotation = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(20)).current;
  
  // Background animations
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const orb1Scale = useRef(new Animated.Value(0)).current;
  const orb2Scale = useRef(new Animated.Value(0)).current;
  const orb3Scale = useRef(new Animated.Value(0)).current;
  
  // Sparkle animations
  const sparkles = useRef(
    Array.from({ length: 8 }, () => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
      rotation: new Animated.Value(0),
    }))
  ).current;

  // Exit animation
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const containerScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance sequence
    const entranceSequence = Animated.sequence([
      // Background fade in
      Animated.timing(bgOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),

      // Orbs entrance
      Animated.stagger(100, [
        Animated.spring(orb1Scale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.spring(orb2Scale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.spring(orb3Scale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      ]),

      // Logo entrance with rotation
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotation, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),

      // Glow effect
      Animated.parallel([
        Animated.timing(glowOpacity, { toValue: 0.8, duration: 300, useNativeDriver: true }),
        Animated.spring(glowScale, { toValue: 1.3, tension: 50, friction: 8, useNativeDriver: true }),
      ]),

      // "HABIT" text slides in
      Animated.parallel([
        Animated.timing(habitOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(habitTranslateX, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
      ]),

      // "X" bounces in with rotation
      Animated.parallel([
        Animated.spring(xScale, { toValue: 1, tension: 100, friction: 8, useNativeDriver: true }),
        Animated.timing(xOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(xRotation, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.back(2)),
          useNativeDriver: true,
        }),
      ]),

      // Sparkle effects
      Animated.stagger(50, sparkles.map(sparkle =>
        Animated.parallel([
          Animated.sequence([
            Animated.timing(sparkle.scale, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.timing(sparkle.scale, { toValue: 0, duration: 400, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(sparkle.opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.timing(sparkle.opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
          ]),
          Animated.timing(sparkle.rotation, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      )),

      // Tagline entrance
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(taglineTranslateY, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
      ]),
    ]);

    // Glow pulse animation
    const glowPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
      ])
    );

    // Exit animation
    const exitAnimation = Animated.parallel([
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(containerScale, {
        toValue: 1.1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]);

    // Start entrance
    entranceSequence.start(() => {
      glowPulse.start();

      // Wait and then exit
      setTimeout(() => {
        glowPulse.stop();
        exitAnimation.start(() => {
          onFinish();
        });
      }, duration);
    });

    return () => {
      glowPulse.stop();
    };
  }, []);

  const logoRotationValue = logoRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['-180deg', '0deg'],
  });

  const xRotationValue = xRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['-90deg', '0deg'],
  });

  const renderSparkles = () => {
    const positions = [
      { top: -40, left: -40 },
      { top: -30, right: -40 },
      { top: 30, left: -50 },
      { top: 40, right: -50 },
      { bottom: -40, left: 0 },
      { bottom: -30, right: 0 },
      { top: 0, left: -60 },
      { top: 0, right: -60 },
    ];

    return sparkles.map((sparkle, index) => {
      const rotation = sparkle.rotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
      });

      return (
        <Animated.View
          key={index}
          style={[
            styles.sparkle,
            positions[index],
            {
              transform: [{ scale: sparkle.scale }, { rotate: rotation }],
              opacity: sparkle.opacity,
            },
          ]}
        >
          <Ionicons name="sparkles" size={16} color="#F59E0B" />
        </Animated.View>
      );
    });
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: containerOpacity,
          transform: [{ scale: containerScale }],
        },
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background */}
      <Animated.View style={[styles.background, { opacity: bgOpacity }]}>
        <LinearGradient
          colors={['#0F0F1A', '#1a1a2e', '#16213e']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Decorative orbs */}
      <Animated.View
        style={[
          styles.orb,
          styles.orb1,
          { transform: [{ scale: orb1Scale }] },
        ]}
      />
      <Animated.View
        style={[
          styles.orb,
          styles.orb2,
          { transform: [{ scale: orb2Scale }] },
        ]}
      />
      <Animated.View
        style={[
          styles.orb,
          styles.orb3,
          { transform: [{ scale: orb3Scale }] },
        ]}
      />

      {/* Logo section */}
      <View style={styles.logoSection}>
        {/* Glow effect */}
        <Animated.View
          style={[
            styles.logoGlow,
            {
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            },
          ]}
        />

        {/* Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }, { rotate: logoRotationValue }],
            },
          ]}
        >
          <LinearGradient
            colors={['#8B5CF6', '#A78BFA', '#C4B5FD']}
            style={styles.logoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.logoInner}>
              <Text style={styles.logoLetter}>H</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Sparkles */}
        {renderSparkles()}
      </View>

      {/* Brand name */}
      <View style={styles.brandContainer}>
        <Animated.Text
          style={[
            styles.habitText,
            {
              opacity: habitOpacity,
              transform: [{ translateX: habitTranslateX }],
            },
          ]}
        >
          HABIT
        </Animated.Text>
        <Animated.View
          style={[
            styles.xContainer,
            {
              opacity: xOpacity,
              transform: [{ scale: xScale }, { rotate: xRotationValue }],
            },
          ]}
        >
          <LinearGradient
            colors={['#8B5CF6', '#06B6D4']}
            style={styles.xGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.xText}>X</Text>
          </LinearGradient>
        </Animated.View>
      </View>

      {/* Tagline */}
      <Animated.Text
        style={[
          styles.tagline,
          {
            opacity: taglineOpacity,
            transform: [{ translateY: taglineTranslateY }],
          },
        ]}
      >
        Build Better Habits
      </Animated.Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  gradient: {
    flex: 1,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orb1: {
    width: 350,
    height: 350,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    top: -100,
    left: -120,
  },
  orb2: {
    width: 280,
    height: 280,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    bottom: 50,
    right: -100,
  },
  orb3: {
    width: 200,
    height: 200,
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
    bottom: -60,
    left: -60,
  },
  logoSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  logoGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 60,
  },
  logoContainer: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  logoGradient: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
  },
  logoInner: {
    width: '100%',
    height: '100%',
    borderRadius: 65,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontSize: 72,
    fontWeight: '800',
    color: '#A78BFA',
    letterSpacing: -3,
  },
  sparkle: {
    position: 'absolute',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  habitText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 8,
  },
  xContainer: {
    marginLeft: 8,
  },
  xGradient: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  xText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: '500',
    letterSpacing: 2,
  },
});

export default FirstInstallLogo;

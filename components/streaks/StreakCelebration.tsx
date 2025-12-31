import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Pressable, TouchableWithoutFeedback } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../Themed';
import Theme from '../../lib/theme';

const { width, height } = Dimensions.get('window');

interface StreakCelebrationProps {
  streakCount: number;
  onContinue: () => void;
  weekProgress?: { day: string; completed: boolean }[];
  perfectStreakDay?: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  delay: number;
  rotation: number;
}

export default function StreakCelebration({ 
  streakCount, 
  onContinue, 
  weekProgress = [],
  perfectStreakDay = 'Saturday'
}: StreakCelebrationProps) {
  const flameScale = useRef(new Animated.Value(0)).current;
  const flameFloat = useRef(new Animated.Value(0)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const buttonSlide = useRef(new Animated.Value(100)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;
  const confettiAnimations = useRef<Animated.Value[]>([]).current;
  
  // Generate confetti particles
  const particles: Particle[] = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * width,
    y: -100 - Math.random() * 200,
    color: ['#FF6B6B', '#FFA500', '#FBBF24', '#4ECDC4', '#A78BFA', '#EC4899'][Math.floor(Math.random() * 6)],
    size: 8 + Math.random() * 12,
    delay: Math.random() * 2000,
    rotation: Math.random() * 360,
  }));

  useEffect(() => {
    // Initialize confetti animations
    particles.forEach(() => {
      confettiAnimations.push(new Animated.Value(0));
    });

    // Main entrance sequence
    Animated.sequence([
      Animated.parallel([
        // Flame pop-in with bounce
        Animated.spring(flameScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 40,
          friction: 5,
          delay: 100,
        }),
        // Glow pulse
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          delay: 100,
        }),
      ]),
      // Text fade in
      Animated.timing(textFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous floating animation for flame
    Animated.loop(
      Animated.sequence([
        Animated.timing(flameFloat, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(flameFloat, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Continuous glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1.2,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Button slide in
    Animated.spring(buttonSlide, {
      toValue: 0,
      delay: 800,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();

    // Confetti animations
    confettiAnimations.forEach((anim, index) => {
      Animated.loop(
        Animated.timing(anim, {
          toValue: 1,
          duration: 3000 + Math.random() * 2000,
          delay: particles[index].delay,
          useNativeDriver: true,
        })
      ).start();
    });
  }, []);

  const floatTranslate = flameFloat.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 8],
  });

  const glowScale = glowPulse.interpolate({
    inputRange: [0, 1, 1.2],
    outputRange: [1, 1.1, 1.15],
  });

  // Default week progress if not provided
  const defaultWeekProgress = [
    { day: 'Su', completed: true },
    { day: 'Mo', completed: false },
    { day: 'Tu', completed: false },
    { day: 'We', completed: false },
    { day: 'Th', completed: false },
    { day: 'Fr', completed: false },
    { day: 'Sa', completed: false },
  ];

  const displayWeekProgress = weekProgress.length > 0 ? weekProgress : defaultWeekProgress;

  // Calculate XP earned
  const xpEarned = streakCount >= 7 ? 25 : 10;

  return (
    <TouchableWithoutFeedback onPress={onContinue}>
      <View style={styles.container}>
        {/* Dark Background with Gradient */}
        <LinearGradient
          colors={['#0F172A', '#1E293B', '#1E293B']}
          style={StyleSheet.absoluteFill}
        />

        {/* Confetti Particles */}
        {particles.map((particle, index) => {
          const translateY = confettiAnimations[index]?.interpolate({
            inputRange: [0, 1],
            outputRange: [particle.y, height + 100],
          }) || new Animated.Value(0);

          const rotate = confettiAnimations[index]?.interpolate({
            inputRange: [0, 1],
            outputRange: [`${particle.rotation}deg`, `${particle.rotation + 720}deg`],
          }) || new Animated.Value(0);

          const opacity = confettiAnimations[index]?.interpolate({
            inputRange: [0, 0.7, 1],
            outputRange: [1, 1, 0],
          }) || new Animated.Value(1);

          return (
            <Animated.View
              key={particle.id}
              style={[
                styles.confetti,
                {
                  left: particle.x,
                  width: particle.size,
                  height: particle.size * 1.5,
                  backgroundColor: particle.color,
                  transform: [
                    { translateY },
                    { rotate },
                  ],
                  opacity,
                  borderRadius: particle.size / 3,
                },
              ]}
            />
          );
        })}

        {/* Main Content */}
        <View style={styles.content}>
          {/* Top Badge - Blue Circle */}
          <Animated.View 
            style={[
              styles.topBadge,
              {
                transform: [{ scale: flameScale }],
                opacity: textFade,
              }
            ]}
          >
            <LinearGradient
              colors={['#60A5FA', '#3B82F6', '#2563EB']}
              style={styles.topBadgeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            >
              <View style={styles.topBadgeInner} />
            </LinearGradient>
          </Animated.View>

          {/* "PERFECT DAY!" Title */}
          <Animated.View style={{ opacity: textFade }}>
            <Text style={styles.perfectDayTitle}>
              PERFECT
            </Text>
            <Text style={styles.perfectDayTitle}>
              DAY!
            </Text>
          </Animated.View>

          {/* Subtitle */}
          <Animated.View style={[styles.subtitleContainer, { opacity: textFade }]}>
            <Text style={styles.subtitle}>
              Complete all habits in a single day
            </Text>
          </Animated.View>

          {/* Center XP Badge with Flames */}
          <Animated.View 
            style={[
              styles.xpContainer,
              {
                transform: [
                  { scale: flameScale },
                  { translateY: floatTranslate },
                ],
              }
            ]}
          >
            {/* Left Flame */}
            <Animated.View 
              style={[
                styles.sideFlame,
                {
                  opacity: glowPulse,
                  transform: [
                    { 
                      scale: glowPulse.interpolate({
                        inputRange: [0, 1, 1.2],
                        outputRange: [0.8, 1, 1.1],
                      })
                    }
                  ]
                }
              ]}
            >
              <Ionicons name="flame" size={70} color="#FF6B35" />
            </Animated.View>

            {/* XP Badge */}
            <LinearGradient
              colors={['#60A5FA', '#3B82F6']}
              style={styles.xpBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            >
              <Text style={styles.xpValue}>+{xpEarned}</Text>
              <Text style={styles.xpLabel}>XP</Text>
            </LinearGradient>

            {/* Right Flame */}
            <Animated.View 
              style={[
                styles.sideFlame,
                {
                  opacity: glowPulse,
                  transform: [
                    { 
                      scale: glowPulse.interpolate({
                        inputRange: [0, 1, 1.2],
                        outputRange: [0.8, 1, 1.1],
                      })
                    }
                  ]
                }
              ]}
            >
              <Ionicons name="flame" size={70} color="#FF6B35" />
            </Animated.View>
          </Animated.View>

          {/* Bottom Text - "Tap anywhere to continue" */}
          <Animated.View 
            style={[
              styles.tapToContinue,
              {
                opacity: textFade,
                transform: [{ translateY: buttonSlide }],
              }
            ]}
          >
            <Text style={styles.tapText}>
              ✨ Tap anywhere to continue ✨
            </Text>
          </Animated.View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width,
    height,
    backgroundColor: '#1E293B',
  },

  confetti: {
    position: 'absolute',
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: 60,
    zIndex: 2,
  },

  topBadge: {
    marginBottom: Theme.spacing.xl,
    marginTop: -60,
  },

  topBadgeGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },

  topBadgeInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  perfectDayTitle: {
    fontSize: 64,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -1,
    lineHeight: 68,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },

  subtitleContainer: {
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.xxxl,
  },

  subtitle: {
    fontSize: 16,
    color: '#CBD5E1',
    textAlign: 'center',
    fontWeight: '500',
  },

  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.xxxl,
    gap: Theme.spacing.lg,
  },

  sideFlame: {
    transform: [{ rotate: '-15deg' }],
  },

  xpBadge: {
    width: 180,
    height: 180,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 20,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  xpValue: {
    fontSize: 72,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 72,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  xpLabel: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: -8,
    opacity: 0.95,
  },

  tapToContinue: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
  },

  tapText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '600',
    textAlign: 'center',
  },
});

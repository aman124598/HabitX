import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Modal,
  Text,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../lib/themeContext';
import { Theme } from '../../lib/theme';

interface StreakCelebrationProps {
  visible: boolean;
  streakDays: number;
  habitName: string;
  onClose: () => void;
}

interface FireParticleProps {
  delay: number;
  duration: number;
  size: number;
  startX: number;
  startY: number;
  intensity: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const FireParticle: React.FC<FireParticleProps> = ({ 
  delay, 
  duration, 
  size, 
  startX, 
  startY,
  intensity
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0)).current;
  const flickerValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const startAnimation = () => {
      // Reset values
      animatedValue.setValue(0);
      scaleValue.setValue(0);
      flickerValue.setValue(1);

      // Flicker animation for realistic fire effect
      const flicker = () => {
        Animated.sequence([
          Animated.timing(flickerValue, {
            toValue: 0.7 + Math.random() * 0.3,
            duration: 80 + Math.random() * 40,
            useNativeDriver: true,
          }),
          Animated.timing(flickerValue, {
            toValue: 1,
            duration: 80 + Math.random() * 40,
            useNativeDriver: true,
          }),
        ]).start(() => flicker());
      };
      flicker();

      // Main animation
      Animated.parallel([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: duration,
          delay: delay,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.spring(scaleValue, {
            toValue: 1.2,
            delay: delay,
            tension: 100,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 0,
            duration: duration * 0.7,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    };

    startAnimation();
  }, [animatedValue, scaleValue, flickerValue, delay, duration]);

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -screenHeight * 0.8],
  });

  const translateX = animatedValue.interpolate({
    inputRange: [0, 0.3, 0.7, 1],
    outputRange: [0, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 100],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.1, 0.8, 1],
    outputRange: [0, 1, 1, 0],
  });

  const getFireColor = () => {
    const colors = ['#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#FF1493'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <Animated.View
      style={[
        styles.fireParticle,
        {
          transform: [
            { translateX },
            { translateY },
            { scale: Animated.multiply(scaleValue, flickerValue) },
          ],
          opacity,
          left: startX,
          top: startY,
        },
      ]}
    >
      <Ionicons 
        name="flame"
        size={size} 
        color={getFireColor()}
        style={{
          textShadowColor: '#FF4500',
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 15,
        }}
      />
    </Animated.View>
  );
};

export function StreakCelebration({ 
  visible, 
  streakDays, 
  habitName,
  onClose 
}: StreakCelebrationProps) {
  const { colors } = useTheme();
  const [fireParticles, setFireParticles] = useState<FireParticleProps[]>([]);
  
  // Main animations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const fireScaleAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  // Text animations
  const titleSlideAnim = useRef(new Animated.Value(-100)).current;
  const streakNumberAnim = useRef(new Animated.Value(0)).current;
  const habitNameSlideAnim = useRef(new Animated.Value(100)).current;
  
  // Fire icon animation
  const fireRotateAnim = useRef(new Animated.Value(0)).current;
  const firePulseAnim = useRef(new Animated.Value(1)).current;

  const getMilestoneInfo = () => {
    if (streakDays >= 365) return { title: "LEGENDARY STREAK!", color: '#9932CC', icon: 'trophy' };
    if (streakDays >= 100) return { title: "CENTURY STREAK!", color: '#FFD700', icon: 'star' };
    if (streakDays >= 50) return { title: "GOLDEN STREAK!", color: '#FFA500', icon: 'medal' };
    if (streakDays >= 30) return { title: "MONTHLY MASTER!", color: '#FF69B4', icon: 'ribbon' };
    if (streakDays >= 14) return { title: "TWO WEEK WARRIOR!", color: '#00CED1', icon: 'flash' };
    if (streakDays >= 7) return { title: "WEEK CHAMPION!", color: '#32CD32', icon: 'checkmark-circle' };
    return { title: "STREAK POWER!", color: '#FF4500', icon: 'flame' };
  };

  useEffect(() => {
    if (visible) {
      // Generate fire particles based on streak days
      const particleCount = Math.min(15 + Math.floor(streakDays / 5), 30);
      const newParticles: FireParticleProps[] = [];

      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          delay: Math.random() * 1000,
          duration: 1500 + Math.random() * 1000,
          size: 25 + Math.random() * 35,
          startX: (screenWidth / 2 - 150) + Math.random() * 300,
          startY: screenHeight - 100 + Math.random() * 100,
          intensity: Math.min(streakDays / 10, 10),
        });
      }

      setFireParticles(newParticles);

      // Dramatic entrance sequence
      const entranceSequence = Animated.sequence([
        // Screen shake effect
        Animated.parallel([
          Animated.timing(shakeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        
        // Main content scale up
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }),
        
        // Fire icon dramatic entrance
        Animated.parallel([
          Animated.spring(fireScaleAnim, {
            toValue: 1,
            tension: 60,
            friction: 4,
            useNativeDriver: true,
          }),
          Animated.timing(fireRotateAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        
        // Title slide in
        Animated.spring(titleSlideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        
        // Streak number count up
        Animated.timing(streakNumberAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        
        // Habit name slide in
        Animated.spring(habitNameSlideAnim, {
          toValue: 0,
          tension: 70,
          friction: 9,
          useNativeDriver: true,
        }),
      ]);

      entranceSequence.start();

      // Continuous fire pulse
      const firePulse = () => {
        Animated.sequence([
          Animated.timing(firePulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(firePulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (visible) firePulse();
        });
      };
      firePulse();

      // Continuous glow effect
      const glow = () => {
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.4,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (visible) glow();
        });
      };
      glow();

      // Auto close after 4 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 4500);

      return () => clearTimeout(timer);
    }
  }, [visible, streakDays]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      // Reset all animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      fireScaleAnim.setValue(0);
      shakeAnim.setValue(0);
      glowAnim.setValue(0);
      titleSlideAnim.setValue(-100);
      streakNumberAnim.setValue(0);
      habitNameSlideAnim.setValue(100);
      fireRotateAnim.setValue(0);
      firePulseAnim.setValue(1);
    });
  };

  if (!visible) return null;

  const milestone = getMilestoneInfo();
  const [currentStreakValue, setCurrentStreakValue] = useState(0);

  useEffect(() => {
    if (visible) {
      const listener = streakNumberAnim.addListener(({ value }) => {
        setCurrentStreakValue(Math.round(value * streakDays));
      });
      return () => streakNumberAnim.removeListener(listener);
    }
  }, [visible, streakDays, streakNumberAnim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <BlurView intensity={25} style={styles.blurOverlay}>
          {/* Background gradient */}
          <LinearGradient
            colors={['rgba(255,69,0,0.3)', 'rgba(0,0,0,0.7)', 'rgba(255,69,0,0.3)']}
            style={StyleSheet.absoluteFillObject}
          />
          
          {/* Fire particles */}
          {fireParticles.map((particle: FireParticleProps, index: number) => (
            <FireParticle key={index} {...particle} />
          ))}

          {/* Main Content */}
          <Animated.View
            style={[
              styles.content,
              {
                transform: [
                  { scale: scaleAnim },
                  { 
                    translateX: shakeAnim.interpolate({
                      inputRange: [0, 0.25, 0.5, 0.75, 1],
                      outputRange: [0, -10, 10, -5, 0],
                    })
                  },
                ],
                opacity: fadeAnim,
              },
            ]}
          >
            {/* Fire Icon */}
            <Animated.View
              style={[
                styles.fireIconContainer,
                {
                  transform: [
                    { scale: Animated.multiply(fireScaleAnim, firePulseAnim) },
                    { 
                      rotate: fireRotateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      })
                    }
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={['#FF4500', '#FF6347', '#FFD700']}
                style={styles.fireIconGradient}
              >
                <Ionicons name="flame" size={80} color="#FFFFFF" />
              </LinearGradient>
              
              {/* Fire glow */}
              <Animated.View
                style={[
                  styles.fireGlow,
                  {
                    opacity: glowAnim,
                    backgroundColor: milestone.color,
                  }
                ]}
              />
            </Animated.View>

            {/* Title */}
            <Animated.View
              style={{
                transform: [{ translateY: titleSlideAnim }],
              }}
            >
              <LinearGradient
                colors={[milestone.color, '#FFD700']}
                style={styles.titleGradient}
              >
                <Text style={styles.title}>{milestone.title}</Text>
              </LinearGradient>
            </Animated.View>

            {/* Streak Counter */}
            <View style={styles.streakContainer}>
              <LinearGradient
                colors={['#FF4500', '#FFD700', '#FF4500']}
                style={styles.streakBadge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.streakNumber}>{currentStreakValue}</Text>
                <Text style={styles.streakLabel}>DAY{streakDays !== 1 ? 'S' : ''}</Text>
                
                {/* Shine effect */}
                <Animated.View
                  style={[
                    styles.streakShine,
                    {
                      opacity: glowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.8],
                      })
                    }
                  ]}
                />
              </LinearGradient>
            </View>

            {/* Habit Name */}
            <Animated.View
              style={[
                styles.habitNameContainer,
                {
                  transform: [{ translateY: habitNameSlideAnim }],
                },
              ]}
            >
              <Text style={[styles.habitName, { color: colors.text.primary }]}>
                "{habitName}"
              </Text>
              <Text style={[styles.habitSubtext, { color: colors.text.secondary }]}>
                Keep the fire burning! 🔥
              </Text>
            </Animated.View>

            {/* Close Hint */}
            <Pressable onPress={handleClose} style={styles.closeHint}>
              <LinearGradient
                colors={['rgba(255,69,0,0.2)', 'rgba(255,215,0,0.1)']}
                style={styles.closeHintGradient}
              >
                <Animated.Text 
                  style={[
                    styles.closeHintText,
                    {
                      opacity: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.8],
                      }),
                      color: colors.text.secondary,
                    }
                  ]}
                >
                  🔥 Tap to keep the streak alive! 🔥
                </Animated.Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </BlurView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blurOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fireParticle: {
    position: 'absolute',
    zIndex: 1,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Theme.spacing.xl,
    zIndex: 10,
  },
  fireIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.xl,
    position: 'relative',
  },
  fireIconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#FF4500',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
  },
  fireGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 80,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 10,
  },
  titleGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.lg,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
    letterSpacing: 2,
    lineHeight: 42,
  },
  streakContainer: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
  },
  streakBadge: {
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 1,
    lineHeight: 52,
  },
  streakLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    opacity: 0.95,
    marginTop: -8,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  streakShine: {
    position: 'absolute',
    top: 0,
    left: -100,
    width: 40,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    transform: [{ skewX: '-20deg' }],
  },
  habitNameContainer: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
    paddingHorizontal: Theme.spacing.lg,
  },
  habitName: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Theme.spacing.sm,
    letterSpacing: 1,
    lineHeight: 28,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  habitSubtext: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.9,
    letterSpacing: 0.5,
  },
  closeHint: {
    marginTop: Theme.spacing.lg,
    borderRadius: 25,
    overflow: 'hidden',
  },
  closeHintGradient: {
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.xl,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 0, 0.3)',
  },
  closeHintText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
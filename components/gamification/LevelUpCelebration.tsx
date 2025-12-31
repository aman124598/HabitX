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

interface LevelUpCelebrationProps {
  visible: boolean;
  oldLevel: number;
  newLevel: number;
  xpGained: number;
  onClose: () => void;
}

interface StarParticleProps {
  delay: number;
  duration: number;
  size: number;
  startX: number;
  startY: number;
  color: string;
  animationType: 'spiral' | 'burst' | 'float';
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const StarParticle: React.FC<StarParticleProps> = ({ 
  delay, 
  duration, 
  size, 
  startX, 
  startY,
  color,
  animationType
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0)).current;
  const sparkleValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Reset values
    animatedValue.setValue(0);
    scaleValue.setValue(0);
    sparkleValue.setValue(1);

    // Sparkle effect
    const sparkle = () => {
      Animated.sequence([
        Animated.timing(sparkleValue, {
          toValue: 0.3 + Math.random() * 0.7,
          duration: 200 + Math.random() * 300,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleValue, {
          toValue: 1,
          duration: 200 + Math.random() * 300,
          useNativeDriver: true,
        }),
      ]).start(() => sparkle());
    };
    sparkle();

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
          toValue: 1.5,
          delay: delay,
          tension: 80,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 0,
          duration: duration * 0.6,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [animatedValue, scaleValue, sparkleValue, delay, duration]);

  const getTransform = () => {
    switch (animationType) {
      case 'spiral':
        return {
          translateX: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, Math.cos(Math.random() * Math.PI * 4) * 150],
          }),
          translateY: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -screenHeight * 0.6 + Math.sin(Math.random() * Math.PI * 4) * 100],
          }),
        };
      case 'burst':
        const angle = Math.random() * Math.PI * 2;
        const distance = 100 + Math.random() * 200;
        return {
          translateX: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, Math.cos(angle) * distance],
          }),
          translateY: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, Math.sin(angle) * distance - 50],
          }),
        };
      case 'float':
        return {
          translateX: animatedValue.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 160],
          }),
          translateY: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -screenHeight * 0.7],
          }),
        };
    }
  };

  const transform = getTransform();
  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.1, 0.7, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <Animated.View
      style={[
        styles.starParticle,
        {
          transform: [
            { translateX: transform.translateX },
            { translateY: transform.translateY },
            { scale: Animated.multiply(scaleValue, sparkleValue) },
          ],
          opacity,
          left: startX,
          top: startY,
        },
      ]}
    >
      <Ionicons 
        name="star"
        size={size} 
        color={color}
        style={{
          textShadowColor: color,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 10,
        }}
      />
    </Animated.View>
  );
};

export function LevelUpCelebration({ 
  visible, 
  oldLevel, 
  newLevel,
  xpGained,
  onClose 
}: LevelUpCelebrationProps) {
  const { colors } = useTheme();
  const [starParticles, setStarParticles] = useState<StarParticleProps[]>([]);
  
  // Main animations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const crownScaleAnim = useRef(new Animated.Value(0)).current;
  const explosionAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  // Level animations
  const oldLevelScaleAnim = useRef(new Animated.Value(1)).current;
  const newLevelScaleAnim = useRef(new Animated.Value(0)).current;
  const levelTransitionAnim = useRef(new Animated.Value(0)).current;
  
  // Text animations
  const titleSlideAnim = useRef(new Animated.Value(-200)).current;
  const xpCounterAnim = useRef(new Animated.Value(0)).current;
  const buttonFadeAnim = useRef(new Animated.Value(0)).current;
  
  // Crown rotation
  const crownRotateAnim = useRef(new Animated.Value(0)).current;

  const getLevelColors = (level: number) => {
    if (level >= 50) return ['#9932CC', '#FFD700', '#FF1493']; // Legendary
    if (level >= 30) return ['#FF69B4', '#FFD700', '#FF4500']; // Epic
    if (level >= 20) return ['#4169E1', '#00CED1', '#32CD32']; // Rare
    if (level >= 10) return ['#32CD32', '#FFD700']; // Uncommon
    return ['#87CEEB', '#FFA500']; // Common
  };

  const getLevelTitle = (level: number) => {
    if (level >= 50) return "LEGEND ACHIEVED!";
    if (level >= 30) return "EPIC MILESTONE!";
    if (level >= 20) return "RARE ACHIEVEMENT!";
    if (level >= 10) return "GREAT PROGRESS!";
    return "LEVEL UP!";
  };

  useEffect(() => {
    if (visible) {
      // Generate star particles
      const particleCount = Math.min(20 + Math.floor(newLevel / 5), 40);
      const newParticles: StarParticleProps[] = [];
      const starColors = ['#FFD700', '#FFA500', '#FF69B4', '#00CED1', '#32CD32', '#9932CC'];

      for (let i = 0; i < particleCount; i++) {
        const animationTypes: StarParticleProps['animationType'][] = ['spiral', 'burst', 'float'];
        newParticles.push({
          delay: Math.random() * 1500,
          duration: 2000 + Math.random() * 1500,
          size: 20 + Math.random() * 30,
          startX: (screenWidth / 2 - 200) + Math.random() * 400,
          startY: (screenHeight / 2 - 100) + Math.random() * 200,
          color: starColors[Math.floor(Math.random() * starColors.length)],
          animationType: animationTypes[Math.floor(Math.random() * animationTypes.length)],
        });
      }

      setStarParticles(newParticles);

      // Dramatic level up sequence
      const levelUpSequence = Animated.sequence([
        // Initial explosion effect
        Animated.parallel([
          Animated.timing(explosionAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        
        // Main content scale up
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 70,
          friction: 5,
          useNativeDriver: true,
        }),
        
        // Title dramatic entrance
        Animated.spring(titleSlideAnim, {
          toValue: 0,
          tension: 90,
          friction: 7,
          useNativeDriver: true,
        }),
        
        // Old level shrink out
        Animated.timing(oldLevelScaleAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        
        // Level transition
        Animated.timing(levelTransitionAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
        
        // New level scale in
        Animated.spring(newLevelScaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 4,
          useNativeDriver: true,
        }),
        
        // Crown entrance
        Animated.parallel([
          Animated.spring(crownScaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 3,
            useNativeDriver: true,
          }),
          Animated.timing(crownRotateAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        
        // XP counter
        Animated.timing(xpCounterAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: false,
        }),
        
        // Button fade in
        Animated.timing(buttonFadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]);

      levelUpSequence.start();

      // Continuous glow effect
      const glow = () => {
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (visible) glow();
        });
      };
      glow();

      // Auto close after 6 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 6000);

      return () => clearTimeout(timer);
    }
  }, [visible, newLevel]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      // Reset all animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      crownScaleAnim.setValue(0);
      explosionAnim.setValue(0);
      glowAnim.setValue(0);
      oldLevelScaleAnim.setValue(1);
      newLevelScaleAnim.setValue(0);
      levelTransitionAnim.setValue(0);
      titleSlideAnim.setValue(-200);
      xpCounterAnim.setValue(0);
      buttonFadeAnim.setValue(0);
      crownRotateAnim.setValue(0);
    });
  };

  if (!visible) return null;

  const levelColors = getLevelColors(newLevel);
  const title = getLevelTitle(newLevel);
  const [currentXP, setCurrentXP] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(oldLevel);

  useEffect(() => {
    if (visible) {
      const xpListener = xpCounterAnim.addListener(({ value }) => {
        setCurrentXP(Math.round(value * xpGained));
      });
      
      const levelListener = levelTransitionAnim.addListener(({ value }) => {
        if (value > 0.5 && currentLevel === oldLevel) {
          setCurrentLevel(newLevel);
        }
      });

      return () => {
        xpCounterAnim.removeListener(xpListener);
        levelTransitionAnim.removeListener(levelListener);
      };
    }
  }, [visible, xpGained, oldLevel, newLevel, currentLevel]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <BlurView intensity={30} style={styles.blurOverlay}>
          {/* Background gradient */}
          <LinearGradient
            colors={[
              'rgba(75,0,130,0.4)', 
              'rgba(0,0,0,0.8)', 
              'rgba(255,215,0,0.3)',
              'rgba(0,0,0,0.8)',
              'rgba(138,43,226,0.4)'
            ]}
            style={StyleSheet.absoluteFillObject}
          />
          
          {/* Star particles */}
          {starParticles.map((particle: StarParticleProps, index: number) => (
            <StarParticle key={index} {...particle} />
          ))}

          {/* Explosion effect */}
          <Animated.View
            style={[
              styles.explosionEffect,
              {
                opacity: explosionAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 1, 0],
                }),
                transform: [{
                  scale: explosionAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 3],
                  })
                }],
              },
            ]}
          >
            <LinearGradient
              colors={levelColors}
              style={styles.explosionGradient}
            />
          </Animated.View>

          {/* Main Content */}
          <Animated.View
            style={[
              styles.content,
              {
                transform: [{ scale: scaleAnim }],
                opacity: fadeAnim,
              },
            ]}
          >
            {/* Crown Icon */}
            <Animated.View
              style={[
                styles.crownContainer,
                {
                  transform: [
                    { scale: crownScaleAnim },
                    { 
                      rotate: crownRotateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['-180deg', '0deg'],
                      })
                    }
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={levelColors}
                style={styles.crownGradient}
              >
                <Ionicons name="diamond" size={60} color="#FFFFFF" />
              </LinearGradient>
              
              {/* Crown glow */}
              <Animated.View
                style={[
                  styles.crownGlow,
                  {
                    opacity: glowAnim,
                    shadowColor: levelColors[0],
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
                colors={levelColors}
                style={styles.titleGradient}
              >
                <Text style={styles.title}>{title}</Text>
              </LinearGradient>
            </Animated.View>

            {/* Level Transition */}
            <View style={styles.levelContainer}>
              <View style={styles.levelDisplay}>
                {/* Old Level */}
                <Animated.View
                  style={[
                    styles.levelBadge,
                    {
                      transform: [{ scale: oldLevelScaleAnim }],
                      opacity: oldLevelScaleAnim,
                    }
                  ]}
                >
                  <LinearGradient
                    colors={['#666', '#888']}
                    style={styles.levelBadgeGradient}
                  >
                    <Text style={styles.levelNumber}>{oldLevel}</Text>
                  </LinearGradient>
                </Animated.View>

                {/* Arrow */}
                <Animated.View
                  style={[
                    styles.levelArrow,
                    {
                      opacity: levelTransitionAnim,
                      transform: [{
                        translateX: levelTransitionAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-20, 0],
                        })
                      }]
                    }
                  ]}
                >
                  <Ionicons name="arrow-forward" size={24} color="#FFD700" />
                </Animated.View>

                {/* New Level */}
                <Animated.View
                  style={[
                    styles.levelBadge,
                    {
                      transform: [{ scale: newLevelScaleAnim }],
                    }
                  ]}
                >
                  <LinearGradient
                    colors={levelColors}
                    style={styles.levelBadgeGradient}
                  >
                    <Text style={styles.levelNumber}>{currentLevel}</Text>
                    
                    {/* Shine effect */}
                    <Animated.View
                      style={[
                        styles.levelShine,
                        {
                          opacity: glowAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 0.6],
                          })
                        }
                      ]}
                    />
                  </LinearGradient>
                </Animated.View>
              </View>
            </View>

            {/* XP Gained */}
            <View style={styles.xpContainer}>
              <LinearGradient
                colors={['rgba(255,215,0,0.3)', 'rgba(255,140,0,0.2)']}
                style={styles.xpBadge}
              >
                <Ionicons name="flash" size={20} color="#FFD700" />
                <Text style={[styles.xpText, { color: colors.text.primary }]}>
                  +{currentXP} XP
                </Text>
              </LinearGradient>
            </View>

            {/* Continue Button */}
            <Animated.View
              style={[
                styles.continueButton,
                { opacity: buttonFadeAnim }
              ]}
            >
              <Pressable onPress={handleClose}>
                <LinearGradient
                  colors={levelColors}
                  style={styles.continueButtonGradient}
                >
                  <Text style={styles.continueButtonText}>
                    Continue Your Journey! ✨
                  </Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
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
  starParticle: {
    position: 'absolute',
    zIndex: 1,
  },
  explosionEffect: {
    position: 'absolute',
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  explosionGradient: {
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.3,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Theme.spacing.xl,
    zIndex: 10,
  },
  crownContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.xl,
    position: 'relative',
  },
  crownGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  crownGlow: {
    position: 'absolute',
    top: -15,
    left: -15,
    right: -15,
    bottom: -15,
    borderRadius: 65,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 25,
    elevation: 8,
  },
  titleGradient: {
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.xl,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
    letterSpacing: 2,
    lineHeight: 38,
  },
  levelContainer: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
  },
  levelDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadgeGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  levelNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  levelShine: {
    position: 'absolute',
    top: 0,
    left: -30,
    width: 20,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    transform: [{ skewX: '-15deg' }],
  },
  levelArrow: {
    marginHorizontal: Theme.spacing.lg,
  },
  xpContainer: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  xpText: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  continueButton: {
    marginTop: Theme.spacing.lg,
  },
  continueButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    color: '#FFFFFF',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
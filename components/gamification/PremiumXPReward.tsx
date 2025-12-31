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

interface PremiumXPRewardProps {
  visible: boolean;
  xpAmount: number;
  title?: string;
  subtitle?: string;
  onClose: () => void;
  type?: 'standard' | 'milestone' | 'achievement' | 'streak';
}

interface ParticleProps {
  delay: number;
  duration: number;
  size: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  type: 'star' | 'diamond' | 'spark' | 'circle' | 'flame';
  color: string;
  physics?: 'float' | 'burst' | 'spiral' | 'orbit';
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const PremiumParticle: React.FC<ParticleProps> = ({ 
  delay, 
  duration, 
  size, 
  startX, 
  startY, 
  endX, 
  endY,
  type, 
  color,
  physics = 'float'
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0)).current;
  const rotateValue = useRef(new Animated.Value(0)).current;
  const glowValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnimation = () => {
      // Reset values
      animatedValue.setValue(0);
      scaleValue.setValue(0);
      rotateValue.setValue(0);
      glowValue.setValue(0);

      // Physics-based movement animations
      let moveAnimation;
      const baseTransformations = [
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
            tension: 120,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 0,
            duration: duration * 0.4,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(rotateValue, {
          toValue: physics === 'spiral' ? 3 : 1,
          duration: duration,
          delay: delay,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(glowValue, {
            toValue: 1,
            duration: duration * 0.3,
            useNativeDriver: true,
          }),
          Animated.timing(glowValue, {
            toValue: 0,
            duration: duration * 0.7,
            useNativeDriver: true,
          }),
        ]),
      ];

      Animated.parallel(baseTransformations).start();
    };

    startAnimation();
  }, [animatedValue, scaleValue, rotateValue, glowValue, delay, duration, physics]);

  const getTransforms = () => {
    let translateX, translateY;
    
    switch (physics) {
      case 'burst':
        translateX = animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, endX - startX],
        });
        translateY = animatedValue.interpolate({
          inputRange: [0, 0.7, 1],
          outputRange: [0, (endY - startY) * 0.5, endY - startY],
        });
        break;
        
      case 'spiral':
        translateX = animatedValue.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, (endX - startX) * 0.7, endX - startX],
        });
        translateY = animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, endY - startY],
        });
        break;
        
      case 'orbit':
        const radius = 100;
        const orbitAngle = Math.random() * Math.PI * 2;
        translateX = animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, radius * Math.cos(orbitAngle)],
        });
        translateY = animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, radius * Math.sin(orbitAngle) - screenHeight * 0.3],
        });
        break;
        
      default: // float
        translateX = animatedValue.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, (Math.random() - 0.5) * 60, endX - startX],
        });
        translateY = animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, endY - startY],
        });
    }

    const opacity = animatedValue.interpolate({
      inputRange: [0, 0.1, 0.8, 1],
      outputRange: [0, 1, 1, 0],
    });

    const rotate = rotateValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', physics === 'spiral' ? '1080deg' : '360deg'],
    });

    return {
      transform: [
        { translateX },
        { translateY },
        { scale: scaleValue },
        { rotate },
      ],
      opacity,
    };
  };

  const getIcon = () => {
    const iconMap = {
      star: 'star',
      diamond: 'diamond',
      spark: 'flash',
      circle: 'ellipse',
      flame: 'flame',
    };
    return iconMap[type] || 'star';
  };

  const getGlowStyle = () => ({
    position: 'absolute' as const,
    left: -size * 0.5,
    top: -size * 0.5,
    width: size * 2,
    height: size * 2,
    borderRadius: size,
    backgroundColor: color,
    opacity: glowValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.3],
    }),
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: startX,
          top: startY,
          ...getTransforms(),
        },
      ]}
    >
      <Animated.View style={getGlowStyle()} />
      <Ionicons 
        name={getIcon() as any}
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

export function PremiumXPReward({ 
  visible, 
  xpAmount, 
  title = "EXCELLENT!", 
  subtitle,
  onClose,
  type = 'standard'
}: PremiumXPRewardProps) {
  const { colors } = useTheme();
  const [particles, setParticles] = useState<ParticleProps[]>([]);
  
  // Main animations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const glowIntensity = useRef(new Animated.Value(0)).current;
  
  // Text animations
  const titleScaleAnim = useRef(new Animated.Value(0)).current;
  const titleRotateAnim = useRef(new Animated.Value(0)).current;
  const subtitleSlideAnim = useRef(new Animated.Value(100)).current;
  const subtitleOpacityAnim = useRef(new Animated.Value(0)).current;
  
  // XP Badge animations
  const xpBadgeScaleAnim = useRef(new Animated.Value(0)).current;
  const xpBadgeRotateAnim = useRef(new Animated.Value(0)).current;
  const xpCounterAnim = useRef(new Animated.Value(0)).current;
  
  // Ring animations
  const ringScaleAnim = useRef(new Animated.Value(0)).current;
  const ringOpacityAnim = useRef(new Animated.Value(0)).current;

  const getThemeConfig = () => {
    const configs = {
      standard: {
        colors: ['#FF6B35', '#FF8E53', '#FFA500', '#FFD700'],
        particleCount: 15,
        gradientColors: [colors.brand.primary, colors.brand.secondary],
        title: title || 'GREAT!',
      },
      milestone: {
        colors: ['#FFD700', '#FFA500', '#FF69B4', '#8A2BE2'],
        particleCount: 25,
        gradientColors: ['#FFD700', '#FF69B4'],
        title: title || 'MILESTONE!',
      },
      achievement: {
        colors: ['#00BFFF', '#1E90FF', '#FFD700', '#32CD32'],
        particleCount: 30,
        gradientColors: ['#00BFFF', '#32CD32'],
        title: title || 'ACHIEVEMENT!',
      },
      streak: {
        colors: ['#FF4500', '#FF6347', '#FFD700', '#FF1493'],
        particleCount: 20,
        gradientColors: ['#FF4500', '#FFD700'],
        title: title || 'STREAK!',
      },
    };
    return configs[type];
  };

  useEffect(() => {
    if (visible) {
      const config = getThemeConfig();
      
      // Generate premium particles with physics
      const particleCount = Math.min(Math.max(config.particleCount, Math.floor(xpAmount / 5)), 40);
      const newParticles: ParticleProps[] = [];

      const particleTypes: ParticleProps['type'][] = ['star', 'diamond', 'spark', 'circle', 'flame'];
      const physicsTypes: ParticleProps['physics'][] = ['float', 'burst', 'spiral', 'orbit'];

      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        const radius = 100 + Math.random() * 150;
        const centerX = screenWidth / 2;
        const centerY = screenHeight / 2;
        
        newParticles.push({
          delay: Math.random() * 1500,
          duration: 2000 + Math.random() * 1500,
          size: 20 + Math.random() * 25,
          startX: centerX + Math.cos(angle) * 50,
          startY: centerY + Math.sin(angle) * 50,
          endX: centerX + Math.cos(angle) * radius,
          endY: centerY + Math.sin(angle) * radius - 200,
          type: particleTypes[Math.floor(Math.random() * particleTypes.length)],
          color: config.colors[Math.floor(Math.random() * config.colors.length)],
          physics: physicsTypes[Math.floor(Math.random() * physicsTypes.length)],
        });
      }

      setParticles(newParticles);

      // Premium entrance animation sequence
      const entranceSequence = Animated.sequence([
        // Initial burst effect
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1.2,
            tension: 100,
            friction: 4,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(bounceAnim, {
            toValue: 1,
            tension: 80,
            friction: 6,
            useNativeDriver: true,
          }),
        ]),
        
        // Settle to normal size
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }),
        
        // Ring expansion
        Animated.parallel([
          Animated.timing(ringScaleAnim, {
            toValue: 2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(ringOpacityAnim, {
              toValue: 0.8,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(ringOpacityAnim, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]);

      // Title animation
      const titleAnimation = Animated.parallel([
        Animated.spring(titleScaleAnim, {
          toValue: 1,
          delay: 200,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(titleRotateAnim, {
          toValue: 1,
          delay: 200,
          duration: 800,
          useNativeDriver: true,
        }),
      ]);

      // Subtitle animation
      const subtitleAnimation = Animated.parallel([
        Animated.spring(subtitleSlideAnim, {
          toValue: 0,
          delay: 400,
          tension: 70,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(subtitleOpacityAnim, {
          toValue: 1,
          delay: 400,
          duration: 600,
          useNativeDriver: true,
        }),
      ]);

      // XP Badge animation with counter
      const xpBadgeAnimation = Animated.parallel([
        Animated.sequence([
          Animated.delay(600),
          Animated.spring(xpBadgeScaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 5,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(800),
          Animated.timing(xpCounterAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false, // Animating numbers
          }),
        ]),
        Animated.timing(xpBadgeRotateAnim, {
          toValue: 1,
          delay: 600,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]);

      // Start all animations
      Animated.parallel([
        entranceSequence,
        titleAnimation,
        subtitleAnimation,
        xpBadgeAnimation,
      ]).start();

      // Continuous glow pulse
      const glowPulse = () => {
        Animated.sequence([
          Animated.timing(glowIntensity, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowIntensity, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (visible) glowPulse();
        });
      };
      glowPulse();

      // Continuous XP badge pulse
      const xpPulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (visible) xpPulse();
        });
      };
      setTimeout(xpPulse, 1000);

      // Auto close after 5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [visible, xpAmount, type]);

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
      pulseAnim.setValue(1);
      bounceAnim.setValue(0);
      glowIntensity.setValue(0);
      titleScaleAnim.setValue(0);
      titleRotateAnim.setValue(0);
      subtitleSlideAnim.setValue(100);
      subtitleOpacityAnim.setValue(0);
      xpBadgeScaleAnim.setValue(0);
      xpBadgeRotateAnim.setValue(0);
      xpCounterAnim.setValue(0);
      ringScaleAnim.setValue(0);
      ringOpacityAnim.setValue(0);
    });
  };

  if (!visible) return null;

  const config = getThemeConfig();
  
  const [currentXPValue, setCurrentXPValue] = useState(0);
  
  useEffect(() => {
    if (visible) {
      const listener = xpCounterAnim.addListener(({ value }) => {
        setCurrentXPValue(Math.round(value * xpAmount));
      });
      return () => xpCounterAnim.removeListener(listener);
    }
  }, [visible, xpAmount, xpCounterAnim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <BlurView intensity={20} style={styles.blurOverlay}>
          {/* Background gradient */}
          <LinearGradient
            colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
            style={StyleSheet.absoluteFillObject}
          />
          
          {/* Particles */}
          {particles.map((particle, index) => (
            <PremiumParticle key={index} {...particle} />
          ))}

          {/* Expansion Rings */}
          <Animated.View
            style={[
              styles.expansionRing,
              {
                transform: [{ scale: ringScaleAnim }],
                opacity: ringOpacityAnim,
                borderColor: config.gradientColors[0],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.expansionRing,
              styles.expansionRingInner,
              {
                transform: [{ scale: ringScaleAnim.interpolate({
                  inputRange: [0, 2],
                  outputRange: [0, 1.5],
                }) }],
                opacity: ringOpacityAnim,
                borderColor: config.gradientColors[1],
              },
            ]}
          />

          {/* Main Content */}
          <Animated.View
            style={[
              styles.content,
              {
                transform: [
                  { scale: scaleAnim },
                  { translateY: bounceAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }) }
                ],
                opacity: fadeAnim,
              },
            ]}
          >
            {/* Enhanced Title */}
            <Animated.View
              style={[
                styles.titleContainer,
                {
                  transform: [
                    { scale: titleScaleAnim },
                    { rotateZ: titleRotateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['-5deg', '0deg'],
                    }) }
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={config.gradientColors}
                style={styles.titleGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.title}>{config.title}</Text>
              </LinearGradient>
              
              {/* Title glow effect */}
              <Animated.View
                style={[
                  styles.titleGlow,
                  {
                    opacity: glowIntensity,
                    shadowColor: config.gradientColors[0],
                  }
                ]}
              />
            </Animated.View>

            {/* Subtitle */}
            {subtitle && (
              <Animated.View
                style={{
                  transform: [{ translateY: subtitleSlideAnim }],
                  opacity: subtitleOpacityAnim,
                }}
              >
                <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
                  {subtitle}
                </Text>
              </Animated.View>
            )}

            {/* Premium XP Badge */}
            <Animated.View
              style={[
                styles.xpContainer,
                {
                  transform: [
                    { scale: Animated.multiply(xpBadgeScaleAnim, pulseAnim) },
                    { rotateY: xpBadgeRotateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }) }
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={[config.gradientColors[0], config.gradientColors[1], config.gradientColors[0]]}
                style={styles.xpBadge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Animated counter */}
                <Animated.Text style={styles.xpText}>
                  +{currentXPValue}
                </Animated.Text>
                <Text style={styles.xpLabel}>XP EARNED</Text>
                
                {/* Shine effect */}
                <Animated.View
                  style={[
                    styles.xpShine,
                    {
                      opacity: glowIntensity.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.8],
                      }),
                    }
                  ]}
                />
              </LinearGradient>
              
              {/* Outer glow */}
              <Animated.View
                style={[
                  styles.xpGlow,
                  {
                    opacity: glowIntensity.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 0.8],
                    }),
                    backgroundColor: config.gradientColors[0],
                  }
                ]}
              />
            </Animated.View>

            {/* Enhanced Close Hint */}
            <Pressable onPress={handleClose} style={styles.closeHint}>
              <LinearGradient
                colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
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
                  ✨ Tap to continue your journey ✨
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
  particle: {
    position: 'absolute',
    zIndex: 1,
  },
  expansionRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  expansionRingInner: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Theme.spacing.xl,
    zIndex: 10,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
    position: 'relative',
  },
  titleGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    textAlign: 'center',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
    letterSpacing: 3,
    lineHeight: 56,
  },
  titleGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 26,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Theme.spacing.xl,
    opacity: 0.95,
    letterSpacing: 1,
    lineHeight: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  xpContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.xl,
    position: 'relative',
  },
  xpBadge: {
    paddingHorizontal: 40,
    paddingVertical: 24,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 180,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
    position: 'relative',
    overflow: 'hidden',
  },
  xpText: {
    fontSize: 52,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
    letterSpacing: 2,
    lineHeight: 60,
  },
  xpLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    opacity: 0.95,
    marginTop: -8,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  xpShine: {
    position: 'absolute',
    top: 0,
    left: -100,
    width: 50,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ skewX: '-15deg' }],
  },
  xpGlow: {
    position: 'absolute',
    top: -15,
    left: -15,
    right: -15,
    bottom: -15,
    borderRadius: 45,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 25,
    elevation: 10,
  },
  closeHint: {
    marginTop: Theme.spacing.xl,
    borderRadius: 25,
    overflow: 'hidden',
  },
  closeHintGradient: {
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.xl,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
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
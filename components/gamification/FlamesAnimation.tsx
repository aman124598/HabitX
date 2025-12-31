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
import { ThemedText } from '../Themed';
import { useTheme } from '../../lib/themeContext';
import { Theme } from '../../lib/theme';

interface FlamesAnimationProps {
  visible: boolean;
  xpAmount: number;
  title?: string;
  subtitle?: string;
  onClose: () => void;
}

interface FlameProps {
  delay: number;
  duration: number;
  size: number;
  startX: number;
  startY: number;
  type: 'flame' | 'spark' | 'ember';
  color: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const Flame: React.FC<FlameProps> = ({ delay, duration, size, startX, startY, type, color }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0)).current;
  const rotateValue = useRef(new Animated.Value(0)).current;
  const flickerValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const startAnimation = () => {
      // Reset values
      animatedValue.setValue(0);
      scaleValue.setValue(0);
      rotateValue.setValue(0);
      flickerValue.setValue(1);

      // Start flicker animation for flames
      if (type === 'flame') {
        const flickerAnimation = () => {
          Animated.sequence([
            Animated.timing(flickerValue, {
              toValue: 0.7 + Math.random() * 0.3,
              duration: 100 + Math.random() * 100,
              useNativeDriver: true,
            }),
            Animated.timing(flickerValue, {
              toValue: 1,
              duration: 100 + Math.random() * 100,
              useNativeDriver: true,
            }),
          ]).start(() => flickerAnimation());
        };
        flickerAnimation();
      }

      // Start main animations
      Animated.parallel([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: duration,
          delay: delay,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.spring(scaleValue, {
            toValue: 1,
            delay: delay,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 0,
            duration: duration * 0.6,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(rotateValue, {
          toValue: 1,
          duration: duration,
          delay: delay,
          useNativeDriver: true,
        }),
      ]).start();
    };

    startAnimation();
  }, [animatedValue, scaleValue, rotateValue, flickerValue, delay, duration, type]);

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, type === 'ember' ? -screenHeight * 0.6 : -screenHeight * 0.9],
  });

  const translateX = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 200],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.1, 0.8, 1],
    outputRange: [0, 1, type === 'spark' ? 0.3 : 1, 0],
  });

  const rotate = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', type === 'spark' ? '720deg' : '180deg'],
  });

  const getIcon = () => {
    switch (type) {
      case 'flame':
        return 'flame';
      case 'spark':
        return 'diamond';
      case 'ember':
        return 'ellipse';
      default:
        return 'flame';
    }
  };

  return (
    <Animated.View
      style={[
        styles.flame,
        {
          transform: [
            { translateX: translateX },
            { translateY: translateY },
            { scale: Animated.multiply(scaleValue, flickerValue) },
            { rotate },
          ],
          opacity,
          left: startX,
          top: startY,
        },
      ]}
    >
      <Ionicons 
        name={getIcon() as any}
        size={size} 
        color={color}
        style={[
          styles.flameIcon,
          type === 'flame' && {
            textShadowColor: color,
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 15,
          }
        ]}
      />
    </Animated.View>
  );
};

export function FlamesAnimation({ 
  visible, 
  xpAmount, 
  title = "AMAZING!", 
  subtitle,
  onClose 
}: FlamesAnimationProps) {
  const { colors } = useTheme();
  const [flames, setFlames] = useState<FlameProps[]>([]);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const titleSlideAnim = useRef(new Animated.Value(-50)).current;
  const titleOpacityAnim = useRef(new Animated.Value(0)).current;
  const subtitleSlideAnim = useRef(new Animated.Value(50)).current;
  const subtitleOpacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Generate random flames with different types and colors
      const flameCount = Math.min(Math.max(12, Math.floor(xpAmount / 8)), 25);
      const newFlames: FlameProps[] = [];

      const flameColors = ['#FF6B35', '#FF4500', '#FF8C00', '#FFD700', '#FF1493'];
      const sparkColors = ['#00BFFF', '#1E90FF', '#FFD700', '#FFFF00', '#FF69B4'];
      const emberColors = ['#DC143C', '#B22222', '#FF6347', '#FF4500', '#OrangeRed'];

      for (let i = 0; i < flameCount; i++) {
        const rand = Math.random();
        let type: 'flame' | 'spark' | 'ember';
        let colors: string[];
        let sizeRange: [number, number];

        if (rand < 0.6) {
          type = 'flame';
          colors = flameColors;
          sizeRange = [35, 65];
        } else if (rand < 0.85) {
          type = 'spark';
          colors = sparkColors;
          sizeRange = [15, 30];
        } else {
          type = 'ember';
          colors = emberColors;
          sizeRange = [20, 40];
        }

        newFlames.push({
          delay: Math.random() * 1200,
          duration: 1800 + Math.random() * 1200,
          size: sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]),
          startX: Math.random() * (screenWidth - 80),
          startY: screenHeight + Math.random() * 150,
          type,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }

      setFlames(newFlames);

      // Start main animations with dramatic entry
      Animated.parallel([
        Animated.sequence([
          Animated.spring(scaleAnim, {
            toValue: 1.3,
            tension: 60,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        // Add screen shake effect
        Animated.sequence([
          Animated.timing(shakeAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
        // Staggered text animations for premium effect
        Animated.sequence([
          Animated.delay(200),
          Animated.parallel([
            Animated.spring(titleSlideAnim, {
              toValue: 0,
              tension: 80,
              friction: 8,
              useNativeDriver: true,
            }),
            Animated.timing(titleOpacityAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.sequence([
          Animated.delay(400),
          Animated.parallel([
            Animated.spring(subtitleSlideAnim, {
              toValue: 0,
              tension: 70,
              friction: 9,
              useNativeDriver: true,
            }),
            Animated.timing(subtitleOpacityAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();

      // Start pulsing animation for XP text with glow
      const pulse = () => {
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.15,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true, // Now drives opacity of a separate glow layer
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => {
          if (visible) {
            pulse();
          }
        });
      };
      pulse();

      // Auto close after 4 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [visible, xpAmount]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      pulseAnim.setValue(1);
      shakeAnim.setValue(0);
      glowAnim.setValue(0);
      titleSlideAnim.setValue(-50);
      titleOpacityAnim.setValue(0);
      subtitleSlideAnim.setValue(50);
      subtitleOpacityAnim.setValue(0);
    });
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={[styles.blurOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
          {/* Flames */}
          {flames.map((flame, index) => (
            <Flame
              key={index}
              delay={flame.delay}
              duration={flame.duration}
              size={flame.size}
              startX={flame.startX}
              startY={flame.startY}
              type={flame.type}
              color={flame.color}
            />
          ))}

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
            {/* Enhanced Title with Premium Animations */}
            <View style={styles.titleContainer}>
              <Animated.View
                style={{
                  transform: [{ translateY: titleSlideAnim }],
                  opacity: titleOpacityAnim,
                }}
              >
                <View style={styles.titleWrapper}>
                  <Animated.Text 
                    style={[
                      styles.title, 
                      { 
                        color: colors.text.primary,
                      }
                    ]}
                  >
                    {title}
                  </Animated.Text>
                  <Animated.View 
                    style={[
                      styles.titleGlow,
                      {
                        opacity: titleOpacityAnim,
                      }
                    ]}
                  />
                </View>
                <Animated.View 
                  style={[
                    styles.titleUnderline,
                    {
                      opacity: titleOpacityAnim,
                      transform: [{
                        scaleX: titleOpacityAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 1],
                        })
                      }]
                    }
                  ]} 
                />
              </Animated.View>
              
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
            </View>

            {/* XP Amount with enhanced effects */}
            <Animated.View
              style={[
                styles.xpContainer,
                {
                  transform: [
                    { scale: pulseAnim },
                    { 
                      translateX: shakeAnim.interpolate({
                        inputRange: [0, 0.25, 0.5, 0.75, 1],
                        outputRange: [0, -5, 5, -3, 0],
                      })
                    },
                  ],
                },
              ]}
            >
              <Animated.View 
                style={[
                  styles.xpFlameLeft,
                  {
                    transform: [
                      { rotate: '-15deg' },
                      { 
                        rotateZ: pulseAnim.interpolate({
                          inputRange: [1, 1.15],
                          outputRange: ['0deg', '5deg'],
                        })
                      }
                    ]
                  }
                ]}
              >
                <Ionicons name="flame" size={65} color="#FF6B35" />
              </Animated.View>
              
              <View 
                style={[
                  styles.xpBadge, 
                  { 
                    backgroundColor: colors.brand.primary,
                  }
                ]}
              >
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.xpBadgeGlow,
                    {
                      opacity: glowAnim,
                    }
                  ]}
                />
                <Animated.Text 
                  style={[
                    styles.xpText,
                  ]}
                >
                  +{xpAmount}
                </Animated.Text>
                <Text style={styles.xpLabel}>XP</Text>
              </View>
              
              <Animated.View 
                style={[
                  styles.xpFlameRight,
                  {
                    transform: [
                      { rotate: '15deg' },
                      { 
                        rotateZ: pulseAnim.interpolate({
                          inputRange: [1, 1.15],
                          outputRange: ['0deg', '-5deg'],
                        })
                      }
                    ]
                  }
                ]}
              >
                <Ionicons name="flame" size={65} color="#FF6B35" />
              </Animated.View>
            </Animated.View>

            {/* Enhanced Tap to close hint */}
            <Pressable onPress={handleClose} style={styles.closeHint}>
              <Animated.Text 
                style={[
                  styles.closeHintText,
                  {
                    opacity: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.7],
                    }),
                    color: colors.text.secondary,
                  }
                ]}
              >
                ✨ Tap anywhere to continue ✨
              </Animated.Text>
            </Pressable>
          </Animated.View>
        </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  flame: {
    position: 'absolute',
  },
  flameIcon: {
    textShadowColor: '#FF4500',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
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
  },
  titleWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  title: {
    fontSize: 56,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
    letterSpacing: 4,
    lineHeight: 64,
    zIndex: 2,
  },
  titleGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 20,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 5,
    zIndex: 1,
  },
  titleUnderline: {
    width: 60,
    height: 4,
    backgroundColor: '#FFD700',
    alignSelf: 'center',
    marginTop: 8,
    borderRadius: 2,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: Theme.spacing.lg,
    opacity: 0.95,
    letterSpacing: 1,
    lineHeight: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.xl,
  },
  xpFlameLeft: {
    marginRight: Theme.spacing.lg,
  },
  xpFlameRight: {
    marginLeft: Theme.spacing.lg,
  },
  xpBadge: {
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    minWidth: 140,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  xpBadgeGlow: {
    position: 'absolute',
    top: -6,
    bottom: -6,
    left: -6,
    right: -6,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  xpText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 2,
    lineHeight: 48,
  },
  xpLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    opacity: 0.95,
    marginTop: -6,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  closeHint: {
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.xl,
    marginTop: Theme.spacing.xl,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeHintText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { ThemedView, ThemedText, ThemedButton } from '../Themed';
import { useTheme } from '../../lib/themeContext';
import Theme from '../../lib/theme';

const { width } = Dimensions.get('window');

interface EmptyStateProps {
  onCreateHabit: () => void;
}

export default function EmptyState({ onCreateHabit }: EmptyStateProps) {
  const { colors, isDark } = useTheme();
  
  // Main icon animations
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  
  // Title animations
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(30);
  
  // Subtitle animations
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(20);
  
  // Feature pills animations
  const pill1Scale = useSharedValue(0);
  const pill2Scale = useSharedValue(0);
  const pill3Scale = useSharedValue(0);
  
  // Button animation
  const buttonScale = useSharedValue(0);
  const buttonGlow = useSharedValue(0);
  
  // Floating particles
  const particles = React.useRef(
    Array.from({ length: 6 }, () => ({
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      scale: useSharedValue(0),
      opacity: useSharedValue(0),
    }))
  ).current;

  useEffect(() => {
    // Entrance animation sequence
    // Icon entrance
    scale.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 100 }));
    glowOpacity.value = withDelay(400, withTiming(0.5, { duration: 600 }));
    
    // Title entrance
    titleOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    titleTranslateY.value = withDelay(400, withSpring(0, { damping: 15, stiffness: 100 }));
    
    // Subtitle entrance
    subtitleOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));
    subtitleTranslateY.value = withDelay(600, withSpring(0, { damping: 15, stiffness: 100 }));
    
    // Feature pills entrance (staggered)
    pill1Scale.value = withDelay(800, withSpring(1, { damping: 12, stiffness: 150 }));
    pill2Scale.value = withDelay(900, withSpring(1, { damping: 12, stiffness: 150 }));
    pill3Scale.value = withDelay(1000, withSpring(1, { damping: 12, stiffness: 150 }));
    
    // Button entrance
    buttonScale.value = withDelay(1100, withSpring(1, { damping: 12, stiffness: 100 }));
    
    // Continuous animations
    translateY.value = withDelay(500, withRepeat(
      withSequence(
        withTiming(-12, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    ));
    
    rotation.value = withDelay(500, withRepeat(
      withSequence(
        withTiming(-5, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(5, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    ));
    
    // Glow pulse
    glowOpacity.value = withDelay(1000, withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1500 }),
        withTiming(0.3, { duration: 1500 })
      ),
      -1,
      true
    ));
    
    // Button glow pulse
    buttonGlow.value = withDelay(1500, withRepeat(
      withSequence(
        withTiming(1, { duration: 1200 }),
        withTiming(0, { duration: 1200 })
      ),
      -1,
      true
    ));
  }, []);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: interpolate(glowOpacity.value, [0.3, 0.7], [1, 1.2]) }],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const buttonGlowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(buttonGlow.value, [0, 1], [0, 0.4]),
    transform: [{ scale: interpolate(buttonGlow.value, [0, 1], [0.9, 1.1]) }],
  }));

  return (
    <ThemedView variant="secondary" style={styles.container}>
      {/* Decorative background elements */}
      <View style={styles.decorativeContainer}>
        <View style={[styles.decorativeCircle, styles.circle1, { backgroundColor: `${colors.brand.primary}12` }]} />
        <View style={[styles.decorativeCircle, styles.circle2, { backgroundColor: `${colors.brand.secondary}10` }]} />
        <View style={[styles.decorativeCircle, styles.circle3, { backgroundColor: `${colors.status.success}08` }]} />
        <View style={[styles.decorativeLine, styles.line1, { backgroundColor: `${colors.brand.primary}15` }]} />
        <View style={[styles.decorativeLine, styles.line2, { backgroundColor: `${colors.brand.secondary}12` }]} />
      </View>
      
      {/* Main Icon with glow */}
      <View style={styles.iconWrapper}>
        <Animated.View style={[styles.iconGlow, glowAnimatedStyle]}>
          <LinearGradient
            colors={[`${colors.brand.primary}40`, 'transparent']}
            style={styles.iconGlowGradient}
          />
        </Animated.View>
        <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
          <LinearGradient
            colors={colors.brand.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconGradient}
          >
            <View style={styles.iconInner}>
              <Ionicons name="rocket" size={44} color={colors.brand.primary} />
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
      
      {/* Title */}
      <Animated.View style={titleAnimatedStyle}>
        <ThemedText variant="primary" size="xxxl" weight="extrabold" align="center" style={styles.title}>
          Start Your Journey
        </ThemedText>
      </Animated.View>
      
      {/* Subtitle */}
      <Animated.View style={subtitleAnimatedStyle}>
        <ThemedText variant="secondary" size="lg" weight="medium" align="center" style={styles.subtitle}>
          Create your first habit and begin building a better version of yourself.
        </ThemedText>
      </Animated.View>
      
      {/* Feature Pills with staggered animation */}
      <View style={styles.featuresContainer}>
        <Animated.View style={{ transform: [{ scale: pill1Scale }] }}>
          <FeaturePill icon="checkmark-circle" text="Track daily" color={colors.status.success} />
        </Animated.View>
        <Animated.View style={{ transform: [{ scale: pill2Scale }] }}>
          <FeaturePill icon="flame" text="Build streaks" color={colors.status.warning} />
        </Animated.View>
        <Animated.View style={{ transform: [{ scale: pill3Scale }] }}>
          <FeaturePill icon="star" text="Earn XP" color={colors.brand.primary} />
        </Animated.View>
      </View>
      
      {/* CTA Button with glow */}
      <Animated.View style={[styles.buttonWrapper, buttonAnimatedStyle]}>
        <Animated.View style={[styles.buttonGlow, buttonGlowAnimatedStyle]}>
          <LinearGradient
            colors={colors.brand.gradient}
            style={styles.buttonGlowGradient}
          />
        </Animated.View>
        <ThemedButton
          variant="primary"
          size="xl"
          gradient
          onPress={onCreateHabit}
          style={styles.ctaButton}
          icon={<Ionicons name="add-circle" size={22} color="white" />}
        >
          Create First Habit
        </ThemedButton>
      </Animated.View>
      
      {/* Bottom tip */}
      <Animated.View style={[styles.tipContainer, subtitleAnimatedStyle]}>
        <View style={[styles.tipIcon, { backgroundColor: `${colors.status.warning}15` }]}>
          <Ionicons name="bulb" size={14} color={colors.status.warning} />
        </View>
        <ThemedText variant="tertiary" size="sm" style={styles.tipText}>
          Tip: Start with one small habit to build momentum
        </ThemedText>
      </Animated.View>
    </ThemedView>
  );
}

function FeaturePill({ icon, text, color }: { icon: keyof typeof Ionicons.glyphMap; text: string; color: string }) {
  const { isDark } = useTheme();
  
  return (
    <View style={[styles.featurePill, { 
      backgroundColor: `${color}12`,
      borderColor: `${color}25`,
      borderWidth: 1,
    }]}>
      <View style={[styles.featureIconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <ThemedText variant="secondary" size="sm" weight="semibold" style={{ color }}>
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.xxxl,
    borderRadius: Theme.borderRadius.xxl,
    marginTop: Theme.spacing.lg,
    overflow: 'hidden',
    minHeight: 520,
  },
  
  decorativeContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 999,
  },

  decorativeLine: {
    position: 'absolute',
    borderRadius: 2,
  },
  
  circle1: {
    width: 220,
    height: 220,
    top: -60,
    right: -60,
  },
  
  circle2: {
    width: 160,
    height: 160,
    bottom: 40,
    left: -50,
  },
  
  circle3: {
    width: 120,
    height: 120,
    bottom: -30,
    right: 20,
  },

  line1: {
    width: 80,
    height: 3,
    top: 80,
    left: 30,
    transform: [{ rotate: '-20deg' }],
  },

  line2: {
    width: 60,
    height: 3,
    bottom: 120,
    right: 40,
    transform: [{ rotate: '30deg' }],
  },

  iconWrapper: {
    position: 'relative',
    marginBottom: Theme.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
  },

  iconGlowGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 80,
  },
  
  iconContainer: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  
  iconGradient: {
    width: 110,
    height: 110,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },

  iconInner: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  title: {
    marginBottom: Theme.spacing.md,
    letterSpacing: -0.5,
  },
  
  subtitle: {
    marginBottom: Theme.spacing.xxl,
    paddingHorizontal: Theme.spacing.md,
    opacity: 0.85,
    lineHeight: 26,
  },
  
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.xxl,
  },
  
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.full,
    gap: Theme.spacing.sm,
  },

  featureIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonWrapper: {
    position: 'relative',
    marginBottom: Theme.spacing.xl,
  },

  buttonGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: Theme.borderRadius.xl + 10,
  },

  buttonGlowGradient: {
    flex: 1,
    borderRadius: Theme.borderRadius.xl + 10,
  },
  
  ctaButton: {
    minWidth: 220,
    paddingHorizontal: Theme.spacing.xxl,
  },
  
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },

  tipIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  tipText: {
    fontStyle: 'italic',
    letterSpacing: 0.2,
  },
});

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
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
} from 'react-native-reanimated';
import { ThemedView, ThemedText, ThemedButton } from '../Themed';
import { useTheme } from '../../lib/themeContext';
import Theme from '../../lib/theme';

interface EmptyStateProps {
  onCreateHabit: () => void;
}

export default function EmptyState({ onCreateHabit }: EmptyStateProps) {
  const { colors, isDark } = useTheme();
  
  // Main icon animations
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0);
  
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
  


  useEffect(() => {
    // Entrance animation sequence
    // Icon entrance
    scale.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 100 }));
    
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
    
    // Subtle floating motion
    translateY.value = withDelay(500, withRepeat(
      withSequence(
        withTiming(-8, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    ));
  }, []);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
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

  return (
    <ThemedView variant="secondary" style={styles.container}>
      {/* Main Icon */}
      <View style={styles.iconWrapper}>
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
      
      {/* CTA Button */}
      <Animated.View style={[styles.buttonWrapper, buttonAnimatedStyle]}>
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

  iconWrapper: {
    position: 'relative',
    marginBottom: Theme.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: Theme.spacing.xl,
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

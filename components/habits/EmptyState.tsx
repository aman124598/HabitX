import React from 'react';
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
  Easing,
} from 'react-native-reanimated';
import { ThemedView, ThemedText, ThemedButton } from '../Themed';
import { useTheme } from '../../lib/themeContext';
import Theme from '../../lib/theme';

const { width } = Dimensions.get('window');

interface EmptyStateProps {
  onCreateHabit: () => void;
}

export default function EmptyState({ onCreateHabit }: EmptyStateProps) {
  const { colors } = useTheme();
  
  // Floating animation for the main icon
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  
  React.useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    
    rotation.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(3, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return (
    <ThemedView variant="secondary" style={styles.container}>
      {/* Decorative background elements */}
      <View style={styles.decorativeContainer}>
        <View style={[styles.decorativeCircle, styles.circle1, { backgroundColor: `${colors.brand.primary}10` }]} />
        <View style={[styles.decorativeCircle, styles.circle2, { backgroundColor: `${colors.brand.secondary}10` }]} />
        <View style={[styles.decorativeCircle, styles.circle3, { backgroundColor: `${colors.status.success}10` }]} />
      </View>
      
      {/* Main Icon */}
      <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
        <LinearGradient
          colors={colors.brand.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconGradient}
        >
          <Ionicons name="leaf" size={48} color="white" />
        </LinearGradient>
      </Animated.View>
      
      {/* Title */}
      <ThemedText variant="primary" size="xxxl" weight="extrabold" align="center" style={styles.title}>
        Start Your Journey
      </ThemedText>
      
      {/* Subtitle */}
      <ThemedText variant="secondary" size="lg" weight="medium" align="center" style={styles.subtitle}>
        Create your first habit and begin building a better version of yourself.
      </ThemedText>
      
      {/* Feature Pills */}
      <View style={styles.featuresContainer}>
        <FeaturePill icon="checkmark-circle" text="Track daily progress" color={colors.status.success} />
        <FeaturePill icon="flame" text="Build streaks" color={colors.status.warning} />
        <FeaturePill icon="star" text="Earn XP & level up" color={colors.brand.primary} />
      </View>
      
      {/* CTA Button */}
      <ThemedButton
        variant="primary"
        size="xl"
        gradient
        onPress={onCreateHabit}
        style={styles.ctaButton}
        icon={<Ionicons name="add" size={24} color="white" />}
      >
        Create First Habit
      </ThemedButton>
      
      {/* Bottom tip */}
      <View style={styles.tipContainer}>
        <Ionicons name="bulb-outline" size={16} color={colors.text.tertiary} />
        <ThemedText variant="tertiary" size="sm" style={styles.tipText}>
          Tip: Start with one small habit to build momentum
        </ThemedText>
      </View>
    </ThemedView>
  );
}

function FeaturePill({ icon, text, color }: { icon: keyof typeof Ionicons.glyphMap; text: string; color: string }) {
  return (
    <View style={[styles.featurePill, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={16} color={color} />
      <ThemedText variant="secondary" size="sm" weight="medium" style={{ color }}>
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
    minHeight: 500,
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
  
  circle1: {
    width: 200,
    height: 200,
    top: -50,
    right: -50,
  },
  
  circle2: {
    width: 150,
    height: 150,
    bottom: 50,
    left: -40,
  },
  
  circle3: {
    width: 100,
    height: 100,
    bottom: -20,
    right: 30,
  },
  
  iconContainer: {
    marginBottom: Theme.spacing.xxl,
  },
  
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  title: {
    marginBottom: Theme.spacing.md,
  },
  
  subtitle: {
    marginBottom: Theme.spacing.xxl,
    paddingHorizontal: Theme.spacing.lg,
    opacity: 0.8,
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
    gap: Theme.spacing.xs,
  },
  
  ctaButton: {
    minWidth: 220,
    marginBottom: Theme.spacing.xl,
  },
  
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  
  tipText: {
    fontStyle: 'italic',
  },
});

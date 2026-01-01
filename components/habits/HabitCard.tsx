import React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  interpolate,
  Extrapolate,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';
import { Habit } from '../../lib/habitsApi';
import { ThemedCard, ThemedText, ThemedBadge } from '../Themed';
import { useTheme } from '../../lib/themeContext';
import Theme, { getShadow } from '../../lib/theme';
import { getFrequencyDisplay, getCategoryColor, getCategoryIcon } from '../../lib/habitUtils';
import { isCompletedToday as checkIsCompletedToday, getToday } from '../../lib/dateHelper';

export type HabitCardProps = {
  habit: Habit;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

function isCompletedToday(habit: Habit): boolean {
  return checkIsCompletedToday(habit.lastCompletedOn);
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function HabitCard({ habit, onToggle, onDelete }: HabitCardProps) {
  const { colors, isDark } = useTheme();
  const completed = isCompletedToday(habit);
  const [isToggling, setIsToggling] = React.useState(false);
  
  // Animation values
  const scale = useSharedValue(1);
  const checkScale = useSharedValue(completed ? 1 : 0);
  const checkRotation = useSharedValue(completed ? 0 : -0.5);
  const progress = useSharedValue(completed ? 1 : 0);
  const shimmer = useSharedValue(0);
  const streakGlow = useSharedValue(0);
  const deleteScale = useSharedValue(1);
  const cardElevation = useSharedValue(completed ? 0 : 1);
  const ripple = useSharedValue(0);
  
  const categoryColor = getCategoryColor(habit.category);
  const categoryIcon = getCategoryIcon(habit.category);
  const frequencyDisplay = getFrequencyDisplay(habit.frequency, habit.customFrequency);

  React.useEffect(() => {
    checkScale.value = withSpring(completed ? 1 : 0, { damping: 12, stiffness: 300 });
    checkRotation.value = withSpring(completed ? 0 : -0.5, { damping: 15, stiffness: 200 });
    progress.value = withTiming(completed ? 1 : 0, { duration: 400 });
    cardElevation.value = withTiming(completed ? 0 : 1, { duration: 300 });
  }, [completed]);

  // Streak glow animation
  React.useEffect(() => {
    if (habit.streak >= 7) {
      const glowAnimation = () => {
        streakGlow.value = withSequence(
          withTiming(1, { duration: 1500 }),
          withTiming(0.3, { duration: 1500 })
        );
      };
      const interval = setInterval(glowAnimation, 3000);
      glowAnimation();
      return () => clearInterval(interval);
    }
  }, [habit.streak]);

  const handleToggle = React.useCallback(() => {
    if (isToggling) return;
    setIsToggling(true);
    
    // Ripple effect
    ripple.value = 0;
    ripple.value = withTiming(1, { duration: 600 });
    
    // Celebration animation
    scale.value = withSequence(
      withSpring(0.96, { damping: 20, stiffness: 400 }),
      withSpring(1.03, { damping: 12, stiffness: 300 }),
      withSpring(1, { damping: 15, stiffness: 300 })
    );
    
    // Shimmer effect on completion
    if (!completed) {
      shimmer.value = 0;
      shimmer.value = withTiming(1, { duration: 800 });
    }
    
    onToggle(habit.id);
    
    setTimeout(() => setIsToggling(false), 800);
  }, [isToggling, habit.id, onToggle, completed]);

  const handleDeletePressIn = () => {
    deleteScale.value = withSpring(0.85, { damping: 15, stiffness: 400 });
  };

  const handleDeletePressOut = () => {
    deleteScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: interpolate(cardElevation.value, [0, 1], [0.04, 0.12]),
    elevation: interpolate(cardElevation.value, [0, 1], [2, 8]),
  }));

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: checkScale.value },
      { rotate: `${checkRotation.value}rad` },
    ],
    opacity: checkScale.value,
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
    opacity: interpolate(progress.value, [0, 0.5, 1], [0, 0.5, 0.2]),
  }));

  const shimmerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(shimmer.value, [0, 1], [-200, 400]) },
    ],
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0, 0.8, 0]),
  }));

  const rippleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(ripple.value, [0, 1], [0.5, 2]) }],
    opacity: interpolate(ripple.value, [0, 0.3, 1], [0.4, 0.2, 0]),
  }));

  const streakGlowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: streakGlow.value,
  }));

  const deleteAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: deleteScale.value }],
  }));

  // Streak color based on streak length
  const getStreakColor = () => {
    if (habit.streak >= 30) return '#F59E0B'; // Gold
    if (habit.streak >= 14) return '#8B5CF6'; // Purple
    if (habit.streak >= 7) return '#06B6D4'; // Cyan
    return colors.status.warning; // Orange default
  };

  const getStreakIcon = () => {
    if (habit.streak >= 30) return 'flame';
    if (habit.streak >= 14) return 'flame';
    if (habit.streak >= 7) return 'flame';
    return 'flame';
  };

  return (
    <Animated.View style={[cardAnimatedStyle, styles.container]}>
      <ThemedCard 
        variant={completed ? 'default' : 'elevated'}
        style={[
          styles.card,
          completed && { 
            borderLeftWidth: 4, 
            borderLeftColor: colors.status.success,
            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.05)',
          }
        ]}
      >
        {/* Ripple effect on tap */}
        <Animated.View 
          style={[
            styles.rippleEffect,
            rippleAnimatedStyle,
            { backgroundColor: completed ? colors.status.error : colors.status.success }
          ]} 
        />

        {/* Top Progress Indicator with gradient */}
        {completed && (
          <Animated.View style={[styles.progressIndicator, progressAnimatedStyle]}>
            <LinearGradient
              colors={[`${colors.status.success}30`, `${colors.status.success}10`, 'transparent']}
              style={styles.progressGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        )}

        {/* Shimmer effect on completion */}
        <Animated.View style={[styles.shimmer, shimmerAnimatedStyle]}>
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
            style={styles.shimmerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </Animated.View>
        
        <View style={styles.content}>
          {/* Animated Checkbox */}
          <Pressable
            onPress={handleToggle}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.checkboxContainer}
          >
            <View
              style={[
                styles.checkbox,
                completed 
                  ? [styles.checkboxChecked, { borderColor: colors.status.success, backgroundColor: colors.status.success }] 
                  : { borderColor: colors.border.medium, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'transparent' },
              ]}
            >
              <Animated.View style={checkAnimatedStyle}>
                <Ionicons name="checkmark" size={16} color="white" />
              </Animated.View>
            </View>
          </Pressable>

          {/* Habit Info */}
          <View style={styles.habitInfo}>
            <View style={styles.nameRow}>
              <ThemedText 
                variant={completed ? 'secondary' : 'primary'}
                size="lg" 
                weight="bold"
                numberOfLines={1}
                style={completed ? styles.completedName : undefined}
              >
                {habit.name}
              </ThemedText>
              
              {/* Completion badge */}
              {completed && (
                <View style={[styles.completedBadge, { backgroundColor: `${colors.status.success}20` }]}>
                  <Ionicons name="checkmark-circle" size={12} color={colors.status.success} />
                  <ThemedText variant="secondary" size="xs" style={{ color: colors.status.success }}>Done</ThemedText>
                </View>
              )}
            </View>
            
            {habit.goal && (
              <ThemedText variant="secondary" size="sm" numberOfLines={1} style={styles.goal}>
                {habit.goal}
              </ThemedText>
            )}
            
            {/* Category & Frequency Badges */}
            <View style={styles.metaRow}>
              <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}15` }]}>
                <Ionicons name={categoryIcon as any} size={12} color={categoryColor} />
                <ThemedText variant="secondary" size="xs" weight="medium" style={{ color: categoryColor }}>
                  {habit.category}
                </ThemedText>
              </View>
              <View style={[styles.frequencyBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}>
                <Ionicons name="repeat" size={10} color={colors.text.tertiary} />
                <ThemedText variant="tertiary" size="xs">
                  {frequencyDisplay}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Right Side - Streak & XP */}
          <View style={styles.rightSection}>
            {/* Streak Badge with glow */}
            {habit.streak > 0 && (
              <View style={styles.streakContainer}>
                {habit.streak >= 7 && (
                  <Animated.View 
                    style={[
                      styles.streakGlow,
                      streakGlowAnimatedStyle,
                      { backgroundColor: getStreakColor() }
                    ]} 
                  />
                )}
                <View style={[styles.streakBadge, { backgroundColor: `${getStreakColor()}15`, borderColor: `${getStreakColor()}30`, borderWidth: 1 }]}>
                  <View style={styles.streakContent}>
                    <Ionicons name={getStreakIcon()} size={18} color={getStreakColor()} />
                    <ThemedText 
                      weight="extrabold" 
                      size="lg"
                      style={{ color: getStreakColor() }}
                    >
                      {habit.streak}
                    </ThemedText>
                  </View>
                  <ThemedText variant="tertiary" size="xs" weight="medium">
                    {habit.streak === 1 ? 'day' : 'days'}
                  </ThemedText>
                </View>
              </View>
            )}
            
            {/* XP Badge */}
            {(habit.xp || 0) > 0 && (
              <View style={[styles.xpBadge, { backgroundColor: `${colors.brand.primary}15` }]}>
                <Ionicons name="star" size={10} color={colors.brand.primary} />
                <ThemedText variant="accent" size="xs" weight="bold">
                  +{habit.xp} XP
                </ThemedText>
              </View>
            )}
          </View>

          {/* Delete Button */}
          <AnimatedPressable 
            onPress={() => onDelete(habit.id)}
            onPressIn={handleDeletePressIn}
            onPressOut={handleDeletePressOut}
            style={[
              styles.deleteButton,
              deleteAnimatedStyle,
              { backgroundColor: isDark ? 'rgba(244, 63, 94, 0.1)' : 'rgba(244, 63, 94, 0.08)' }
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={16} color={colors.status.error} />
          </AnimatedPressable>
        </View>
      </ThemedCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Theme.spacing.md,
    shadowColor: Theme.colors.card.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  
  card: {
    position: 'relative',
    overflow: 'hidden',
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.xl,
  },

  rippleEffect: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 100,
    height: 100,
    borderRadius: 50,
    marginTop: -50,
    marginLeft: -50,
  },
  
  progressIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 0,
  },

  progressGradient: {
    flex: 1,
  },

  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 100,
    zIndex: 1,
  },

  shimmerGradient: {
    flex: 1,
    width: 100,
  },
  
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  
  checkboxContainer: {
    marginRight: Theme.spacing.md,
  },
  
  checkbox: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  checkboxChecked: {
    // Colors applied inline
  },
  
  habitInfo: {
    flex: 1,
    marginRight: Theme.spacing.sm,
  },
  
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  
  completedName: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },

  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.full,
    gap: 3,
  },
  
  goal: {
    marginBottom: 8,
    opacity: 0.8,
  },
  
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Theme.borderRadius.full,
    gap: 5,
  },

  frequencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.full,
    gap: 4,
  },
  
  rightSection: {
    alignItems: 'flex-end',
    marginRight: Theme.spacing.sm,
    gap: 8,
  },

  streakContainer: {
    position: 'relative',
  },

  streakGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: Theme.borderRadius.lg + 4,
    opacity: 0.3,
  },
  
  streakBadge: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Theme.borderRadius.lg,
  },
  
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.full,
    gap: 4,
  },
  
  deleteButton: {
    padding: 10,
    borderRadius: Theme.borderRadius.lg,
  },
});

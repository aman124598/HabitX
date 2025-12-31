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
  interpolate,
  Extrapolate,
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

export default function HabitCard({ habit, onToggle, onDelete }: HabitCardProps) {
  const { colors, isDark } = useTheme();
  const completed = isCompletedToday(habit);
  const [isToggling, setIsToggling] = React.useState(false);
  
  const scale = useSharedValue(1);
  const checkScale = useSharedValue(completed ? 1 : 0);
  const progress = useSharedValue(completed ? 1 : 0);
  
  const categoryColor = getCategoryColor(habit.category);
  const categoryIcon = getCategoryIcon(habit.category);
  const frequencyDisplay = getFrequencyDisplay(habit.frequency, habit.customFrequency);

  React.useEffect(() => {
    checkScale.value = withSpring(completed ? 1 : 0, { damping: 15, stiffness: 300 });
    progress.value = withTiming(completed ? 1 : 0, { duration: 300 });
  }, [completed]);

  const handleToggle = React.useCallback(() => {
    if (isToggling) return;
    setIsToggling(true);
    
    // Celebration animation
    scale.value = withSequence(
      withSpring(0.95, { damping: 20, stiffness: 400 }),
      withSpring(1.02, { damping: 15, stiffness: 300 }),
      withSpring(1, { damping: 15, stiffness: 300 })
    );
    
    onToggle(habit.id);
    
    setTimeout(() => setIsToggling(false), 800);
  }, [isToggling, habit.id, onToggle]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  // Streak color based on streak length
  const getStreakColor = () => {
    if (habit.streak >= 30) return '#F59E0B'; // Gold
    if (habit.streak >= 14) return '#8B5CF6'; // Purple
    if (habit.streak >= 7) return '#06B6D4'; // Cyan
    return colors.status.warning; // Orange default
  };

  return (
    <Animated.View style={[cardAnimatedStyle, styles.container]}>
      <ThemedCard 
        variant={completed ? 'default' : 'elevated'}
        style={[
          styles.card,
          completed ? { 
            borderLeftWidth: 4, 
            borderLeftColor: colors.status.success,
          } : undefined
        ]}
      >
        {/* Top Progress Indicator */}
        {completed && (
          <Animated.View 
            style={[
              styles.progressIndicator,
              progressAnimatedStyle,
              { backgroundColor: `${colors.status.success}20` }
            ]} 
          />
        )}
        
        <View style={styles.content}>
          {/* Checkbox */}
          <Pressable
            onPress={handleToggle}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.checkboxContainer}
          >
            <View
              style={[
                styles.checkbox,
                completed ? [styles.checkboxChecked, { borderColor: colors.status.success, backgroundColor: colors.status.success }] : { borderColor: colors.border.medium, backgroundColor: 'transparent' },
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
            </View>
            
            {habit.goal && (
              <ThemedText variant="secondary" size="sm" numberOfLines={1} style={styles.goal}>
                {habit.goal}
              </ThemedText>
            )}
            
            {/* Category & Frequency Badge */}
            <View style={styles.metaRow}>
              <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}15` }]}>
                <Ionicons name={categoryIcon as any} size={12} color={categoryColor} />
                <ThemedText variant="secondary" size="xs" weight="medium" style={{ color: categoryColor }}>
                  {habit.category}
                </ThemedText>
              </View>
              <View style={styles.dot} />
              <ThemedText variant="tertiary" size="xs">
                {frequencyDisplay}
              </ThemedText>
            </View>
          </View>

          {/* Right Side - Streak & Actions */}
          <View style={styles.rightSection}>
            {/* Streak Badge */}
            {habit.streak > 0 && (
              <View style={[styles.streakBadge, { backgroundColor: `${getStreakColor()}15` }]}>
                <View style={styles.streakContent}>
                  <Ionicons name="flame" size={16} color={getStreakColor()} />
                  <ThemedText 
                    weight="bold" 
                    size="base"
                    style={{ color: getStreakColor() }}
                  >
                    {habit.streak}
                  </ThemedText>
                </View>
                <ThemedText variant="tertiary" size="xs">
                  days
                </ThemedText>
              </View>
            )}
            
            {/* XP Badge */}
            {(habit.xp || 0) > 0 && (
              <View style={[styles.xpBadge, { backgroundColor: colors.status.infoLight }]}>
                <ThemedText variant="accent" size="xs" weight="bold">
                  +{habit.xp} XP
                </ThemedText>
              </View>
            )}
          </View>

          {/* Delete Button */}
          <Pressable 
            onPress={() => onDelete(habit.id)}
            style={({ pressed }) => [
              styles.deleteButton,
              { backgroundColor: pressed ? colors.status.errorLight : 'transparent' }
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={18} color={colors.status.error} />
          </Pressable>
        </View>
      </ThemedCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Theme.spacing.md,
  },
  
  card: {
    position: 'relative',
    overflow: 'hidden',
    padding: Theme.spacing.lg,
  },
  
  progressIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 0,
  },
  
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  
  checkboxContainer: {
    marginRight: Theme.spacing.md,
  },
  
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
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
    marginBottom: 2,
  },
  
  completedName: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  
  goal: {
    marginBottom: 6,
    opacity: 0.8,
  },
  
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.full,
    gap: 4,
  },
  
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Theme.colors.text.tertiary,
    opacity: 0.5,
  },
  
  rightSection: {
    alignItems: 'flex-end',
    marginRight: Theme.spacing.sm,
    gap: 6,
  },
  
  streakBadge: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.borderRadius.lg,
  },
  
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  
  xpBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.borderRadius.full,
  },
  
  deleteButton: {
    padding: 8,
    borderRadius: Theme.borderRadius.md,
  },
});

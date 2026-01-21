import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Habit } from '../../lib/habitsApi';
import { ThemedCard, ThemedText } from '../Themed';
import { useTheme } from '../../lib/themeContext';
import Theme, { getShadow } from '../../lib/theme';
import { getFrequencyDisplay, getCategoryColor, getCategoryIcon } from '../../lib/habitUtils';
import { isCompletedToday as checkIsCompletedToday } from '../../lib/dateHelper';

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
  
  // Simple animation values
  const scale = useSharedValue(1);
  const checkScale = useSharedValue(completed ? 1 : 0);
  const deleteScale = useSharedValue(1);
  
  const categoryColor = getCategoryColor(habit.category);
  const categoryIcon = getCategoryIcon(habit.category);
  const frequencyDisplay = getFrequencyDisplay(habit.frequency, habit.customFrequency);

  React.useEffect(() => {
    checkScale.value = withSpring(completed ? 1 : 0, { damping: 12, stiffness: 300 });
  }, [completed]);

  const handleToggle = React.useCallback(() => {
    if (isToggling) return;
    setIsToggling(true);
    
    // Simple press animation
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
    
    onToggle(habit.id);
    
    setTimeout(() => setIsToggling(false), 500);
  }, [isToggling, habit.id, onToggle]);

  const handleDeletePressIn = () => {
    deleteScale.value = withSpring(0.85, { damping: 15, stiffness: 400 });
  };

  const handleDeletePressOut = () => {
    deleteScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
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

  return (
    <Animated.View style={[cardAnimatedStyle, styles.container]}>
      <ThemedCard 
        variant={completed ? 'elevated' : 'default'}
        style={[
          styles.card,
          completed && { 
            borderLeftWidth: 4, 
            borderLeftColor: categoryColor,
          },
        ]}
      >
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
                completed 
                  ? [styles.checkboxChecked, { 
                      borderColor: categoryColor, 
                      backgroundColor: categoryColor,
                    }] 
                  : { 
                      borderColor: colors.border.medium, 
                      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                    },
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
                  {habit.streak === 1 ? 'day' : 'days'}
                </ThemedText>
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
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Theme.spacing.lg,
  },
  
  card: {
    position: 'relative',
    overflow: 'hidden',
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.xl,
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
    width: 32,
    height: 32,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
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

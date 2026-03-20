import React from 'react';
import { View, Pressable, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Habit } from '../../lib/habitsApi';
import { ThemedText } from '../Themed';
import { useTheme } from '../../lib/themeContext';
import { getCategoryColor, getCategoryIcon } from '../../lib/habitUtils';
import { isCompletedToday as checkIsCompletedToday } from '../../lib/dateHelper';
import { useHabitTimer } from '../../hooks/useHabitTimer';

export type HabitCardProps = {
  habit: Habit;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  disabled?: boolean;
};

function isCompletedToday(habit: Habit): boolean {
  return checkIsCompletedToday(habit.lastCompletedOn);
}

export default function HabitCard({ habit, onToggle, onDelete, disabled = false }: HabitCardProps) {
  const { colors, isDark } = useTheme();
  const completed = isCompletedToday(habit);
  const [isToggling, setIsToggling] = React.useState(false);
  const timer = useHabitTimer(habit.id);

  const scale = useSharedValue(1);
  const checkScale = useSharedValue(completed ? 1 : 0);

  const categoryColor = getCategoryColor(habit.category);
  const categoryIcon = getCategoryIcon(habit.category);

  React.useEffect(() => {
    checkScale.value = withSpring(completed ? 1 : 0, { damping: 12, stiffness: 300 });
  }, [completed]);

  // Auto-stop timer when habit is completed
  React.useEffect(() => {
    if (completed && timer.isRunning) {
      timer.stop();
    }
  }, [completed]);

  const handleToggle = React.useCallback(() => {
    if (disabled || isToggling) return;
    setIsToggling(true);
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
    onToggle(habit.id);
    setTimeout(() => setIsToggling(false), 500);
  }, [isToggling, habit.id, onToggle]);

  const handleTimerPress = React.useCallback(() => {
    if (completed) return;
    if (timer.isRunning) {
      timer.stop();
    } else {
      timer.start();
    }
  }, [completed, timer]);

  const handleTimerLongPress = React.useCallback(() => {
    Alert.alert('Reset Timer', 'Reset today\'s timer for this habit?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => timer.reset() },
    ]);
  }, [timer]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  const streakColor = habit.streak >= 30 ? '#F59E0B' : habit.streak >= 14 ? '#8B5CF6' : habit.streak >= 7 ? '#06B6D4' : '#FB923C';

  const timerColor = timer.isRunning
    ? colors.status.success
    : completed
      ? colors.text.tertiary
      : colors.text.secondary;

  return (
    <Animated.View style={[cardAnimatedStyle, styles.container]}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card.background,
            borderColor: completed ? `${categoryColor}30` : colors.border.light,
          },
          completed && { opacity: 0.75 },
        ]}
      >
        {/* ─── Row 1: Checkbox + Name + Delete ─── */}
        <View style={styles.topRow}>
          <Pressable
            onPress={handleToggle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View
              style={[
                styles.checkbox,
                completed
                  ? { borderColor: categoryColor, backgroundColor: categoryColor }
                  : { borderColor: colors.border.medium, backgroundColor: 'transparent' },
              ]}
            >
              <Animated.View style={checkAnimatedStyle}>
                <Ionicons name="checkmark" size={14} color="#fff" />
              </Animated.View>
            </View>
          </Pressable>

          <View style={styles.nameSection}>
            <ThemedText
              variant={completed ? 'secondary' : 'primary'}
              weight="semibold"
              size="base"
              numberOfLines={1}
              style={completed ? styles.strikethrough : undefined}
            >
              {habit.name}
            </ThemedText>
          </View>

          <Pressable
            onPress={() => onDelete(habit.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.5 }]}
          >
            <Ionicons name="close" size={16} color={colors.text.tertiary} />
          </Pressable>
        </View>

        {/* ─── Row 2: Meta chips ─── */}
        <View style={styles.bottomRow}>
          {/* Category */}
          <View style={[styles.chip, { backgroundColor: `${categoryColor}12` }]}>
            <Ionicons name={categoryIcon as any} size={11} color={categoryColor} />
            <ThemedText size="xs" style={{ color: categoryColor }}>
              {habit.category}
            </ThemedText>
          </View>

          {/* Streak */}
          {habit.streak > 0 && (
            <View style={[styles.chip, { backgroundColor: `${streakColor}12` }]}>
              <Ionicons name="flame" size={11} color={streakColor} />
              <ThemedText size="xs" weight="semibold" style={{ color: streakColor }}>
                {habit.streak}d
              </ThemedText>
            </View>
          )}

          {/* Timer */}
          <Pressable
            onPress={handleTimerPress}
            onLongPress={handleTimerLongPress}
            style={[
              styles.chip,
              {
                backgroundColor: timer.isRunning
                  ? `${colors.status.success}12`
                  : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              },
            ]}
          >
            <Ionicons
              name={timer.isRunning ? 'pause' : 'timer-outline'}
              size={11}
              color={timerColor}
            />
            <ThemedText
              size="xs"
              weight={timer.isRunning ? 'semibold' : 'normal'}
              style={{ color: timerColor, fontVariant: ['tabular-nums'] }}
            >
              {timer.display}
            </ThemedText>
          </Pressable>

          {/* XP */}
          {(habit.xp || 0) > 0 && (
            <View style={[styles.chip, { backgroundColor: `${colors.brand.primary}10` }]}>
              <Ionicons name="star" size={10} color={colors.brand.primary} />
              <ThemedText size="xs" weight="semibold" style={{ color: colors.brand.primary }}>
                {habit.xp}
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  // ── Row 1 ──
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameSection: {
    flex: 1,
    marginHorizontal: 12,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  deleteBtn: {
    padding: 4,
  },

  // ── Row 2 ──
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 36, // align with text (24 checkbox + 12 margin)
    gap: 6,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 4,
  },
});

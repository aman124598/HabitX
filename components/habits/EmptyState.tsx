import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView, ThemedText } from '../Themed';
import { useTheme } from '../../lib/themeContext';
import Theme from '../../lib/theme';

interface EmptyStateProps {
  onCreateHabit: () => void;
}

export default function EmptyState({ onCreateHabit }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <ThemedView variant="secondary" style={styles.container}>
      {/* Simple Icon */}
      <View style={[styles.iconContainer, { backgroundColor: `${colors.brand.primary}15` }]}>
        <Ionicons name="add-circle-outline" size={48} color={colors.brand.primary} />
      </View>

      {/* Title */}
      <ThemedText variant="primary" size="xl" weight="bold" align="center" style={styles.title}>
        No habits yet
      </ThemedText>

      {/* Subtitle */}
      <ThemedText variant="secondary" size="base" align="center" style={styles.subtitle}>
        Create your first habit to start tracking your progress
      </ThemedText>

      {/* CTA Button */}
      <Pressable
        onPress={onCreateHabit}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: colors.brand.primary },
          pressed && styles.buttonPressed,
        ]}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <ThemedText style={styles.buttonText}>
          Create Habit
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.xxxl,
    borderRadius: Theme.borderRadius.xl,
    marginTop: Theme.spacing.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.lg,
  },
  title: {
    marginBottom: Theme.spacing.sm,
  },
  subtitle: {
    marginBottom: Theme.spacing.xl,
    paddingHorizontal: Theme.spacing.md,
    opacity: 0.8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    gap: Theme.spacing.sm,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: Theme.fontSize.base,
    fontWeight: '600',
  },
});

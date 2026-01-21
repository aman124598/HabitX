import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withSequence, withTiming } from 'react-native-reanimated';
import Header from '../../components/habits/Header';
import FullScreenHabitForm from '../../components/habits/FullScreenHabitForm';
import HabitCard from '../../components/habits/HabitCard';
import EmptyState from '../../components/habits/EmptyState';
import { ThemedView, ThemedText, ThemedCard } from '../../components/Themed';
import { useHabits } from '../../hooks/useHabits';
import { useAuth } from '../../lib/authContext';
import { useTheme } from '../../lib/themeContext';
import { getGreeting, calculateCurrentStreak, calculateSuccessRate, isCompletedToday } from '../../lib/habitStats';
import Theme, { getShadow } from '../../lib/theme';

function MotivationalCard({ message }: { message: string }) {
  const { colors } = useTheme();
  
  // Get emoji and color based on message type
  const getStyle = () => {
    if (message.includes('Perfect') || message.includes('🎉')) {
      return { 
        icon: 'trophy', 
        color: '#FBBF24', 
        gradient: ['#FBBF24', '#F59E0B'] 
      };
    } else if (message.includes('Great') || message.includes('💪')) {
      return { 
        icon: 'rocket', 
        color: '#A855F7', 
        gradient: ['#A855F7', '#9333EA'] 
      };
    } else if (message.includes('halfway') || message.includes('🚀')) {
      return { 
        icon: 'trending-up', 
        color: '#06B6D4', 
        gradient: ['#06B6D4', '#0891B2'] 
      };
    } else if (message.includes('🔥')) {
      return { 
        icon: 'flame', 
        color: '#F97316', 
        gradient: ['#F97316', '#EA580C'] 
      };
    }
    return { 
      icon: 'star', 
      color: colors.status.warning, 
      gradient: [colors.status.warning, colors.status.warning] 
    };
  };
  
  const style = getStyle();
  
  return (
    <ThemedCard variant="default" style={styles.motivationalCard}>
      <View style={styles.motivationalContent}>
        <View 
          style={[styles.motivationalIconContainer, { backgroundColor: style.color }]}
        >
          <Ionicons name={style.icon as any} size={20} color="white" />
        </View>
        <ThemedText variant="primary" weight="semibold" size="sm" style={styles.motivationalText}>
          {message}
        </ThemedText>
      </View>
    </ThemedCard>
  );
}

// Empty state is now a separate component

export default function HomeTab() {
  const { habits, loading, addHabit, toggleHabit, confirmDelete } = useHabits();
  const { user } = useAuth();
  const { colors, isDark, setThemeMode } = useTheme();
  const [showAdd, setShowAdd] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [motivationalMessage, setMotivationalMessage] = useState('');
  const scaleAnim = useSharedValue(1);

  // Calculate dynamic stats
  const { greeting: baseGreeting, subtitle } = getGreeting();
  // Show just the greeting, username shown separately if needed
  const greeting = baseGreeting;
  const currentStreak = calculateCurrentStreak(habits);
  // Use today's completion percentage in the header so the displayed
  // 'Success Rate' matches the counts shown elsewhere on the screen.
  const todaySuccessRate = calculateSuccessRate(habits);
  const completedToday = habits.filter(h => isCompletedToday(h)).length;

  // Dynamic motivational messages based on progress
  useEffect(() => {
    if (habits.length === 0) {
      setMotivationalMessage("Start your first habit today! 🌟");
    } else if (todaySuccessRate === 100) {
      setMotivationalMessage("Perfect day! All habits completed! 🎉");
    } else if (todaySuccessRate >= 75) {
      setMotivationalMessage("Great progress! Keep it up! 💪");
    } else if (todaySuccessRate >= 50) {
      setMotivationalMessage("You're halfway there! 🚀");
    } else if (todaySuccessRate > 0) {
      setMotivationalMessage("Good start! Complete more habits today! ⭐");
    } else {
      setMotivationalMessage("Ready for a fresh start? Let's go! 🔥");
    }
  }, [habits, todaySuccessRate]);

  // Add subtle animation when stats change
  useEffect(() => {
    scaleAnim.value = withSequence(
      withTiming(1.02, { duration: 200 }),
      withTiming(1, { duration: 200 })
    );
  }, [currentStreak, todaySuccessRate]);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }]
  }));

  const handleCreateHabit = () => {
    setShowAdd(true);
  };

  const handleAddHabit = async (habitData: any) => {
    try {
      await addHabit(habitData);
      setShowAdd(false);
    } catch (error) {
      // Error is already handled by the useHabits hook
      // Keep the form open so user can try again
    }
  };

  return (
    <ThemedView variant="primary" style={styles.container}>
      <Animated.View style={headerAnimatedStyle}>
        <Header 
          greeting={greeting}
          subtitle={subtitle}
          currentStreak={currentStreak}
          successRate={todaySuccessRate}
          onProfile={() => {
            setShowProfile(true);
          }}
          onToggleTheme={() => setThemeMode(isDark ? 'light' : 'dark')}
        />
      </Animated.View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Motivational Message */}
        {motivationalMessage && habits.length > 0 && (
          <MotivationalCard message={motivationalMessage} />
        )}

        {/* Habit Form - show as full-screen card when adding a new habit */}
        <FullScreenHabitForm
          visible={showAdd}
          onCancel={() => setShowAdd(false)}
          onSubmit={handleAddHabit}
        />

        {/* Habits Section */}
        {habits.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <ThemedText 
                variant="primary" 
                size="xl" 
                weight="bold"
              >
                Today's Habits
              </ThemedText>
              <ThemedText 
                variant="secondary" 
                size="base"
                style={styles.progressText}
              >
                {completedToday}/{habits.length} completed
              </ThemedText>
              <Pressable 
                onPress={handleCreateHabit} 
                style={[styles.addButton, { backgroundColor: colors.brand.primary }]}
              >
                <Ionicons 
                  name="add" 
                  size={24} 
                  color={colors.text.inverse} 
                />
              </Pressable>
            </View>

            {loading && (
              <ThemedView variant="secondary" style={styles.loadingContainer}>
                <ActivityIndicator 
                  size="large" 
                  color={colors.brand.primary} 
                />
              </ThemedView>
            )}

            {!loading && habits.map(habit => (
              <HabitCard 
                key={habit.id} 
                habit={habit} 
                onToggle={toggleHabit} 
                onDelete={confirmDelete}
              />
            ))}

          </>
        )}

        {/* Empty State */}
        {!loading && habits.length === 0 && !showAdd && (
          <EmptyState onCreateHabit={handleCreateHabit} />
        )}
      </ScrollView>

    {/* Profile-only modal (opened from header profile button) */}
        <Modal
          visible={showProfile}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowProfile(false)}
        >
          <View style={styles.profileModalOverlay}>
            <ThemedCard variant="default" style={styles.profileModalContent}>
              <View style={styles.profileModalHeader}>
                <ThemedText variant="primary" size="xl" weight="bold">Profile</ThemedText>
                <Pressable onPress={() => setShowProfile(false)} style={styles.profileCloseButton}>
                  <Ionicons name="close" size={20} color={colors.text.primary} />
                </Pressable>
              </View>

              <View style={styles.userInfoCard}>
                <View style={[styles.avatarContainer, { backgroundColor: colors.background.tertiary }]}>
                  <Ionicons name="person" size={40} color={colors.brand.primary} />
                </View>
                <View style={styles.userDetails}>
                  <ThemedText variant="primary" weight="bold" size="xl">
                    {user?.username || 'User'}
                  </ThemedText>
                  <ThemedText variant="secondary" size="sm">
                    {user?.email || 'No email'}
                  </ThemedText>
                  <ThemedText variant="tertiary" size="xs" style={styles.memberSince}>
                    {habits.length} active habits
                  </ThemedText>
                </View>
              </View>
            </ThemedCard>
          </View>
        </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  scrollContent: { 
    padding: Theme.spacing.md,
    paddingTop: Theme.spacing.lg,
  },
  
  motivationalCard: {
    marginBottom: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
  },
  
  motivationalContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  motivationalIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  
  motivationalText: {
    flex: 1,
    lineHeight: 20,
  },
  
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
    marginHorizontal: Theme.spacing.xs,
    paddingHorizontal: Theme.spacing.sm,
  },
  
  progressText: {
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Theme.spacing.sm,
  },
  
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...getShadow('sm'),
  },
  
  xpCard: {
    marginHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  
  loadingContainer: {
    padding: Theme.spacing.xl,
    alignItems: 'center',
    marginVertical: Theme.spacing.md,
  },
  
  // Empty state styles moved to component
  profileModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  profileModalContent: {
    width: '100%',
    maxWidth: 420,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
  },
  profileModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  profileCloseButton: {
    padding: Theme.spacing.sm,
  },
  userInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.lg,
  },
  userDetails: {
    flex: 1,
  },
  memberSince: {
    marginTop: Theme.spacing.xs,
  },
});

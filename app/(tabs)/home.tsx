import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Modal, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import Header from '../../components/habits/Header';
import FullScreenHabitForm from '../../components/habits/FullScreenHabitForm';
import HabitCard from '../../components/habits/HabitCard';
import EmptyState from '../../components/habits/EmptyState';
import { ThemedView, ThemedText, ThemedCard } from '../../components/Themed';
import { useHabits } from '../../hooks/useHabits';
import { useAuth } from '../../lib/authContext';
import { useTheme } from '../../lib/themeContext';
import { getGreeting, calculateCurrentStreak, calculateSuccessRate, isCompletedToday, getToday } from '../../lib/habitStats';
import Theme, { getShadow } from '../../lib/theme';
import EditProfileModal from '../../components/settings/EditProfileModal';
import { UserAvatar } from '../../components/UserAvatar';

// Empty state is now a separate component

export default function HomeTab() {
  const { habits, loading, addHabit, toggleHabit, confirmDelete } = useHabits();
  const { user } = useAuth();
  const { colors, isDark, setThemeMode } = useTheme();
  const [showAdd, setShowAdd] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const scaleAnim = useSharedValue(1);

  // Load locally-stored avatar
  React.useEffect(() => {
    AsyncStorage.getItem('@habit_user_avatar').then(v => setLocalAvatar(v));
  }, [showEditProfile]); // Refresh when edit modal closes

  // Calculate dynamic stats
  const { greeting: baseGreeting, subtitle } = getGreeting();
  // Show just the greeting, username shown separately if needed
  const greeting = baseGreeting;
  const currentStreak = calculateCurrentStreak(habits);
  // Use today's completion percentage in the header so the displayed
  // 'Success Rate' matches the counts shown elsewhere on the screen.
  const todaySuccessRate = calculateSuccessRate(habits);

  // Format selected date to YYYY-MM-DD for comparison
  const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const todayStr = getToday();
  const isSelectedToday = selectedDateStr === todayStr;
  const isFutureDate = selectedDateStr > todayStr;

  // Future dates: no habits to show. Past/today: show habits created on or before that date.
  const filteredHabits = isFutureDate ? [] : habits.filter(h => {
    const startDate = h.startDate || h.createdAt?.split('T')[0];
    return startDate <= selectedDateStr;
  });

  const completedOnDate = filteredHabits.filter(h => h.lastCompletedOn === selectedDateStr).length;

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
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
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
        {/* Habit Form - show as full-screen card when adding a new habit */}
        <FullScreenHabitForm
          visible={showAdd}
          onCancel={() => setShowAdd(false)}
          onSubmit={handleAddHabit}
        />

        {/* Habits Section */}
        {filteredHabits.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <ThemedText
                variant="primary"
                size="xl"
                weight="bold"
              >
                {isSelectedToday ? "Today's Habits" : `${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
              </ThemedText>
              <ThemedText
                variant="secondary"
                size="base"
                style={styles.progressText}
              >
                {completedOnDate}/{filteredHabits.length} completed
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

            {!loading && filteredHabits.map(habit => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onToggle={isSelectedToday ? toggleHabit : () => {}}
                onDelete={confirmDelete}
                disabled={!isSelectedToday}
              />
            ))}

          </>
        )}

        {/* Empty State */}
        {!loading && filteredHabits.length === 0 && !showAdd && (
          isFutureDate ? (
            <View style={styles.futureMessage}>
              <Ionicons name="calendar-outline" size={48} color={colors.text.tertiary} />
              <ThemedText variant="tertiary" size="lg" weight="semibold" style={{ marginTop: 12, textAlign: 'center' }}>
                Future date
              </ThemedText>
              <ThemedText variant="tertiary" size="sm" style={{ marginTop: 4, textAlign: 'center' }}>
                Habits will appear here when this day arrives
              </ThemedText>
            </View>
          ) : (
            <EmptyState onCreateHabit={handleCreateHabit} />
          )
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
              <View style={{ marginRight: Theme.spacing.lg }}>
                <UserAvatar
                  username={user?.username || 'U'}
                  avatarUrl={localAvatar || user?.avatar}
                  size="lg"
                />
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

            <Pressable
              onPress={() => { setShowProfile(false); setShowEditProfile(true); }}
              style={[styles.editProfileBtn, { backgroundColor: colors.brand.primary }]}
            >
              <Ionicons name="create-outline" size={18} color="#FFFFFF" />
              <ThemedText weight="semibold" size="base" style={{ color: '#FFFFFF', marginLeft: 8 }}>
                Edit Profile
              </ThemedText>
            </Pressable>
          </ThemedCard>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfile}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditProfile(false)}
      >
        <EditProfileModal
          visible={showEditProfile}
          onClose={() => setShowEditProfile(false)}
        />
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
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Theme.borderRadius.lg,
    marginTop: Theme.spacing.lg,
  },
  userDetails: {
    flex: 1,
  },
  memberSince: {
    marginTop: Theme.spacing.xs,
  },
  futureMessage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.xxxxl,
    paddingHorizontal: Theme.spacing.xl,
  },
});

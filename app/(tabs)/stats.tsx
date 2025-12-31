import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useHabits } from '../../hooks/useHabits';
import { useStreakCelebration } from '../../hooks/useStreakCelebration';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import { getToday, isCompletedToday, calculateOverallSuccessRate } from '../../lib/habitStats';
import { Habit } from '../../lib/habitsApi';
import { ThemedView, ThemedText, ThemedCard, ThemedButton, ThemedProgressBar } from '../../components/Themed';
import { XPIndicator } from '../../components/gamification/XPIndicator';
import { GamificationDashboard } from '../../components/gamification/GamificationDashboard';
import StreakCelebration from '../../components/streaks/StreakCelebration';
import { gamificationService } from '../../lib/gamificationService';
import { useTheme } from '../../lib/themeContext';
import Theme from '../../lib/theme';

const { width } = Dimensions.get('window');

interface ChartBarProps {
  day: string;
  completionRate: number;
  isToday: boolean;
  width?: number;
}

function ChartBar({ day, completionRate, isToday, width = 16 }: ChartBarProps) {
  // Ensure completion rate is properly capped between 0-100
  const safeCompletionRate = Math.min(100, Math.max(0, completionRate));
  const color = safeCompletionRate >= 75 ? Theme.colors.status.success : safeCompletionRate >= 40 ? Theme.colors.brand.primary : Theme.colors.status.warning;

  return (
    <View style={[styles.chartColumn, { width: Math.max(48, width) }]}>
      <ThemedText variant="tertiary" size="xs" style={styles.chartPercentageTop}>{safeCompletionRate}%</ThemedText>
      <View style={styles.chartBarContainer}>
        <View
          style={[
            styles.chartBar,
            {
              height: Math.max(4, Math.min(80, (safeCompletionRate / 100) * 80)),
              backgroundColor: isToday ? Theme.colors.brand.primary : color,
              width: Math.max(8, width - 4),
            }
          ]}
        />
      </View>
      <ThemedText
        variant={isToday ? 'accent' : 'tertiary'}
        size="xs"
        weight="semibold"
        style={styles.chartDayLabel}
      >
        {day}
      </ThemedText>
    </View>
  );
}

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  label: string;
  color?: string;
}

function StatCard({ icon, value, label, color = Theme.colors.brand.primary }: StatCardProps) {
  return (
    <ThemedCard variant="elevated" style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <ThemedText variant="primary" size="xxxl" weight="extrabold" style={styles.statNumber}>
        {value}
      </ThemedText>
      <ThemedText variant="secondary" size="sm" style={styles.statLabel}>
        {label}
      </ThemedText>
    </ThemedCard>
  );
}

interface HabitPerformanceItemProps {
  habit: Habit;
}

function HabitPerformanceItem({ habit }: HabitPerformanceItemProps) {
  // Calculate progress percentage with proper capping
  const progressPercentage = Math.min(100, Math.max(0, (habit.streak / 30) * 100));

  return (
    <View style={styles.habitRow}>
      <View style={styles.habitInfo}>
        <ThemedText variant="primary" size="base" weight="semibold" style={styles.habitName}>
          {habit.name}
        </ThemedText>
        <ThemedProgressBar 
          progress={progressPercentage} 
          height={6} 
          style={{ marginTop: 8 }}
        />
      </View>
      <View style={styles.habitStats}>
        <ThemedText variant="accent" size="xl" weight="extrabold">
          {habit.streak}
        </ThemedText>
        <ThemedText variant="tertiary" size="xs">
          days
        </ThemedText>
      </View>
    </View>
  );
}

export default function StatsTab() {
  const { colors } = useTheme();
  const router = useRouter();
  const { habits, loading, refresh } = useHabits();
  const { userPosition, fetchUserPosition } = useLeaderboard();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');
  const [showGamificationDashboard, setShowGamificationDashboard] = useState(false);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);

  // Refresh data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refresh();
      // Only fetch user position if user has XP
      const totalXP = habits.reduce((sum, habit) => sum + (habit.xp || 0), 0);
      if (totalXP > 0) {
        fetchUserPosition().catch(console.error);
      }
    }, [refresh, fetchUserPosition, habits])
  );

  // Memoized calculations that update when habits or selected period change
  const periodData = useMemo(() => {
    const today = new Date();

    // WEEK: last 7 days (daily bars)
    if (selectedPeriod === 'week') {
      const data: Array<any> = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const completedHabits = habits.filter(habit => habit.lastCompletedOn === dateStr).length;
        const totalHabits = habits.length || 1;
        const completionRate = habits.length === 0 ? 0 : Math.min(100, Math.round((completedHabits / totalHabits) * 100));

        data.push({
          label: date.toLocaleDateString('en', { weekday: 'short' }),
          date: dateStr,
          completionRate,
          completedCount: completedHabits,
          totalCount: totalHabits,
          isToday: dateStr === getToday(),
        });
      }
      return data;
    }

    // MONTH: show last 30 days as daily bars (horizontal scroll)
    const days = 30;
    const data: Array<any> = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const completedHabits = habits.filter(habit => habit.lastCompletedOn === dateStr).length;
      const totalHabits = habits.length || 1;
      const completionRate = habits.length === 0 ? 0 : Math.min(100, Math.round((completedHabits / totalHabits) * 100));

      data.push({
        label: date.toLocaleDateString('en', { day: 'numeric' }),
        date: dateStr,
        completionRate,
        completedCount: completedHabits,
        totalCount: totalHabits,
        isToday: dateStr === getToday(),
      });
    }

    return data;
  }, [habits, selectedPeriod]);

  // Memoized gamification data
  const gamificationData = useMemo(() => {
    if (habits.length === 0) return null;
    return gamificationService.getGamificationData(habits, gamificationService.getCachedUserGamification() || undefined);
  }, [habits]);

  const getTotalStreakDays = useCallback(() => {
    return habits.reduce((total, habit) => total + habit.streak, 0);
  }, [habits]);

  const getAverageStreak = useCallback(() => {
    if (habits.length === 0) return 0;
    return Math.round(getTotalStreakDays() / habits.length);
  }, [habits, getTotalStreakDays]);

  const getBestPerformingHabit = useCallback(() => {
    if (habits.length === 0) return null;
    return habits.reduce((best, current) => 
      current.streak > best.streak ? current : best
    );
  }, [habits]);

  const getCompletionTrend = useCallback(() => {
    const data = periodData;
    if (!data || data.length < 2) return 'neutral';

    const third = Math.max(1, Math.floor(data.length / 3));
    const recentSlice = data.slice(-third);
    const earlierSlice = data.slice(0, data.length - third);

    const recent = recentSlice.reduce((sum: number, d: any) => sum + d.completionRate, 0) / recentSlice.length;
    const earlier = earlierSlice.reduce((sum: number, d: any) => sum + d.completionRate, 0) / earlierSlice.length;

    if (recent > earlier + 10) return 'improving';
    if (recent < earlier - 10) return 'declining';
    return 'stable';
  }, [periodData]);

  const getTodayCompletedCount = useCallback(() => {
    return habits.filter(h => isCompletedToday(h)).length;
  }, [habits]);

  // Memoized values
  const totalStreakDays = getTotalStreakDays();
  const averageStreak = getAverageStreak();
  const bestHabit = getBestPerformingHabit();
  const trend = getCompletionTrend();
  const todayCompleted = getTodayCompletedCount();

  // Check for streak milestones
  const streakCelebration = useStreakCelebration(totalStreakDays);

  // Auto-show celebration on milestone
  useEffect(() => {
    if (streakCelebration.shouldShow && !loading) {
      setShowStreakCelebration(true);
    }
  }, [streakCelebration.shouldShow, loading]);

  // Calculate week progress for streak celebration
  const getWeekProgress = useCallback(() => {
    const today = new Date();
    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const progress = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - today.getDay() + i); // Start from Sunday
      const dateStr = date.toISOString().split('T')[0];
      
      const completedCount = habits.filter(h => h.lastCompletedOn === dateStr).length;
      const isCompleted = completedCount > 0;
      
      progress.push({
        day: weekDays[i],
        completed: isCompleted,
      });
    }
    
    return progress;
  }, [habits]);

  // Get next perfect streak day
  const getNextPerfectStreakDay = () => {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const nextSaturday = new Date(today);
    nextSaturday.setDate(today.getDate() + (6 - today.getDay() + 7) % 7);
    return daysOfWeek[nextSaturday.getDay()];
  };
  
  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <LinearGradient 
        colors={Theme.colors.brand.gradient} 
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ThemedText variant="inverse" size="xxxl" weight="extrabold">
          Your Progress
        </ThemedText>
        <ThemedText variant="inverse" size="base" style={styles.headerSubtitle}>
          Track your habit journey and celebrate wins
        </ThemedText>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <ThemedCard variant="default" style={styles.periodSelector}>
          <View style={styles.periodButtonWrapper}>
            <ThemedButton
              variant={selectedPeriod === 'week' ? 'primary' : 'ghost'}
              size="sm"
              onPress={() => setSelectedPeriod('week')}
              style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive] as any}
            >
              Week
            </ThemedButton>
          </View>

          <View style={styles.periodButtonWrapper}>
            <ThemedButton
              variant={selectedPeriod === 'month' ? 'primary' : 'ghost'}
              size="sm"
              onPress={() => setSelectedPeriod('month')}
              style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive] as any}
            >
              Month
            </ThemedButton>
          </View>
        </ThemedCard>

        {/* Gamification Section */}
        {habits.length > 0 && (
          <ThemedCard variant="elevated" style={styles.gamificationCard}>
            <View style={styles.gamificationHeader}>
              <View style={styles.gamificationTitleSection}>
                <ThemedText variant="primary" size="lg" weight="bold">
                  🎮 Level & Progress
                </ThemedText>
                <ThemedText variant="secondary" size="xs">
                  Earn XP by completing habits
                </ThemedText>
              </View>
              <View style={styles.gamificationButtons}>
                <Pressable 
                  onPress={() => {
                    router.push('/GlobalLeaderboard');
                  }}
                  style={[styles.gamificationButton, styles.leaderboardButton]}
                >
                  <Ionicons name="trophy" size={12} color="white" />
                  <ThemedText variant="inverse" size="xs" weight="medium">
                    Leaderboard
                  </ThemedText>
                </Pressable>
                <Pressable 
                  onPress={() => {
                    setShowGamificationDashboard(true);
                  }}
                  style={[styles.gamificationButton, styles.primaryButton]}
                >
                  <ThemedText variant="inverse" size="xs" weight="medium">
                    View All
                  </ThemedText>
                </Pressable>
              </View>
            </View>
            <View style={styles.xpIndicatorContainer}>
              <XPIndicator habits={habits} gamificationData={gamificationData} />
            </View>
          </ThemedCard>
        )}

        {/* Quick Stats - Clean 2x2 Grid */}
        <View style={styles.statsSection}>
          <ThemedText variant="primary" size="lg" weight="bold" style={styles.sectionTitle}>
            📊 Quick Stats
          </ThemedText>
          <View style={styles.statsGrid}>
            <Pressable onPress={() => totalStreakDays > 0 && setShowStreakCelebration(true)} style={styles.statCardContainer}>
              <StatCard
                icon="flame"
                value={totalStreakDays}
                label="Streak Days"
                color={colors.status.warning}
              />
            </Pressable>
            <Pressable onPress={() => router.push('/GlobalLeaderboard')} style={styles.statCardContainer}>
              <StatCard
                icon="trophy"
                value={userPosition?.rank || 0}
                label={userPosition?.rank ? `Rank #${userPosition.rank}` : "Unranked"}
                color={colors.status.success}
              />
            </Pressable>
            <View style={styles.statCardContainer}>
              <StatCard
                icon="star"
                value={gamificationData?.totalXP || 0}
                label="Total XP"
                color={colors.brand.primary}
              />
            </View>
            <View style={styles.statCardContainer}>
              <StatCard
                icon="checkmark-done"
                value={calculateOverallSuccessRate(habits)}
                label="Success Rate"
                color={colors.status.info}
              />
            </View>
          </View>
        </View>

        {/* Today's Progress */}
        <ThemedCard variant="elevated" style={styles.todayCard}>
          <ThemedText variant="primary" size="lg" weight="bold" style={styles.sectionTitle}>
            📅 Today's Progress
          </ThemedText>
          <View style={styles.todayStats}>
            <View style={styles.todayStatItem}>
              <ThemedText variant="accent" size="xxl" weight="extrabold">
                {todayCompleted}
              </ThemedText>
              <ThemedText variant="secondary" size="xs">
                Completed
              </ThemedText>
            </View>
            <View style={styles.todayStatSeparator} />
            <View style={styles.todayStatItem}>
              <ThemedText variant="primary" size="xxl" weight="extrabold">
                {habits.length}
              </ThemedText>
              <ThemedText variant="secondary" size="xs">
                Total Habits
              </ThemedText>
            </View>
            <View style={styles.todayStatSeparator} />
            <View style={styles.todayStatItem}>
              <ThemedText variant="accent" size="xxl" weight="extrabold">
                {habits.length > 0 ? Math.min(100, Math.round((todayCompleted / habits.length) * 100)) : 0}%
              </ThemedText>
              <ThemedText variant="secondary" size="xs">
                Success Rate
              </ThemedText>
            </View>
          </View>
        </ThemedCard>

        {/* Weekly Progress Chart */}
        <ThemedCard variant="elevated" style={styles.chartCard}>
          <ThemedText variant="primary" size="lg" weight="bold" style={styles.sectionTitle}>
            📈 {selectedPeriod === 'week' ? 'Weekly' : 'Monthly'} Progress
          </ThemedText>
          {selectedPeriod === 'month' ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChartContainer}>
              {periodData.map((entry, index) => (
                <ChartBar
                  key={index}
                  day={entry.label}
                  completionRate={entry.completionRate}
                  isToday={entry.isToday}
                  width={48}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.chart}>
              {periodData.map((entry, index) => (
                <ChartBar
                  key={index}
                  day={entry.label}
                  completionRate={entry.completionRate}
                  isToday={entry.isToday}
                />
              ))}
            </View>
          )}
        </ThemedCard>

        {/* Habit Performance */}
        <ThemedCard variant="elevated" style={styles.performanceCard}>
          <ThemedText variant="primary" size="xl" weight="bold" style={styles.sectionTitle}>
            Habit Performance
          </ThemedText>
          {habits.length > 0 ? (
            habits.map((habit) => (
              <HabitPerformanceItem key={habit.id} habit={habit} />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="bar-chart-outline" size={48} color={colors.text.tertiary} />
              <ThemedText variant="secondary" size="base" style={styles.emptyText}>
                No habits to track yet
              </ThemedText>
            </View>
          )}
        </ThemedCard>

        {/* Insights */}
        <ThemedCard variant="elevated" style={styles.insightsCard}>
          <ThemedText variant="primary" size="xl" weight="bold" style={styles.sectionTitle}>
            Insights
          </ThemedText>
          
          {bestHabit && (
            <View style={styles.insightItem}>
              <View style={[styles.insightIcon, { backgroundColor: `${Theme.colors.status.warning}20` }]}>
                <Ionicons name="star" size={20} color={Theme.colors.status.warning} />
              </View>
              <ThemedText variant="primary" size="sm" style={styles.insightText}>
                Your best habit is "{bestHabit.name}" with a {bestHabit.streak}-day streak! 🏆
              </ThemedText>
            </View>
          )}
          
          <View style={styles.insightItem}>
            <View style={[
              styles.insightIcon, 
              { backgroundColor: `${
                trend === 'improving' ? Theme.colors.status.success : 
                trend === 'declining' ? Theme.colors.status.error : 
                Theme.colors.text.secondary
              }20` }
            ]}>
              <Ionicons 
                name={trend === 'improving' ? 'trending-up' : trend === 'declining' ? 'trending-down' : 'remove'} 
                size={20} 
                color={
                  trend === 'improving' ? Theme.colors.status.success : 
                  trend === 'declining' ? Theme.colors.status.error : 
                  Theme.colors.text.secondary
                } 
              />
            </View>
            <ThemedText variant="primary" size="sm" style={styles.insightText}>
              {trend === 'improving' && "You're on an upward trend! Keep it up! 📈"}
              {trend === 'declining' && "Your completion rate is declining. Stay focused! 💪"}
              {trend === 'stable' && "Your habit completion is stable. Great consistency! ⚖️"}
            </ThemedText>
          </View>

          {habits.length > 0 && (
            <View style={styles.insightItem}>
              <View style={[styles.insightIcon, { backgroundColor: `${Theme.colors.status.success}20` }]}>
                <Ionicons name="checkmark-circle" size={20} color={Theme.colors.status.success} />
              </View>
              <ThemedText variant="primary" size="sm" style={styles.insightText}>
                You've completed {todayCompleted} out of {habits.length} habits today. 
                {todayCompleted === habits.length ? " Perfect! 🎉" : " Keep going! 💪"}
              </ThemedText>
            </View>
          )}
        </ThemedCard>
      </ScrollView>
      
      {/* Gamification Dashboard Modal */}
      <GamificationDashboard
        habits={habits}
        visible={showGamificationDashboard}
        onClose={() => setShowGamificationDashboard(false)}
        gamificationData={gamificationData}
      />

      {/* Streak Celebration Modal */}
      <Modal
        visible={showStreakCelebration}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setShowStreakCelebration(false)}
      >
        <StreakCelebration
          streakCount={totalStreakDays}
          weekProgress={getWeekProgress()}
          perfectStreakDay={getNextPerfectStreakDay()}
          onContinue={() => setShowStreakCelebration(false)}
        />
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },

  header: { 
    paddingTop: 64, 
    paddingBottom: Theme.spacing.xxl, 
    paddingHorizontal: Theme.spacing.lg,
  },

  headerSubtitle: { 
    marginTop: Theme.spacing.xs,
    opacity: 0.9,
  },

  content: { 
    flex: 1, 
    padding: Theme.spacing.md,
  },

  periodSelector: {
    flexDirection: 'row',
    padding: Theme.spacing.sm,
    marginBottom: Theme.spacing.lg,
    gap: Theme.spacing.sm,
  },

  periodButton: {
    flex: 1,
    borderRadius: Theme.borderRadius.md,
    overflow: 'hidden',
    paddingVertical: Theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
  },

  statsSection: {
    marginBottom: Theme.spacing.lg,
  },

  statCardContainer: {
    width: '48%', // 2 cards per row with gap
  },

  statCard: {
    alignItems: 'center',
    padding: Theme.spacing.md,
    minHeight: 100,
    borderRadius: Theme.borderRadius.lg,
  },

  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.sm,
  },

  statNumber: { 
    marginBottom: Theme.spacing.xs,
  },

  statLabel: { 
    textAlign: 'center',
  },

  todayCard: {
    marginBottom: Theme.spacing.lg,
    padding: Theme.spacing.md,
  },

  todayStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Theme.spacing.md,
  },

  todayStatItem: {
    alignItems: 'center',
    flex: 1,
  },

  todayStatSeparator: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: Theme.spacing.sm,
  },

  chartCard: {
    marginBottom: Theme.spacing.lg,
    padding: Theme.spacing.md,
  },

  sectionTitle: { 
    marginBottom: Theme.spacing.sm,
  },

  chart: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-end',
    paddingHorizontal: Theme.spacing.xs,
  },
  chartColumn: { 
    alignItems: 'center', 
    flex: 1,
    paddingHorizontal: 2,
  },

  chartBarContainer: { 
    height: 80, 
    justifyContent: 'flex-end', 
    marginBottom: Theme.spacing.sm,
    alignItems: 'center',
  },

  chartBar: { 
    width: 16, 
    borderRadius: Theme.borderRadius.lg, 
    minHeight: 4,
    maxHeight: 80,
  },

  chartPercentageTop: {
    textAlign: 'center',
    marginBottom: Theme.spacing.sm,
    minHeight: 16,
  },

  chartDayLabel: {
    marginTop: Theme.spacing.sm,
    textAlign: 'center',
  },

  horizontalChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
  },

  chartPercentage: { 
    marginTop: 2,
  },

  performanceCard: {
    marginBottom: Theme.spacing.lg,
    padding: Theme.spacing.md,
  },

  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
    paddingBottom: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border.light,
  },

  habitInfo: { 
    flex: 1, 
    marginRight: Theme.spacing.md,
  },

  habitName: { 
    marginBottom: Theme.spacing.xs,
  },

  progressBar: {
    height: 4,
    backgroundColor: Theme.colors.border.light,
    borderRadius: Theme.borderRadius.xs,
    overflow: 'hidden',
    width: '100%',
  },

  progressFill: {
    height: '100%',
    backgroundColor: Theme.colors.brand.primary,
    borderRadius: Theme.borderRadius.xs,
    maxWidth: '100%',
  },

  habitStats: { 
    alignItems: 'center',
  },

  insightsCard: {
    marginBottom: Theme.spacing.lg,
    padding: Theme.spacing.md,
  },

  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
  },

  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.sm,
    marginTop: 2,
  },

  insightText: {
    flex: 1,
    lineHeight: 20,
  },

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
    paddingHorizontal: Theme.spacing.lg,
  },

  emptyText: {
    marginTop: Theme.spacing.sm,
    textAlign: 'center',
  },

  gamificationCard: {
    marginBottom: Theme.spacing.lg,
    padding: Theme.spacing.md,
  },

  gamificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },

  gamificationTitleSection: {
    flex: 1,
  },

  gamificationButtons: {
    flexDirection: 'row',
    gap: Theme.spacing.xs,
  },

  gamificationButton: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
  },

  leaderboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F59E0B', // Warning color
  },

  primaryButton: {
    backgroundColor: '#3B82F6', // Primary color
  },

  xpIndicatorContainer: {
    marginTop: Theme.spacing.sm,
  },

  periodButtonWrapper: {
    flex: 1,
    borderRadius: Theme.borderRadius.md,
    overflow: 'visible',
  },

  periodButtonActive: {
    // Keep active state subtle: no extra shadow to avoid visual offset
  },
});

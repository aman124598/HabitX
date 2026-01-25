import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useHabits } from '../../hooks/useHabits';
import { useXP } from '../../hooks/useXP';
import { useAuth } from '../../lib/authContext';
import { getToday, isCompletedToday } from '../../lib/habitStats';
import { Habit } from '../../lib/habitsApi';
import { ThemedView, ThemedText } from '../../components/Themed';
import { useTheme } from '../../lib/themeContext';

const { width } = Dimensions.get('window');

// ============ App Logo Component ============
function AppLogo({ size = 32 }: { size?: number }) {
  return (
    <Image 
      source={require('../../assets/images/app-icon.png')} 
      style={{ width: size, height: size, borderRadius: 8 }}
      resizeMode="contain"
    />
  );
}

// ============ Profile Card Component ============
function ProfileCard() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { habits } = useHabits();
  const { totalXP, level, progressToNextLevel } = useXP();
  
  const xpToNextLevel = 100 - (totalXP % 100);
  const totalStreaks = habits.reduce((sum, h) => sum + h.streak, 0);
  
  return (
    <View style={[styles.profileCard, { backgroundColor: colors.card.background, borderColor: colors.border.light }]}>
      {/* User Info */}
      <View style={styles.profileHeader}>
        <View style={[styles.avatar, { backgroundColor: colors.brand.primary }]}>
          <ThemedText style={styles.avatarText}>
            {(user?.username || 'U').charAt(0).toUpperCase()}
          </ThemedText>
        </View>
        <View style={styles.profileInfo}>
          <ThemedText variant="primary" weight="bold" size="xl">
            {user?.username || 'User'}
          </ThemedText>
          <ThemedText variant="tertiary" size="sm">
            {user?.email || 'Building better habits'}
          </ThemedText>
        </View>
        <View style={[styles.levelBadge, { backgroundColor: colors.brand.primary }]}>
          <ThemedText style={styles.levelText}>Lv.{level}</ThemedText>
        </View>
      </View>
      
      {/* XP Progress */}
      <View style={styles.xpSection}>
        <View style={styles.xpHeader}>
          <ThemedText variant="primary" weight="semibold" size="sm">
            {totalXP} XP
          </ThemedText>
          <ThemedText variant="tertiary" size="xs">
            {xpToNextLevel} to next level
          </ThemedText>
        </View>
        <View style={[styles.xpProgressBg, { backgroundColor: colors.background.tertiary }]}>
          <View 
            style={[
              styles.xpProgressFill, 
              { backgroundColor: colors.brand.primary, width: `${progressToNextLevel}%` }
            ]} 
          />
        </View>
      </View>
      
      {/* Quick Stats */}
      <View style={styles.profileStats}>
        <View style={styles.profileStat}>
          <ThemedText variant="primary" weight="bold" size="xl">{habits.length}</ThemedText>
          <ThemedText variant="tertiary" size="xs">Habits</ThemedText>
        </View>
        <View style={[styles.profileStatDivider, { backgroundColor: colors.border.light }]} />
        <View style={styles.profileStat}>
          <ThemedText variant="primary" weight="bold" size="xl">{totalStreaks}</ThemedText>
          <ThemedText variant="tertiary" size="xs">Total Streaks</ThemedText>
        </View>
        <View style={[styles.profileStatDivider, { backgroundColor: colors.border.light }]} />
        <View style={styles.profileStat}>
          <ThemedText variant="primary" weight="bold" size="xl">{level}</ThemedText>
          <ThemedText variant="tertiary" size="xs">Level</ThemedText>
        </View>
      </View>
    </View>
  );
}

// ============ Stat Card Component ============
function StatCard({ icon, value, label, color }: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  color: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card.background, borderColor: colors.border.light }]}>
      <View style={[styles.statIconBox, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <ThemedText variant="primary" size="xl" weight="bold">{value}</ThemedText>
      <ThemedText variant="tertiary" size="xs">{label}</ThemedText>
    </View>
  );
}

// ============ Helper: Calculate days ago ============
function getDaysAgo(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
}

// ============ Helper: Check if habit was completed on date using streak ============
function wasCompletedOnDate(habit: Habit, dateStr: string, todayStr: string): boolean {
  // For today, use isCompletedToday (checks lastCompletedOn === today)
  if (dateStr === todayStr) {
    return isCompletedToday(habit, todayStr);
  }
  
  // For past dates, use streak to estimate
  // If streak >= daysAgo and lastCompletedOn is today or yesterday, the habit was completed
  const daysAgo = getDaysAgo(dateStr);
  
  // If the habit has never been completed
  if (!habit.lastCompletedOn) {
    return false;
  }
  
  // Calculate how many days since last completion
  const daysSinceLastCompletion = getDaysAgo(habit.lastCompletedOn);
  
  // If the streak covers this date (streak is consecutive days)
  // The habit was completed on dateStr if: daysSinceLastCompletion + streak > daysAgo
  // In other words, the streak started (daysAgo - streak) days ago from lastCompletion
  if (habit.streak > 0 && daysSinceLastCompletion <= daysAgo && habit.streak >= (daysAgo - daysSinceLastCompletion + 1)) {
    return true;
  }
  
  return false;
}

// ============ Week View Component ============
function WeekView({ habits }: { habits: Habit[] }) {
  const { colors } = useTheme();
  const today = new Date();
  const todayStr = getToday();
  
  const weekData = useMemo(() => {
    const data = [];
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Calculate completion using streak-based estimation
      const completedCount = habits.filter(h => wasCompletedOnDate(h, dateStr, todayStr)).length;
      const totalCount = habits.length || 1;
      const completionRate = habits.length === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
      
      data.push({
        day: dayNames[i],
        date: date.getDate(),
        completionRate,
        isToday: dateStr === todayStr,
        isPast: dateStr < todayStr,
        isFuture: dateStr > todayStr,
      });
    }
    return data;
  }, [habits, today, todayStr]);

  return (
    <View style={[styles.weekCard, { backgroundColor: colors.card.background, borderColor: colors.border.light }]}>
      <ThemedText variant="primary" size="base" weight="bold" style={styles.cardTitle}>
        This Week
      </ThemedText>
      <View style={styles.weekContainer}>
        {weekData.map((day, index) => (
          <View key={index} style={styles.dayColumn}>
            <ThemedText variant="tertiary" size="xs" weight="medium">
              {day.day}
            </ThemedText>
            <View 
              style={[
                styles.dayCircle,
                { backgroundColor: colors.background.tertiary },
                day.isToday && { borderColor: colors.brand.primary, borderWidth: 2 },
                day.completionRate === 100 && !day.isFuture && { backgroundColor: colors.status.success },
                day.completionRate > 0 && day.completionRate < 100 && !day.isFuture && { backgroundColor: colors.status.warning },
                day.isPast && day.completionRate === 0 && { backgroundColor: `${colors.status.error}40` },
              ]}
            >
              {day.completionRate === 100 && !day.isFuture ? (
                <Ionicons name="checkmark" size={14} color="#fff" />
              ) : (
                <ThemedText variant="primary" size="xs" weight="semibold">
                  {day.date}
                </ThemedText>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ============ Month View Component ============
function MonthView({ habits }: { habits: Habit[] }) {
  const { colors } = useTheme();
  const today = new Date();
  const todayStr = getToday();
  
  const monthData = useMemo(() => {
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Calculate completion using streak-based estimation
      const completedCount = habits.filter(h => wasCompletedOnDate(h, dateStr, todayStr)).length;
      const completionRate = habits.length === 0 ? 0 : Math.round((completedCount / habits.length) * 100);
      
      data.push({ dateStr, completionRate, isToday: dateStr === todayStr });
    }
    return data;
  }, [habits, today]);

  const perfectDays = monthData.filter(d => d.completionRate === 100).length;
  const avgCompletion = Math.round(monthData.reduce((sum, d) => sum + d.completionRate, 0) / monthData.length);
  
  const getColor = (rate: number) => {
    if (rate === 100) return colors.status.success;
    if (rate >= 50) return colors.status.warning;
    if (rate > 0) return `${colors.status.error}80`;
    return colors.background.tertiary;
  };

  return (
    <View style={[styles.monthCard, { backgroundColor: colors.card.background, borderColor: colors.border.light }]}>
      <View style={styles.monthHeader}>
        <ThemedText variant="primary" size="base" weight="bold">Last 30 Days</ThemedText>
        <View style={styles.monthStats}>
          <View style={styles.monthStatItem}>
            <ThemedText style={{ color: colors.brand.primary }} weight="bold">{perfectDays}</ThemedText>
            <ThemedText variant="tertiary" size="xs"> perfect</ThemedText>
          </View>
        </View>
      </View>
      
      <View style={styles.monthGrid}>
        {monthData.map((day, index) => (
          <View 
            key={index} 
            style={[
              styles.monthCell,
              { backgroundColor: getColor(day.completionRate) },
              day.isToday && { borderWidth: 2, borderColor: colors.brand.primary },
            ]}
          />
        ))}
      </View>
      
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.background.tertiary }]} />
          <ThemedText variant="tertiary" size="xs">0%</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: `${colors.status.error}80` }]} />
          <ThemedText variant="tertiary" size="xs">1-49%</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.status.warning }]} />
          <ThemedText variant="tertiary" size="xs">50-99%</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.status.success }]} />
          <ThemedText variant="tertiary" size="xs">100%</ThemedText>
        </View>
      </View>
    </View>
  );
}

// ============ Habit Streak List ============
function HabitStreakList({ habits }: { habits: Habit[] }) {
  const { colors } = useTheme();
  const sortedHabits = useMemo(() => [...habits].sort((a, b) => b.streak - a.streak), [habits]);

  if (habits.length === 0) {
    return (
      <View style={[styles.streakCard, { backgroundColor: colors.card.background, borderColor: colors.border.light }]}>
        <ThemedText variant="primary" size="base" weight="bold" style={styles.cardTitle}>
          Streaks
        </ThemedText>
        <View style={styles.emptyState}>
          <Ionicons name="flame-outline" size={32} color={colors.text.tertiary} />
          <ThemedText variant="tertiary" size="sm" style={{ marginTop: 8 }}>No habits yet</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.streakCard, { backgroundColor: colors.card.background, borderColor: colors.border.light }]}>
      <ThemedText variant="primary" size="base" weight="bold" style={styles.cardTitle}>
        Streaks
      </ThemedText>
      {sortedHabits.slice(0, 5).map((habit) => (
        <View key={habit.id} style={[styles.habitRow, { borderBottomColor: colors.border.light }]}>
          <View style={styles.habitInfo}>
            <ThemedText variant="primary" size="sm" weight="medium" numberOfLines={1}>
              {habit.name}
            </ThemedText>
            <View style={[styles.streakBarBg, { backgroundColor: colors.background.tertiary }]}>
              <View 
                style={[
                  styles.streakBarFill,
                  { backgroundColor: colors.brand.primary, width: `${Math.min(100, (habit.streak / 30) * 100)}%` }
                ]} 
              />
            </View>
          </View>
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={14} color={colors.status.warning} />
            <ThemedText variant="primary" size="sm" weight="bold">{habit.streak}</ThemedText>
          </View>
        </View>
      ))}
    </View>
  );
}

// ============ Main Stats Page ============
export default function StatsTab() {
  const { colors } = useTheme();
  const { habits, refresh, loading: habitsLoading } = useHabits();
  const { refresh: refreshXP, loading: xpLoading, totalXP } = useXP();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh both habits and XP when the tab comes into focus
  useFocusEffect(
    useCallback(() => {
      const syncData = async () => {
        setIsRefreshing(true);
        try {
          await Promise.all([refresh(), refreshXP()]);
        } catch (error) {
          console.error('Failed to sync stats data:', error);
        } finally {
          setIsRefreshing(false);
        }
      };
      syncData();
    }, [refresh, refreshXP])
  );

  const todayCompleted = habits.filter(h => isCompletedToday(h)).length;
  const longestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background.primary }]}>
        <View style={styles.headerRow}>
          <AppLogo size={36} />
          <ThemedText variant="primary" weight="bold" size="xxl" style={{ marginLeft: 12 }}>
            Stats
          </ThemedText>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <ProfileCard />

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <StatCard icon="checkmark-circle" value={`${todayCompleted}/${habits.length}`} label="Today" color={colors.status.success} />
          <StatCard icon="trophy" value={longestStreak} label="Best Streak" color={colors.brand.primary} />
        </View>

        {/* Period Selector */}
        <View style={[styles.periodSelector, { backgroundColor: colors.card.background, borderColor: colors.border.light }]}>
          <Pressable
            onPress={() => setSelectedPeriod('week')}
            style={[
              styles.periodButton,
              selectedPeriod === 'week' && { backgroundColor: colors.brand.primary },
            ]}
          >
            <ThemedText 
              variant={selectedPeriod === 'week' ? 'inverse' : 'primary'}
              weight="semibold"
              size="sm"
            >
              Week
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setSelectedPeriod('month')}
            style={[
              styles.periodButton,
              selectedPeriod === 'month' && { backgroundColor: colors.brand.primary },
            ]}
          >
            <ThemedText 
              variant={selectedPeriod === 'month' ? 'inverse' : 'primary'}
              weight="semibold"
              size="sm"
            >
              Month
            </ThemedText>
          </Pressable>
        </View>

        {/* Week or Month View */}
        {selectedPeriod === 'week' ? <WeekView habits={habits} /> : <MonthView habits={habits} />}

        {/* Habit Streaks */}
        <HabitStreakList habits={habits} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appLogo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  appLogoText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  scrollView: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  
  // Profile Card
  profileCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  xpSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  xpProgressBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  profileStats: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  profileStat: {
    flex: 1,
    alignItems: 'center',
  },
  profileStatDivider: {
    width: 1,
    height: 32,
    alignSelf: 'center',
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  // Period Selector
  periodSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },

  // Cards
  cardTitle: {
    marginBottom: 14,
  },
  weekCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColumn: {
    alignItems: 'center',
    gap: 6,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Month View
  monthCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  monthStats: {
    flexDirection: 'row',
  },
  monthStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  monthCell: {
    width: (width - 32 - 4 * 9) / 10,
    aspectRatio: 1,
    borderRadius: 4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 14,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },

  // Streak List
  streakCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  habitInfo: {
    flex: 1,
    marginRight: 12,
  },
  streakBarBg: {
    height: 4,
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  streakBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
});

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  Dimensions, 
  Image,
  RefreshControl,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { useHabits } from '../../hooks/useHabits';
import { useXP } from '../../hooks/useXP';
import { useAuth } from '../../lib/authContext';
import { getToday, isCompletedToday } from '../../lib/habitStats';
import { Habit } from '../../lib/habitsApi';
import { ThemedView, ThemedText } from '../../components/Themed';
import { useTheme } from '../../lib/themeContext';

const { width } = Dimensions.get('window');

// ============ Circular Progress Ring ============
function CircularProgress({ 
  progress, 
  size = 120, 
  strokeWidth = 8,
  color = '#DC2626',
  bgColor = 'rgba(255,255,255,0.1)',
}: { 
  progress: number; 
  size?: number; 
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={{ width: size, height: size }}>
      {/* Background circle */}
      <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
        <View
          style={{
            width: size - strokeWidth,
            height: size - strokeWidth,
            borderRadius: (size - strokeWidth) / 2,
            borderWidth: strokeWidth,
            borderColor: bgColor,
          }}
        />
      </View>
      {/* Progress circle - simplified for RN */}
      <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
        <View
          style={{
            width: size - strokeWidth,
            height: size - strokeWidth,
            borderRadius: (size - strokeWidth) / 2,
            borderWidth: strokeWidth,
            borderColor: color,
            borderRightColor: 'transparent',
            borderBottomColor: progress > 25 ? color : 'transparent',
            borderLeftColor: progress > 50 ? color : 'transparent',
            borderTopColor: progress > 75 ? color : 'transparent',
            transform: [{ rotate: '-90deg' }],
          }}
        />
      </View>
    </View>
  );
}

// ============ XP Hero Card ============
function XPHeroCard() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { totalXP, level, progressToNextLevel } = useXP();
  const { habits } = useHabits();
  
  const xpToNextLevel = 100 - (totalXP % 100);
  const completedToday = habits.filter(h => isCompletedToday(h)).length;
  const totalStreakDays = habits.reduce((sum, h) => sum + h.streak, 0);
  
  return (
    <LinearGradient
      colors={isDark ? ['#1a1a2e', '#16213e', '#0f3460'] : ['#667eea', '#764ba2', '#f093fb']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.heroCard}
    >
      {/* Decorative circles */}
      <View style={styles.heroDecor1} />
      <View style={styles.heroDecor2} />
      
      <View style={styles.heroContent}>
        {/* Left side - XP Ring */}
        <View style={styles.heroLeft}>
          <CircularProgress 
            progress={progressToNextLevel} 
            size={110} 
            strokeWidth={10}
            color="#fff"
            bgColor="rgba(255,255,255,0.2)"
          />
          <View style={styles.heroRingContent}>
            <ThemedText style={styles.heroLevel}>Lv.{level}</ThemedText>
            <ThemedText style={styles.heroXP}>{totalXP}</ThemedText>
            <ThemedText style={styles.heroXPLabel}>XP</ThemedText>
          </View>
        </View>
        
        {/* Right side - Stats */}
        <View style={styles.heroRight}>
          <ThemedText style={styles.heroGreeting}>
            {user?.username || 'Champion'}
          </ThemedText>
          <ThemedText style={styles.heroSubtext}>
            {xpToNextLevel} XP to level {level + 1}
          </ThemedText>
          
          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Ionicons name="checkmark-circle" size={18} color="rgba(255,255,255,0.9)" />
              <ThemedText style={styles.heroStatValue}>{completedToday}/{habits.length}</ThemedText>
              <ThemedText style={styles.heroStatLabel}>Today</ThemedText>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Ionicons name="flame" size={18} color="#FBBF24" />
              <ThemedText style={styles.heroStatValue}>{totalStreakDays}</ThemedText>
              <ThemedText style={styles.heroStatLabel}>Streak Days</ThemedText>
            </View>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

// ============ Quick Stats Grid ============
function QuickStatsGrid() {
  const { colors, isDark } = useTheme();
  const { habits } = useHabits();
  const { level } = useXP();
  
  const todayCompleted = habits.filter(h => isCompletedToday(h)).length;
  const longestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;
  const totalHabits = habits.length;
  const completionRate = totalHabits > 0 ? Math.round((todayCompleted / totalHabits) * 100) : 0;

  const stats = [
    { 
      icon: 'trophy' as const, 
      value: longestStreak, 
      label: 'Best Streak', 
      color: '#FBBF24',
      bgColor: 'rgba(251, 191, 36, 0.15)'
    },
    { 
      icon: 'rocket' as const, 
      value: level, 
      label: 'Level', 
      color: '#60A5FA',
      bgColor: 'rgba(96, 165, 250, 0.15)'
    },
    { 
      icon: 'list' as const, 
      value: totalHabits, 
      label: 'Total Habits', 
      color: '#A78BFA',
      bgColor: 'rgba(167, 139, 250, 0.15)'
    },
    { 
      icon: 'stats-chart' as const, 
      value: `${completionRate}%`, 
      label: 'Today Rate', 
      color: '#34D399',
      bgColor: 'rgba(52, 211, 153, 0.15)'
    },
  ];

  return (
    <View style={styles.statsGrid}>
      {stats.map((stat, index) => (
        <Pressable 
          key={index} 
          style={[
            styles.statGridItem, 
            { backgroundColor: colors.card.background, borderColor: colors.border.light }
          ]}
        >
          <View style={[styles.statGridIcon, { backgroundColor: stat.bgColor }]}>
            <Ionicons name={stat.icon} size={22} color={stat.color} />
          </View>
          <ThemedText variant="primary" weight="bold" size="xl">
            {stat.value}
          </ThemedText>
          <ThemedText variant="tertiary" size="xs">
            {stat.label}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

// ============ Helper Functions ============
function getDaysAgo(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
}

function wasCompletedOnDate(habit: Habit, dateStr: string, todayStr: string): boolean {
  if (dateStr === todayStr) {
    return isCompletedToday(habit, todayStr);
  }
  
  const daysAgo = getDaysAgo(dateStr);
  
  if (!habit.lastCompletedOn) {
    return false;
  }
  
  const daysSinceLastCompletion = getDaysAgo(habit.lastCompletedOn);
  
  if (habit.streak > 0 && daysSinceLastCompletion <= daysAgo && habit.streak >= (daysAgo - daysSinceLastCompletion + 1)) {
    return true;
  }
  
  return false;
}

// ============ Activity Calendar (GitHub-style) ============
function ActivityCalendar({ habits }: { habits: Habit[] }) {
  const { colors, isDark } = useTheme();
  const today = new Date();
  const todayStr = getToday();
  
  const weeks = useMemo(() => {
    const data: { dateStr: string; rate: number; isToday: boolean }[][] = [];
    let currentWeek: { dateStr: string; rate: number; isToday: boolean }[] = [];
    
    // Get data for last 12 weeks (84 days)
    for (let i = 83; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const completedCount = habits.filter(h => wasCompletedOnDate(h, dateStr, todayStr)).length;
      const rate = habits.length === 0 ? 0 : Math.round((completedCount / habits.length) * 100);
      
      currentWeek.push({ dateStr, rate, isToday: dateStr === todayStr });
      
      if (currentWeek.length === 7) {
        data.push(currentWeek);
        currentWeek = [];
      }
    }
    
    if (currentWeek.length > 0) {
      data.push(currentWeek);
    }
    
    return data;
  }, [habits, today, todayStr]);

  const getColor = (rate: number) => {
    if (rate === 100) return isDark ? '#22C55E' : '#16A34A';
    if (rate >= 75) return isDark ? '#4ADE80' : '#22C55E';
    if (rate >= 50) return isDark ? '#86EFAC' : '#4ADE80';
    if (rate > 0) return isDark ? '#BBF7D0' : '#86EFAC';
    return isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  };

  const perfectDays = weeks.flat().filter(d => d.rate === 100).length;

  return (
    <View style={[styles.calendarCard, { backgroundColor: colors.card.background, borderColor: colors.border.light }]}>
      <View style={styles.calendarHeader}>
        <View>
          <ThemedText variant="primary" weight="bold" size="lg">
            Activity
          </ThemedText>
          <ThemedText variant="tertiary" size="xs">
            Last 12 weeks
          </ThemedText>
        </View>
        <View style={styles.perfectBadge}>
          <Ionicons name="star" size={14} color="#FBBF24" />
          <ThemedText variant="primary" weight="bold" size="sm" style={{ marginLeft: 4 }}>
            {perfectDays}
          </ThemedText>
          <ThemedText variant="tertiary" size="xs" style={{ marginLeft: 2 }}>
            perfect
          </ThemedText>
        </View>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.calendarGrid}>
          {weeks.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.calendarWeek}>
              {week.map((day, dayIndex) => (
                <View 
                  key={dayIndex}
                  style={[
                    styles.calendarCell,
                    { backgroundColor: getColor(day.rate) },
                    day.isToday && { 
                      borderWidth: 2, 
                      borderColor: colors.brand.primary,
                    },
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
      
      <View style={styles.calendarLegend}>
        <ThemedText variant="tertiary" size="xs">Less</ThemedText>
        {[0, 25, 50, 75, 100].map((rate, i) => (
          <View 
            key={i} 
            style={[styles.calendarLegendDot, { backgroundColor: getColor(rate) }]} 
          />
        ))}
        <ThemedText variant="tertiary" size="xs">More</ThemedText>
      </View>
    </View>
  );
}

// ============ Top Streaks Card ============
function TopStreaksCard({ habits }: { habits: Habit[] }) {
  const { colors, isDark } = useTheme();
  const sortedHabits = useMemo(() => 
    [...habits].sort((a, b) => b.streak - a.streak).slice(0, 5), 
    [habits]
  );

  if (habits.length === 0) {
    return (
      <View style={[styles.streaksCard, { backgroundColor: colors.card.background, borderColor: colors.border.light }]}>
        <View style={styles.streaksHeader}>
          <Ionicons name="flame" size={20} color="#FBBF24" />
          <ThemedText variant="primary" weight="bold" size="lg" style={{ marginLeft: 8 }}>
            Top Streaks
          </ThemedText>
        </View>
        <View style={styles.emptyStreaks}>
          <Ionicons name="rocket-outline" size={48} color={colors.text.tertiary} />
          <ThemedText variant="tertiary" size="sm" style={{ marginTop: 12, textAlign: 'center' }}>
            Create habits to start{'\n'}building streaks
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.streaksCard, { backgroundColor: colors.card.background, borderColor: colors.border.light }]}>
      <View style={styles.streaksHeader}>
        <Ionicons name="flame" size={20} color="#FBBF24" />
        <ThemedText variant="primary" weight="bold" size="lg" style={{ marginLeft: 8 }}>
          Top Streaks
        </ThemedText>
      </View>
      
      {sortedHabits.map((habit, index) => {
        const maxStreak = sortedHabits[0]?.streak || 1;
        const progress = (habit.streak / Math.max(maxStreak, 30)) * 100;
        
        return (
          <View key={habit.id} style={styles.streakRow}>
            <View style={styles.streakRank}>
              <ThemedText 
                variant={index < 3 ? 'primary' : 'tertiary'} 
                weight="bold" 
                size="sm"
              >
                #{index + 1}
              </ThemedText>
            </View>
            
            <View style={styles.streakInfo}>
              <ThemedText variant="primary" weight="medium" size="sm" numberOfLines={1}>
                {habit.name}
              </ThemedText>
              <View style={[styles.streakProgressBg, { backgroundColor: colors.background.tertiary }]}>
                <LinearGradient
                  colors={['#FBBF24', '#F59E0B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.streakProgressFill, { width: `${Math.min(100, progress)}%` }]}
                />
              </View>
            </View>
            
            <View style={styles.streakValue}>
              <Ionicons name="flame" size={16} color="#FBBF24" />
              <ThemedText variant="primary" weight="bold" size="base" style={{ marginLeft: 4 }}>
                {habit.streak}
              </ThemedText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ============ Today's Overview Card ============
function TodayOverviewCard({ habits }: { habits: Habit[] }) {
  const { colors } = useTheme();
  const todayStr = getToday();
  
  const completed = habits.filter(h => isCompletedToday(h, todayStr));
  const pending = habits.filter(h => !isCompletedToday(h, todayStr));
  const completionRate = habits.length > 0 ? Math.round((completed.length / habits.length) * 100) : 0;

  return (
    <View style={[styles.todayCard, { backgroundColor: colors.card.background, borderColor: colors.border.light }]}>
      <View style={styles.todayHeader}>
        <View>
          <ThemedText variant="primary" weight="bold" size="lg">
            Today's Progress
          </ThemedText>
          <ThemedText variant="tertiary" size="xs">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </ThemedText>
        </View>
        <View style={[styles.todayBadge, { backgroundColor: completionRate === 100 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(251, 191, 36, 0.15)' }]}>
          <ThemedText 
            weight="bold" 
            size="lg" 
            style={{ color: completionRate === 100 ? '#22C55E' : '#FBBF24' }}
          >
            {completionRate}%
          </ThemedText>
        </View>
      </View>
      
      {/* Progress bar */}
      <View style={[styles.todayProgressBg, { backgroundColor: colors.background.tertiary }]}>
        <LinearGradient
          colors={completionRate === 100 ? ['#22C55E', '#16A34A'] : ['#FBBF24', '#F59E0B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.todayProgressFill, { width: `${completionRate}%` }]}
        />
      </View>
      
      {/* Stats row */}
      <View style={styles.todayStats}>
        <View style={styles.todayStatItem}>
          <View style={[styles.todayDot, { backgroundColor: '#22C55E' }]} />
          <ThemedText variant="tertiary" size="sm">Completed: </ThemedText>
          <ThemedText variant="primary" weight="bold" size="sm">{completed.length}</ThemedText>
        </View>
        <View style={styles.todayStatItem}>
          <View style={[styles.todayDot, { backgroundColor: colors.text.tertiary }]} />
          <ThemedText variant="tertiary" size="sm">Pending: </ThemedText>
          <ThemedText variant="primary" weight="bold" size="sm">{pending.length}</ThemedText>
        </View>
      </View>
    </View>
  );
}

// ============ Main Stats Page ============
export default function StatsTab() {
  const { colors, isDark } = useTheme();
  const { habits, refresh, loading: habitsLoading } = useHabits();
  const { refresh: refreshXP, loading: xpLoading } = useXP();
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refresh(), refreshXP()]);
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand.primary}
            colors={[colors.brand.primary]}
          />
        }
      >
        {/* XP Hero Card */}
        <XPHeroCard />

        {/* Today's Overview */}
        <TodayOverviewCard habits={habits} />

        {/* Quick Stats Grid */}
        <QuickStatsGrid />

        {/* Activity Calendar */}
        <ActivityCalendar habits={habits} />

        {/* Top Streaks */}
        <TopStreaksCard habits={habits} />

        {/* Bottom spacing */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  scrollView: { 
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },

  // Hero Card
  heroCard: {
    marginHorizontal: 16,
    marginTop: 60,
    marginBottom: 16,
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
  },
  heroDecor1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroDecor2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroLeft: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRingContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLevel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  heroXP: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginTop: -2,
  },
  heroXPLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginTop: -4,
  },
  heroRight: {
    flex: 1,
    marginLeft: 24,
  },
  heroGreeting: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  heroSubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 16,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 6,
  },
  heroStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginLeft: 4,
  },
  heroStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 16,
  },

  // Quick Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginBottom: 16,
    gap: 8,
  },
  statGridItem: {
    width: (width - 48) / 2,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  statGridIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  // Today Card
  todayCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  todayBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  todayProgressBg: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 16,
  },
  todayProgressFill: {
    height: '100%',
    borderRadius: 5,
  },
  todayStats: {
    flexDirection: 'row',
    gap: 24,
  },
  todayStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  todayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },

  // Activity Calendar
  calendarCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  perfectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  calendarGrid: {
    flexDirection: 'row',
    gap: 4,
  },
  calendarWeek: {
    gap: 4,
  },
  calendarCell: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  calendarLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 4,
  },
  calendarLegendDot: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },

  // Streaks Card
  streaksCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  streaksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStreaks: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  streakRank: {
    width: 32,
    alignItems: 'center',
  },
  streakInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  streakProgressBg: {
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  streakProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  streakValue: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 50,
    justifyContent: 'flex-end',
  },
});

import { habitsService } from './habitsApi';
import { userGamificationService, UserGamificationData } from './userGamificationApi';

// Gamification Types
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: (stats: UserStats) => boolean;
  xpReward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UserStats {
  totalHabits: number;
  completedToday: number;
  totalXP: number;
  level: number;
  longestStreak: number;
  activeStreaks: number;
  totalCompletions: number;
  consecutiveDays: number;
  currentStreak: number;
}

export interface GamificationData {
  xp: number;
  level: number;
  achievements: Achievement[];
  nextLevelXP: number;
  currentLevelXP: number;
  totalXP: number;
}

// XP Rewards Configuration
export const XP_REWARDS = {
  HABIT_COMPLETION: 10,
  STREAK_7_DAYS: 50,
  STREAK_30_DAYS: 200,
  STREAK_100_DAYS: 500,
  PERFECT_DAY: 25, // All habits completed
  FIRST_HABIT: 20,
  HABIT_MILESTONE_10: 100,
  HABIT_MILESTONE_50: 300,
  HABIT_MILESTONE_100: 500,
  WEEKLY_CONSISTENT: 75, // 7 days in a row
  MONTHLY_CONSISTENT: 250, // 30 days in a row
} as const;

// Level System
export const LEVEL_SYSTEM = {
  BASE_XP: 100,
  MULTIPLIER: 1.5,
  getRequiredXP: (level: number): number => {
    return Math.floor(LEVEL_SYSTEM.BASE_XP * Math.pow(LEVEL_SYSTEM.MULTIPLIER, level - 1));
  },
  getLevelFromXP: (totalXP: number): number => {
    // Level starts at 1 and increments only when user has enough XP to complete the current level
    let level = 1;
    let remaining = totalXP;
    while (true) {
      const req = LEVEL_SYSTEM.getRequiredXP(level);
      if (remaining >= req) {
        remaining -= req;
        level += 1;
      } else {
        break;
      }
    }
    return Math.max(1, level);
  },
  getXPForCurrentLevel: (totalXP: number, level: number): number => {
    // Compute XP already consumed by previous levels and return the remainder for the current level
    let usedXP = 0;
    for (let i = 1; i < level; i++) {
      usedXP += LEVEL_SYSTEM.getRequiredXP(i);
    }
    const current = Math.max(0, totalXP - usedXP);
    const currentLevelRequirement = LEVEL_SYSTEM.getRequiredXP(level);
    return Math.min(current, currentLevelRequirement);
  },
  getNextLevelXP: (level: number): number => {
    // Return requirement for the CURRENT level (denominator for current progress)
    return LEVEL_SYSTEM.getRequiredXP(level);
  }
};

// Achievements Definition
export const ACHIEVEMENTS: Achievement[] = [
  // Beginner Achievements
  {
    id: 'first_habit',
    title: 'First Steps',
    description: 'Create your first habit',
    icon: 'flag-outline',
    condition: (stats) => stats.totalHabits >= 1,
    xpReward: XP_REWARDS.FIRST_HABIT,
    rarity: 'common'
  },
  {
    id: 'habit_collector',
    title: 'Habit Collector',
    description: 'Create 5 different habits',
    icon: 'library-outline',
    condition: (stats) => stats.totalHabits >= 5,
    xpReward: 50,
    rarity: 'common'
  },
  {
    id: 'dedication',
    title: 'Dedication',
    description: 'Create 10 different habits',
    icon: 'trophy-outline',
    condition: (stats) => stats.totalHabits >= 10,
    xpReward: XP_REWARDS.HABIT_MILESTONE_10,
    rarity: 'rare'
  },

  // Streak Achievements
  {
    id: 'week_warrior',
    title: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: 'calendar-outline',
    condition: (stats) => stats.longestStreak >= 7,
    xpReward: XP_REWARDS.STREAK_7_DAYS,
    rarity: 'common'
  },
  {
    id: 'month_master',
    title: 'Month Master',
    description: 'Maintain a 30-day streak',
    icon: 'medal-outline',
    condition: (stats) => stats.longestStreak >= 30,
    xpReward: XP_REWARDS.STREAK_30_DAYS,
    rarity: 'rare'
  },
  {
    id: 'century_champion',
    title: 'Century Champion',
    description: 'Maintain a 100-day streak',
    icon: 'star-outline',
    condition: (stats) => stats.longestStreak >= 100,
    xpReward: XP_REWARDS.STREAK_100_DAYS,
    rarity: 'legendary'
  },

  // Completion Achievements
  {
    id: 'perfect_day',
    title: 'Perfect Day',
    description: 'Complete all habits in a single day',
    icon: 'checkmark-circle-outline',
    condition: (stats) => stats.completedToday === stats.totalHabits && stats.totalHabits > 0,
    xpReward: XP_REWARDS.PERFECT_DAY,
    rarity: 'rare'
  },
  {
    id: 'consistency_king',
    title: 'Consistency King',
    description: 'Complete habits for 7 consecutive days',
    icon: 'infinite-outline',
    condition: (stats) => stats.consecutiveDays >= 7,
    xpReward: XP_REWARDS.WEEKLY_CONSISTENT,
    rarity: 'rare'
  },
  {
    id: 'habit_master',
    title: 'Habit Master',
    description: 'Complete 100 total habit instances',
    icon: 'diamond-outline',
    condition: (stats) => stats.totalCompletions >= 100,
    xpReward: XP_REWARDS.HABIT_MILESTONE_100,
    rarity: 'epic'
  },

  // Advanced Achievements
  {
    id: 'unstoppable',
    title: 'Unstoppable',
    description: 'Reach level 10',
    icon: 'rocket-outline',
    condition: (stats) => stats.level >= 10,
    xpReward: 1000,
    rarity: 'epic'
  },
  {
    id: 'legend',
    title: 'Living Legend',
    description: 'Reach level 25',
    icon: 'flame-outline',
    condition: (stats) => stats.level >= 25,
    xpReward: 2500,
    rarity: 'legendary'
  }
];

class GamificationService {
  private cachedUserGamification: UserGamificationData | null = null;

  // Initialize user gamification data
  async initUserGamification(): Promise<void> {
    try {
      this.cachedUserGamification = await userGamificationService.getUserGamification();
    } catch (error) {
      // Silently use default values - errors are handled in userGamificationService
      this.cachedUserGamification = { totalXP: 0, level: 1 };
    }
  }

  // Refresh cached user data
  async refreshUserGamification(): Promise<UserGamificationData> {
    try {
      this.cachedUserGamification = await userGamificationService.getUserGamification();
      return this.cachedUserGamification;
    } catch (error) {
      // Silently use default values
      this.cachedUserGamification = { totalXP: 0, level: 1 };
      return this.cachedUserGamification;
    }
  }

  // Get cached user gamification data
  getCachedUserGamification(): UserGamificationData | null {
    return this.cachedUserGamification;
  }

  // Calculate user stats from habits and persistent user data
  async calculateUserStats(habits: any[], userGamificationData?: UserGamificationData): Promise<UserStats> {
    const totalHabits = habits.length;
    const today = new Date().toISOString().split('T')[0];
    const completedToday = habits.filter(h => h.lastCompletedOn === today).length;
    
    // Get persistent user gamification data
    let userData: UserGamificationData;
    if (userGamificationData) {
      userData = userGamificationData;
    } else if (this.cachedUserGamification) {
      userData = this.cachedUserGamification;
    } else {
      try {
        userData = await userGamificationService.getUserGamification();
        this.cachedUserGamification = userData;
      } catch (error) {
        // Silently use default values
        userData = { totalXP: 0, level: 1 };
      }
    }

    // Use persistent totalXP and level from user data
    const totalXP = userData.totalXP;
    const level = userData.level;
    
    const longestStreak = Math.max(...habits.map(h => h.streak || 0), 0);
    const activeStreaks = habits.filter(h => (h.streak || 0) > 0).length;
    
    // Calculate total completions (estimate based on streaks)
    const totalCompletions = habits.reduce((sum, habit) => {
      // Estimate total completions from current streak + some historical data
      const estimatedTotal = (habit.streak || 0) + Math.floor(Math.random() * 20);
      return sum + estimatedTotal;
    }, 0);

    // Calculate consecutive days (simplified - would need more complex tracking)
    const consecutiveDays = Math.min(longestStreak, 30); // Simplified
    const currentStreak = longestStreak; // Simplified

    return {
      totalHabits,
      completedToday,
      totalXP,
      level,
      longestStreak,
      activeStreaks,
      totalCompletions,
      consecutiveDays,
      currentStreak
    };
  }

  // Synchronous version for backward compatibility (when user data is already available)
  calculateUserStatsSync(habits: any[], userGamificationData?: UserGamificationData): UserStats {
    const totalHabits = habits.length;
    const today = new Date().toISOString().split('T')[0];
    const completedToday = habits.filter(h => h.lastCompletedOn === today).length;
    
    // Use provided user data or cached data or fallback
    const userData = userGamificationData || this.cachedUserGamification || { totalXP: 0, level: 1 };
    
    const totalXP = userData.totalXP;
    const level = userData.level;
    
    const longestStreak = Math.max(...habits.map(h => h.streak || 0), 0);
    const activeStreaks = habits.filter(h => (h.streak || 0) > 0).length;
    
    // Calculate total completions (estimate based on streaks)
    const totalCompletions = habits.reduce((sum, habit) => {
      // Estimate total completions from current streak + some historical data
      const estimatedTotal = (habit.streak || 0) + Math.floor(Math.random() * 20);
      return sum + estimatedTotal;
    }, 0);

    // Calculate consecutive days (simplified - would need more complex tracking)
    const consecutiveDays = Math.min(longestStreak, 30); // Simplified
    const currentStreak = longestStreak; // Simplified

    return {
      totalHabits,
      completedToday,
      totalXP,
      level,
      longestStreak,
      activeStreaks,
      totalCompletions,
      consecutiveDays,
      currentStreak
    };
  }

  // Get gamification data for display
  getGamificationData(habits: any[], userGamificationData?: UserGamificationData): GamificationData {
    const stats = this.calculateUserStatsSync(habits, userGamificationData);
    const currentLevelXP = LEVEL_SYSTEM.getXPForCurrentLevel(stats.totalXP, stats.level);
    const nextLevelXP = LEVEL_SYSTEM.getNextLevelXP(stats.level);
    const earnedAchievements = this.getEarnedAchievements(stats);

    return {
      xp: currentLevelXP,
      level: stats.level,
      achievements: earnedAchievements,
      nextLevelXP,
      currentLevelXP,
      totalXP: stats.totalXP
    };
  }

  // Async version for getting gamification data
  async getGamificationDataAsync(habits: any[]): Promise<GamificationData> {
    const stats = await this.calculateUserStats(habits);
    const currentLevelXP = LEVEL_SYSTEM.getXPForCurrentLevel(stats.totalXP, stats.level);
    const nextLevelXP = LEVEL_SYSTEM.getNextLevelXP(stats.level);
    const earnedAchievements = this.getEarnedAchievements(stats);

    return {
      xp: currentLevelXP,
      level: stats.level,
      achievements: earnedAchievements,
      nextLevelXP,
      currentLevelXP,
      totalXP: stats.totalXP
    };
  }

  // Get earned achievements
  getEarnedAchievements(stats: UserStats): Achievement[] {
    return ACHIEVEMENTS.filter(achievement => achievement.condition(stats));
  }

  // Get available achievements (not yet earned)
  getAvailableAchievements(stats: UserStats): Achievement[] {
    return ACHIEVEMENTS.filter(achievement => !achievement.condition(stats));
  }

  // Award XP for habit completion
  async awardHabitCompletionXP(habitId: string, onXPAwarded?: (xp: number) => void): Promise<void> {
    try {
      // Award XP to habit (for display purposes)
      await habitsService.gamifyHabit(habitId, { 
        xp: XP_REWARDS.HABIT_COMPLETION 
      });

      // Award XP to user (persistent)
      const result = await userGamificationService.addXP(XP_REWARDS.HABIT_COMPLETION);
      
      // Update cached data
      this.cachedUserGamification = {
        totalXP: result.totalXP,
        level: result.level,
      };

      if (onXPAwarded) {
        onXPAwarded(XP_REWARDS.HABIT_COMPLETION);
      }
    } catch (error) {
      console.error('Failed to award XP:', error);
    }
  }

  // Award streak bonus
  async awardStreakBonus(habitId: string, streakDays: number, onXPAwarded?: (xp: number, title: string, subtitle: string) => void): Promise<void> {
    try {
      let bonusXP = 0;
      let title = '';
      let subtitle = '';

      if (streakDays === 7) {
        bonusXP = XP_REWARDS.STREAK_7_DAYS;
        title = '🔥 WEEK WARRIOR!';
        subtitle = '7 days streak bonus';
      } else if (streakDays === 30) {
        bonusXP = XP_REWARDS.STREAK_30_DAYS;
        title = '👑 MONTH MASTER!';
        subtitle = '30 days streak bonus';
      } else if (streakDays === 100) {
        bonusXP = XP_REWARDS.STREAK_100_DAYS;
        title = '🏆 CENTURY CHAMPION!';
        subtitle = '100 days streak bonus';
      }

      if (bonusXP > 0) {
        // Award XP to habit (for display purposes)
        await habitsService.gamifyHabit(habitId, { 
          xp: bonusXP
        });

        // Award XP to user (persistent)
        const result = await userGamificationService.addXP(bonusXP);
        
        // Update cached data
        this.cachedUserGamification = {
          totalXP: result.totalXP,
          level: result.level,
        };

        if (onXPAwarded) {
          onXPAwarded(bonusXP, title, subtitle);
        }
      }
    } catch (error) {
      console.error('Failed to award streak bonus:', error);
    }
  }

  // Award perfect day bonus
  async awardPerfectDayBonus(habits: any[], onXPAwarded?: (xp: number, title: string, subtitle: string) => void): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const completedToday = habits.filter(h => h.lastCompletedOn === today);
      
      if (completedToday.length === habits.length && habits.length > 0) {
        // Award bonus to the first habit (for display purposes)
        if (completedToday.length > 0) {
          await habitsService.gamifyHabit(completedToday[0].id, { 
            xp: XP_REWARDS.PERFECT_DAY
          });
        }

        // Award XP to user (persistent)
        const result = await userGamificationService.addXP(XP_REWARDS.PERFECT_DAY);
        
        // Update cached data
        this.cachedUserGamification = {
          totalXP: result.totalXP,
          level: result.level,
        };

        if (onXPAwarded) {
          onXPAwarded(XP_REWARDS.PERFECT_DAY, '🌟 PERFECT DAY!', `All ${habits.length} habits completed`);
        }
      }
    } catch (error) {
      console.error('Failed to award perfect day bonus:', error);
    }
  }

  // Award achievement XP
  async awardAchievementXP(habitId: string, achievement: Achievement, onXPAwarded?: (xp: number, title: string, subtitle: string) => void): Promise<void> {
    try {
      // Award XP to habit (for display purposes)
      await habitsService.gamifyHabit(habitId, { 
        xp: achievement.xpReward
      });

      // Award XP to user (persistent)
      const result = await userGamificationService.addXP(achievement.xpReward);
      
      // Update cached data
      this.cachedUserGamification = {
        totalXP: result.totalXP,
        level: result.level,
      };

      if (onXPAwarded) {
        const rarityEmoji = this.getRarityEmoji(achievement.rarity);
        onXPAwarded(achievement.xpReward, `${rarityEmoji} ${achievement.title.toUpperCase()}!`, achievement.description);
      }
    } catch (error) {
      console.error('Failed to award achievement XP:', error);
    }
  }

  // Check and award newly unlocked achievements
  async checkAndAwardNewAchievements(
    habitId: string, 
    previousStats: UserStats, 
    currentStats: UserStats,
    onXPAwarded?: (xp: number, title: string, subtitle: string) => void
  ): Promise<void> {
    const previousAchievements = ACHIEVEMENTS.filter(achievement => achievement.condition(previousStats));
    const currentAchievements = ACHIEVEMENTS.filter(achievement => achievement.condition(currentStats));
    
    // Find newly earned achievements
    const newAchievements = currentAchievements.filter(
      current => !previousAchievements.some(prev => prev.id === current.id)
    );

    // Award XP for each new achievement
    for (const achievement of newAchievements) {
      await this.awardAchievementXP(habitId, achievement, onXPAwarded);
    }
  }

  // Get rarity color
  getRarityColor(rarity: Achievement['rarity']): string {
    switch (rarity) {
      case 'common': return '#10B981'; // Green
      case 'rare': return '#3B82F6'; // Blue  
      case 'epic': return '#8B5CF6'; // Purple
      case 'legendary': return '#F59E0B'; // Gold
      default: return '#6B7280'; // Gray
    }
  }

  // Get rarity emoji
  getRarityEmoji(rarity: Achievement['rarity']): string {
    switch (rarity) {
      case 'common': return '🟢';
      case 'rare': return '🔵';
      case 'epic': return '🟣';
      case 'legendary': return '🟡';
      default: return '⚪';
    }
  }
}

export const gamificationService = new GamificationService();

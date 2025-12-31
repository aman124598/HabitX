import { Request, Response } from 'express';
import { UserRepository } from '../models/User';
import { HabitRepository } from '../models/Habit';
import { asyncHandler, createError } from '../middleware/errorHandler';

// Interface for leaderboard entry
interface GlobalLeaderboardEntry {
  rank: number;
  user: {
    id: string;
    username: string;
    email: string;
  };
  totalXP: number;
  level: number;
  totalHabits: number;
  activeStreaks: number;
  longestStreak: number;
  completedToday: number;
}

// Interface for leaderboard response
interface GlobalLeaderboard {
  leaderboard: GlobalLeaderboardEntry[];
  userRank?: number;
  totalUsers: number;
}

// Calculate level from XP (same logic as frontend)
const getLevelFromXP = (totalXP: number): number => {
  const BASE_XP = 100;
  const MULTIPLIER = 1.5;
  
  let level = 1;
  let remaining = totalXP;
  
  while (true) {
    const required = Math.floor(BASE_XP * Math.pow(MULTIPLIER, level - 1));
    if (remaining >= required) {
      remaining -= required;
      level += 1;
    } else {
      break;
    }
  }
  return Math.max(1, level);
};

// Get today's date in YYYY-MM-DD format
const getToday = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const leaderboardController = {
  // @desc    Get global user leaderboard
  // @route   GET /api/leaderboard/global
  // @access  Private
  getGlobalLeaderboard: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw createError('Not authenticated', 401);
    }

    const limit = parseInt((req.query?.limit as string) || '100');
    const page = parseInt((req.query?.page as string) || '1');
    const limitNum = Math.min(limit || 100, 100);
    const pageNum = page || 1;
    const skip = (pageNum - 1) * limitNum;

    try {
      // Get leaderboard from UserRepository
      const users = await UserRepository.getLeaderboard(100);
      
      // Calculate stats for each user
      const userStats = await Promise.all(
        users.map(async (user) => {
          const habits = await HabitRepository.findByUserId(user.id);

          const persistentXP = user.totalXP || 0;
          const persistentLevel = user.level || 1;

          if (habits.length === 0) {
            return {
              userId: user.id,
              username: user.username,
              email: user.email,
              totalXP: persistentXP,
              level: persistentLevel,
              totalHabits: 0,
              activeStreaks: 0,
              longestStreak: 0,
              completedToday: 0,
            };
          }

          const today = getToday();
          const totalHabits = habits.length;
          const activeStreaks = habits.filter(h => (h.streak || 0) > 0).length;
          const longestStreak = Math.max(...habits.map(h => h.streak || 0), 0);
          const completedToday = habits.filter(h => h.lastCompletedOn === today).length;

          return {
            userId: user.id,
            username: user.username,
            email: user.email,
            totalXP: persistentXP,
            level: persistentLevel,
            totalHabits,
            activeStreaks,
            longestStreak,
            completedToday,
          };
        })
      );

      // Sort by totalXP desc, then by level desc
      const sortedStats = userStats.sort((a, b) => {
        if (b.totalXP !== a.totalXP) return b.totalXP - a.totalXP;
        if (b.level !== a.level) return b.level - a.level;
        return b.longestStreak - a.longestStreak;
      });

      // Add ranks
      const rankedStats = sortedStats.map((stat, index) => ({
        ...stat,
        rank: index + 1,
      }));

      // Find current user's rank
      const currentUserRank = rankedStats.find(stat => stat.userId === req.user!.id)?.rank;

      // Apply pagination
      const paginatedStats = rankedStats.slice(skip, skip + limitNum);

      // Format response
      const leaderboard: GlobalLeaderboardEntry[] = paginatedStats.map(stat => ({
        rank: stat.rank,
        user: {
          id: stat.userId,
          username: stat.username,
          email: stat.email,
        },
        totalXP: stat.totalXP,
        level: stat.level,
        totalHabits: stat.totalHabits,
        activeStreaks: stat.activeStreaks,
        longestStreak: stat.longestStreak,
        completedToday: stat.completedToday,
      }));

      const response: GlobalLeaderboard = {
        leaderboard,
        userRank: currentUserRank,
        totalUsers: rankedStats.length,
      };

      res.json(response);
    } catch (error: any) {
      console.error('Get global leaderboard error:', error);
      res.status(500).json({
        error: 'Failed to fetch global leaderboard',
        details: error.message,
      });
    }
  }),

  // @desc    Get user position in leaderboard
  // @route   GET /api/leaderboard/position
  // @access  Private
  getUserPosition: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw createError('Not authenticated', 401);
    }

    try {
      const me = await UserRepository.findById(req.user.id);
      const userTotalXP = me?.totalXP || 0;

      // Get all users for ranking
      const users = await UserRepository.getLeaderboard(1000);
      let usersWithHigherXP = 0;
      
      for (const u of users) {
        if ((u.totalXP || 0) > userTotalXP) {
          usersWithHigherXP++;
        }
      }

      const rank = usersWithHigherXP + 1;
      const level = me?.level || getLevelFromXP(userTotalXP);

      res.json({
        rank,
        totalXP: userTotalXP,
        level,
        totalUsers: users.length,
      });
    } catch (error: any) {
      console.error('Get user position error:', error);
      res.status(500).json({
        error: 'Failed to fetch user position',
        details: error.message,
      });
    }
  }),

  // @desc    Debug endpoint to get user count
  // @route   GET /api/leaderboard/debug/user-count
  // @access  Private
  getUserCount: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw createError('Not authenticated', 401);
    }

    try {
      const users = await UserRepository.findAll(100);
      const usersWithXP = users.filter(u => (u.totalXP || 0) > 0);
      
      res.json({
        totalUsers: users.length,
        usersWithXP: usersWithXP.length,
        usersWithoutXP: users.length - usersWithXP.length,
        sampleUsers: users.slice(0, 10).map(u => ({
          username: u.username,
          email: u.email,
          totalXP: u.totalXP || 0,
          level: u.level || 1,
        })),
      });
    } catch (error: any) {
      console.error('Error getting user count:', error);
      res.status(500).json({
        error: 'Failed to get user count',
        details: error.message,
      });
    }
  }),
};

export default leaderboardController;
import authService from './auth';
import { getApiUrl } from './config';

// Interface for global leaderboard entry
export interface GlobalLeaderboardEntry {
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

// Interface for global leaderboard response
export interface GlobalLeaderboard {
  leaderboard: GlobalLeaderboardEntry[];
  userRank?: number;
  totalUsers: number;
}

// Interface for user position response
export interface UserPosition {
  rank: number | null;
  totalXP: number;
  level: number;
  totalUsers: number;
}

export const leaderboardApi = {
  // Get global user leaderboard
  async getGlobalLeaderboard(params?: {
    limit?: number;
    page?: number;
  }): Promise<GlobalLeaderboard> {
    try {
      const query = params ? `?${new URLSearchParams({
        ...(params.limit && { limit: params.limit.toString() }),
        ...(params.page && { page: params.page.toString() }),
      }).toString()}` : '';
      
      const response = await authService.makeAuthenticatedRequest(
        getApiUrl(`/leaderboard/global${query}`)
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch global leaderboard');
      }

      return await response.json();
    } catch (error) {
      console.error('Get global leaderboard error:', error);
      throw error;
    }
  },

  // Get current user's position in the leaderboard
  async getUserPosition(): Promise<UserPosition> {
    try {
      const response = await authService.makeAuthenticatedRequest(
        getApiUrl('/leaderboard/position')
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch user position');
      }

      return await response.json();
    } catch (error) {
      // Log as warning since this is not critical functionality
      console.warn('Get user position error:', error);
      // Return a default response instead of throwing
      return {
        rank: null,
        totalXP: 0,
        level: 1,
        totalUsers: 0,
      };
    }
  },

  // Debug endpoint to get user count
  async getUserCount(): Promise<any> {
    try {
      const response = await authService.makeAuthenticatedRequest(
        getApiUrl('/leaderboard/debug/user-count')
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch user count');
      }

      return await response.json();
    } catch (error) {
      console.error('Get user count error:', error);
      throw error;
    }
  },
};

export default leaderboardApi;
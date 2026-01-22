import authService from './auth';
import { getApiUrl } from './config';
import { gamificationService } from './gamificationService';

interface UserGamification {
  totalXP: number;
  level: number;
}

/**
 * User Gamification API service
 */
export const userGamificationService = {
  /**
   * Get user's gamification data from server
   */
  async getUserGamification(): Promise<UserGamification> {
    try {
      const response = await authService.makeAuthenticatedRequest(
        getApiUrl('/auth/gamification')
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch gamification data');
      }
      
      const data = await response.json();
      const gamification: UserGamification = {
        totalXP: data.data?.totalXP || 0,
        level: data.data?.level || 1,
      };
      
      // Cache the data
      gamificationService.setCachedUserGamification(gamification);
      
      return gamification;
    } catch (error) {
      console.error('Get user gamification error:', error);
      // Return cached data if available
      const cached = gamificationService.getCachedUserGamification();
      if (cached) {
        return cached;
      }
      return { totalXP: 0, level: 1 };
    }
  },

  /**
   * Add XP to user
   */
  async addXP(xp: number): Promise<UserGamification> {
    try {
      const response = await authService.makeAuthenticatedRequest(
        getApiUrl('/auth/gamification/xp'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ xp }),
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to add XP');
      }
      
      const data = await response.json();
      const gamification: UserGamification = {
        totalXP: data.data?.totalXP || 0,
        level: data.data?.level || 1,
      };
      
      // Update cache
      gamificationService.setCachedUserGamification(gamification);
      
      return gamification;
    } catch (error) {
      console.error('Add XP error:', error);
      throw error;
    }
  },
};

export default userGamificationService;

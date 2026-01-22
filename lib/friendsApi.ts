import { getApiUrl } from './config';
import authService from './auth';

/**
 * Friends API service for friend-related operations
 */
export const friendsApi = {
  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(getApiUrl('/health'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  },

  /**
   * Search for users
   */
  async searchUsers(query: string): Promise<any[]> {
    try {
      const response = await authService.makeAuthenticatedRequest(
        getApiUrl(`/users/search?q=${encodeURIComponent(query)}`)
      );
      if (!response.ok) {
        throw new Error('Failed to search users');
      }
      const data = await response.json();
      return data.users || [];
    } catch (error) {
      console.error('Search users error:', error);
      return [];
    }
  },

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<any> {
    try {
      const response = await authService.makeAuthenticatedRequest(
        getApiUrl(`/users/${userId}/profile`)
      );
      if (!response.ok) {
        throw new Error('Failed to get user profile');
      }
      return await response.json();
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  },
};

export default friendsApi;

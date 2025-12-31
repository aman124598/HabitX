import authService from './auth';
import { getApiUrl } from './config';

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'streak' | 'completion_count' | 'consistency' | 'group_goal';
  createdBy: {
    id: string;
    username: string;
    email: string;
  };
  participants: Array<{
    id: string;
    username: string;
    email: string;
  }>;
  maxParticipants?: number;
  isPublic: boolean;
  habitCriteria: {
    category?: string;
    name?: string;
    frequency?: string;
    anyHabit?: boolean;
  };
  goal: {
    target: number;
    metric: string;
    description: string;
  };
  duration: {
    startDate: string;
    endDate: string;
    durationDays: number;
  };
  rewards: {
    winner: string[];
    participation: string[];
    xpReward: number;
  };
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  inviteCode?: string;
  createdAt: string;
  updatedAt: string;
  userProgress?: {
    currentValue: number;
    targetValue: number;
    progressPercentage: number;
    rank: number;
    achievements: Array<{
      type: string;
      unlockedAt: string;
      description: string;
    }>;
  };
}

export interface CreateChallengeData {
  name: string;
  description: string;
  type: 'streak' | 'completion_count' | 'consistency' | 'group_goal';
  habitCriteria: {
    category?: string;
    name?: string;
    frequency?: string;
    anyHabit?: boolean;
  };
  goal: {
    target: number;
    metric: string;
    description: string;
  };
  duration: {
    startDate: string;
    endDate: string;
  };
  rewards?: {
    winner?: string[];
    participation?: string[];
    xpReward?: number;
  };
  maxParticipants?: number;
  isPublic?: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  user: {
    id: string;
    username: string;
    email: string;
  };
  currentValue: number;
  targetValue: number;
  progressPercentage: number;
  achievements: Array<{
    type: string;
    unlockedAt: string;
    description: string;
  }>;
  xp: number;
}

export interface Leaderboard {
  challenge: {
    id: string;
    name: string;
    type: string;
    goal: {
      target: number;
      metric: string;
      description: string;
    };
  };
  leaderboard: LeaderboardEntry[];
}

export const challengesApi = {
  // Create a new challenge
  async createChallenge(data: CreateChallengeData): Promise<Challenge> {
    try {
      const response = await authService.makeAuthenticatedRequest(getApiUrl('/challenges'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create challenge');
      }

      return await response.json();
    } catch (error) {
      console.error('Create challenge error:', error);
      throw error;
    }
  },

  // Get all public challenges
  async getChallenges(params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
  }): Promise<{
    challenges: Challenge[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.type) searchParams.set('type', params.type);
      if (params?.status) searchParams.set('status', params.status);
      
      // Always fetch public challenges only
      searchParams.set('public', 'true');

      const query = searchParams.toString();
      const response = await authService.makeAuthenticatedRequest(
        getApiUrl(`/challenges${query ? `?${query}` : ''}`)
      );

      if (!response.ok) {
        throw new Error('Failed to fetch challenges');
      }

      return await response.json();
    } catch (error) {
      console.error('Get challenges error:', error);
      throw error;
    }
  },

  // Get user's challenges
  async getUserChallenges(status?: string): Promise<Challenge[]> {
    try {
      const query = status ? `?status=${status}` : '';
      const response = await authService.makeAuthenticatedRequest(
        getApiUrl(`/challenges/user${query}`)
      );

      if (!response.ok) {
        throw new Error('Failed to fetch user challenges');
      }

      return await response.json();
    } catch (error) {
      console.error('Get user challenges error:', error);
      throw error;
    }
  },

  // Join a challenge
  async joinChallenge(challengeId: string, inviteCode?: string): Promise<Challenge> {
    try {
      const response = await authService.makeAuthenticatedRequest(
        getApiUrl(`/challenges/${challengeId}/join`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inviteCode }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join challenge');
      }

      return await response.json();
    } catch (error) {
      console.error('Join challenge error:', error);
      throw error;
    }
  },

  // Join a challenge by invite code
  async joinByInviteCode(inviteCode: string): Promise<Challenge> {
    try {
      const response = await authService.makeAuthenticatedRequest(
        getApiUrl('/challenges/join/invite'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inviteCode }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join challenge');
      }

      return await response.json();
    } catch (error) {
      console.error('Join by invite code error:', error);
      throw error;
    }
  },

  // Leave a challenge
  async leaveChallenge(challengeId: string): Promise<{ message: string }> {
    try {
      const response = await authService.makeAuthenticatedRequest(
        getApiUrl(`/challenges/${challengeId}/leave`),
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to leave challenge');
      }

      return await response.json();
    } catch (error) {
      console.error('Leave challenge error:', error);
      throw error;
    }
  },

  // Cancel a challenge (creator only)
  async cancelChallenge(challengeId: string): Promise<{ message: string }> {
    try {
      const response = await authService.makeAuthenticatedRequest(
        getApiUrl(`/challenges/${challengeId}/cancel`),
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel challenge');
      }

      return await response.json();
    } catch (error) {
      console.error('Cancel challenge error:', error);
      throw error;
    }
  },

  // Get challenge leaderboard
  async getLeaderboard(challengeId: string): Promise<Leaderboard> {
    try {
      const url = getApiUrl(`/challenges/${challengeId}/leaderboard`);
      console.log('Fetching leaderboard from:', url);
      const response = await authService.makeAuthenticatedRequest(url);

      if (!response.ok) {
        let bodyText = '';
        try {
          bodyText = await response.text();
        } catch (e) {
          bodyText = '<unable to read response body>';
        }
        const message = `Failed to fetch leaderboard: HTTP ${response.status} - ${bodyText}`;
        console.error(message);
        throw new Error(message);
      }

      const data = await response.json();
      return data as Leaderboard;
    } catch (error) {
      console.error('Get leaderboard error:', error);
      throw error;
    }
  },

  // Get single challenge by id
  async getChallenge(challengeId: string): Promise<Challenge> {
    try {
      const url = getApiUrl(`/challenges/${challengeId}`);
      const response = await authService.makeAuthenticatedRequest(url);

      if (!response.ok) {
        let bodyText = '';
        try {
          bodyText = await response.text();
        } catch (e) {
          bodyText = '<unable to read response body>';
        }
        const message = `Failed to fetch challenge: HTTP ${response.status} - ${bodyText}`;
        console.error(message);
        throw new Error(message);
      }

      const data = await response.json();
      return data as Challenge;
    } catch (error) {
      console.error('Get challenge error:', error);
      throw error;
    }
  },

  // Generate invite code (creator only)
  async generateInviteCode(challengeId: string): Promise<{ inviteCode: string }> {
    try {
      const url = getApiUrl(`/challenges/${challengeId}/invite`);
      console.log('🌐 Calling API:', url);
      const response = await authService.makeAuthenticatedRequest(
        url,
        {
          method: 'POST',
        }
      );

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        throw new Error(errorData.error || 'Failed to generate invite code');
      }

      const data = await response.json();
      console.log('✅ Invite code response:', data);
      return data;
    } catch (error) {
      console.error('Generate invite code error:', error);
      throw error;
    }
  },

  // Update challenge progress (usually called automatically when habits are completed)
  async updateProgress(habitId: string): Promise<{ message: string; updatedChallenges: number }> {
    try {
      const response = await authService.makeAuthenticatedRequest(
        getApiUrl('/challenges/progress'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ habitId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update progress');
      }

      return await response.json();
    } catch (error) {
      console.error('Update progress error:', error);
      throw error;
    }
  },
};

export default challengesApi;

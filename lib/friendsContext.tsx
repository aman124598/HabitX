import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import authService from './auth';
import { getApiUrl } from './config';

// Interface for user profile data
export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  bio?: string;
  avatar?: string;
  isPublic?: boolean;
  totalXP?: number;
  level?: number;
  totalHabits?: number;
  activeStreaks?: number;
  longestStreak?: number;
  createdAt?: string;
}

// Interface for friend request
export interface FriendRequest {
  id: string;
  from: UserProfile;
  to: UserProfile;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

// Interface for the friends context
interface FriendsContextType {
  friends: UserProfile[];
  friendRequests: FriendRequest[];
  loading: boolean;
  error: string | null;
  getUserProfile: (userId: string) => Promise<UserProfile>;
  fetchFriends: () => Promise<void>;
  fetchFriendRequests: () => Promise<void>;
  sendFriendRequest: (userId: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  rejectFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (userId: string) => Promise<void>;
  clearError: () => void;
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

interface FriendsProviderProps {
  children: ReactNode;
}

export function FriendsProvider({ children }: FriendsProviderProps) {
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch a user's profile by ID
  const getUserProfile = useCallback(async (userId: string): Promise<UserProfile> => {
    try {
      const response = await authService.makeAuthenticatedRequest(
        getApiUrl(`/users/${userId}/profile`)
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch user profile');
      }

      const data = await response.json();
      return data.user || data;
    } catch (err: any) {
      console.error('Get user profile error:', err);
      throw err;
    }
  }, []);

  // Fetch friends list
  const fetchFriends = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.makeAuthenticatedRequest(
        getApiUrl('/friends')
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch friends');
      }

      const data = await response.json();
      setFriends(data.friends || []);
    } catch (err: any) {
      console.error('Fetch friends error:', err);
      setError(err.message || 'Failed to fetch friends');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch friend requests
  const fetchFriendRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.makeAuthenticatedRequest(
        getApiUrl('/friends/requests')
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch friend requests');
      }

      const data = await response.json();
      setFriendRequests(data.requests || []);
    } catch (err: any) {
      console.error('Fetch friend requests error:', err);
      setError(err.message || 'Failed to fetch friend requests');
    } finally {
      setLoading(false);
    }
  }, []);

  // Send a friend request
  const sendFriendRequest = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.makeAuthenticatedRequest(
        getApiUrl('/friends/request'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send friend request');
      }

      // Refresh friend requests
      await fetchFriendRequests();
    } catch (err: any) {
      console.error('Send friend request error:', err);
      setError(err.message || 'Failed to send friend request');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchFriendRequests]);

  // Accept a friend request
  const acceptFriendRequest = useCallback(async (requestId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.makeAuthenticatedRequest(
        getApiUrl(`/friends/request/${requestId}/accept`),
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to accept friend request');
      }

      // Refresh both friends and requests
      await Promise.all([fetchFriends(), fetchFriendRequests()]);
    } catch (err: any) {
      console.error('Accept friend request error:', err);
      setError(err.message || 'Failed to accept friend request');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchFriends, fetchFriendRequests]);

  // Reject a friend request
  const rejectFriendRequest = useCallback(async (requestId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.makeAuthenticatedRequest(
        getApiUrl(`/friends/request/${requestId}/reject`),
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject friend request');
      }

      // Refresh friend requests
      await fetchFriendRequests();
    } catch (err: any) {
      console.error('Reject friend request error:', err);
      setError(err.message || 'Failed to reject friend request');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchFriendRequests]);

  // Remove a friend
  const removeFriend = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.makeAuthenticatedRequest(
        getApiUrl(`/friends/${userId}`),
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove friend');
      }

      // Refresh friends list
      await fetchFriends();
    } catch (err: any) {
      console.error('Remove friend error:', err);
      setError(err.message || 'Failed to remove friend');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchFriends]);

  const value: FriendsContextType = {
    friends,
    friendRequests,
    loading,
    error,
    getUserProfile,
    fetchFriends,
    fetchFriendRequests,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    clearError,
  };

  return (
    <FriendsContext.Provider value={value}>
      {children}
    </FriendsContext.Provider>
  );
}

export function useFriends(): FriendsContextType {
  const context = useContext(FriendsContext);
  if (context === undefined) {
    throw new Error('useFriends must be used within a FriendsProvider');
  }
  return context;
}

export default FriendsContext;

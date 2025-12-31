import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import friendsApi, { Friend, FriendRequest, FriendRequestsResponse, UserSearchResult, UserProfile } from './friendsApi';
import authService from './auth';

interface FriendsContextType {
  // State
  friends: Friend[];
  friendRequests: FriendRequestsResponse | null;
  searchResults: UserSearchResult[];
  isLoading: boolean;
  error: string | null;

  // Actions
  searchUsers: (query: string, limit?: number) => Promise<void>;
  sendFriendRequest: (userId: string) => Promise<void>;
  cancelFriendRequest: (requestId: string) => Promise<void>;
  respondToFriendRequest: (requestId: string, action: 'accept' | 'decline') => Promise<void>;
  getFriends: () => Promise<void>;
  getFriendRequests: () => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  getUserProfile: (userId: string) => Promise<UserProfile>;
  clearError: () => void;
  clearSearchResults: () => void;
  refreshFriendsData: () => Promise<void>;
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

interface FriendsProviderProps {
  children: ReactNode;
}

export function FriendsProvider({ children }: FriendsProviderProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequestsResponse | null>(null);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearSearchResults = useCallback(() => {
    setSearchResults([]);
  }, []);

  const searchUsers = useCallback(async (query: string, limit?: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const results = await friendsApi.searchUsers(query, limit);
      setSearchResults(results);
    } catch (err: any) {
      setError(err.message || 'Failed to search users');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendFriendRequest = useCallback(async (userId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await friendsApi.sendFriendRequest(userId);
      
      // Update search results to reflect the new status
      setSearchResults(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, friendshipStatus: 'request_sent' as const }
            : user
        )
      );
      
      // Refresh friend requests to include the new sent request
      try {
        const requests = await friendsApi.getFriendRequests();
        setFriendRequests(requests);
      } catch (refreshError) {
        console.log('Could not refresh friend requests after sending:', refreshError);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send friend request');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancelFriendRequest = useCallback(async (requestId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await friendsApi.cancelFriendRequest(requestId);
      
      // Refresh friend requests to remove the cancelled request
      const requests = await friendsApi.getFriendRequests();
      setFriendRequests(requests);
      
      // Update search results to reflect the changed status if the recipient is in search results
      setSearchResults(prev => 
        prev.map(user => 
          user.friendshipStatus === 'request_sent' 
            ? { ...user, friendshipStatus: 'none' as const }
            : user
        )
      );
    } catch (err: any) {
      setError(err.message || 'Failed to cancel friend request');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const respondToFriendRequest = useCallback(async (requestId: string, action: 'accept' | 'decline') => {
    try {
      setIsLoading(true);
      setError(null);
      // Client-side validation: ensure current user is recipient of the request before calling API
      try {
        const currentUser = authService.getCurrentUser();
        if (currentUser && friendRequests) {
          const found = [...(friendRequests.received || []), ...(friendRequests.sent || [])].find(r => r.id === requestId);
          if (found) {
            // If action is accept/decline, only recipient should respond
            if (action === 'accept' || action === 'decline') {
              if (found.recipient?.id && currentUser.id !== found.recipient.id) {
                const err = new Error('You are not the recipient of this friend request');
                (err as any).status = 403;
                throw err;
              }
            }
          } else if (__DEV__) {
            console.warn('RespondToFriendRequest: requestId not found in local friendRequests - proceeding to call API for server validation', requestId);
          }
        }
      } catch (validationError) {
        console.error('Client-side validation failed for respondToFriendRequest:', validationError);
        throw validationError;
      }

      await friendsApi.respondToFriendRequest(requestId, action);
      
      // Refresh friend requests and friends list
      const requests = await friendsApi.getFriendRequests();
      setFriendRequests(requests);
      if (action === 'accept') {
        const friendsList = await friendsApi.getFriends();
        setFriends(friendsList);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to respond to friend request');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getFriends = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      console.log('📱 Skipping getFriends - user not authenticated');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      const friendsList = await friendsApi.getFriends();
      setFriends(friendsList);
    } catch (err: any) {
      console.error('Get friends error:', err);
      setError(err.message || 'Failed to get friends');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getFriendRequests = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      console.log('📱 Skipping getFriendRequests - user not authenticated');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔄 Fetching friend requests...');
      const requests = await friendsApi.getFriendRequests();
      setFriendRequests(requests);
    } catch (err: any) {
      // Reduce console noise - only log in development or for new error types
      if (__DEV__ || err.status !== 500) {
        console.error('💥 Get friend requests error:', err);
      }
      
      // Set user-friendly error message based on error type
      let userMessage = 'Unable to load friend requests';
      if (err.status === 503) {
        userMessage = 'Friend requests temporarily disabled due to server issues. Please try again in a minute.';
      } else if (err.status === 500) {
        if (err.message?.includes('toISOString') || err.message?.includes('formatting error')) {
          userMessage = 'Friend request data is corrupted on server. Please contact support.';
        } else {
          userMessage = 'Server is temporarily unavailable. Your friend requests will load when service is restored.';
        }
      } else if (err.status === 401) {
        userMessage = 'Please log in again to view your friend requests.';
      } else if (err.status === 403) {
        userMessage = 'You don\'t have permission to access friend requests.';
      } else if (
        // Only classify as network issue for actual fetch/network failures
        (err?.name === 'TypeError' && /network/i.test(err?.message || '')) ||
        (!err?.status && /network/i.test(err?.message || ''))
      ) {
        userMessage = 'Network connection issue. Please check your internet and try again.';
      }
      
      setError(userMessage);
      
      // Set empty friend requests as fallback to prevent crashes
      setFriendRequests({ sent: [], received: [] });
      
      // Don't throw the error to prevent endless retry loops with corrupted data
      // Instead, just provide fallback data silently
      if (__DEV__) {
        console.warn('⚠️ Friend requests failed, using fallback empty data to prevent crashes');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeFriend = useCallback(async (friendId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await friendsApi.removeFriend(friendId);
      
      // Remove friend from local state
      setFriends(prev => prev.filter(friend => friend.id !== friendId));
    } catch (err: any) {
      setError(err.message || 'Failed to remove friend');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getUserProfile = useCallback(async (userId: string): Promise<UserProfile> => {
    if (!authService.isAuthenticated()) {
      throw new Error('User not authenticated');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      const profile = await friendsApi.getUserProfile(userId);
      return profile;
    } catch (err: any) {
      console.error('Get user profile error:', err);
      setError(err.message || 'Failed to get user profile');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshFriendsData = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      console.log('📱 Skipping refreshFriendsData - user not authenticated');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Try to refresh both friends and requests, but don't fail completely if one fails
      const results = await Promise.allSettled([
        friendsApi.getFriends(),
        friendsApi.getFriendRequests(),
      ]);
      
      // Handle friends result
      if (results[0].status === 'fulfilled') {
        setFriends(results[0].value);
      } else {
        console.error('Failed to refresh friends:', results[0].reason);
      }
      
      // Handle friend requests result
      if (results[1].status === 'fulfilled') {
        setFriendRequests(results[1].value);
      } else {
        console.error('Failed to refresh friend requests:', results[1].reason);
        // Set error only if friend requests failed
        if (results[1].reason?.status === 500) {
          setError('Server is temporarily unavailable. Some features may not work properly.');
        }
      }
      
      // If both failed, throw error
      if (results[0].status === 'rejected' && results[1].status === 'rejected') {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to refresh friends data');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: FriendsContextType = {
    friends,
    friendRequests,
    searchResults,
    isLoading,
    error,
    searchUsers,
    sendFriendRequest,
    cancelFriendRequest,
    respondToFriendRequest,
    getFriends,
    getFriendRequests,
    removeFriend,
    getUserProfile,
    clearError,
    clearSearchResults,
    refreshFriendsData,
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
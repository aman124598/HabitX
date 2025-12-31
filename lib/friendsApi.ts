import authService from './auth';
import { getApiUrl } from './config';

// Interface for friend response
export interface Friend {
  id: string;
  username: string;
  email: string;
  totalXP: number;
  level: number;
  bio?: string;
  avatar?: string;
  isPublic: boolean;
  createdAt: string;
  friendsSince?: string;
}

// Interface for user search result
export interface UserSearchResult {
  id: string;
  username: string;
  email: string;
  totalXP: number;
  level: number;
  bio?: string;
  avatar?: string;
  isPublic: boolean;
  createdAt: string;
  friendshipStatus: 'none' | 'friends' | 'request_sent' | 'request_received' | 'blocked';
}

// Interface for friend request
export interface FriendRequest {
  id: string;
  requester: Friend;
  recipient: Friend;
  status: string;
  createdAt: string;
}

// Interface for user profile with stats
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  totalXP: number;
  level: number;
  bio?: string;
  avatar?: string;
  isPublic: boolean;
  createdAt: string;
  habitStats: {
    totalHabits: number;
    completedToday: number;
    activeStreaks: number;
    longestStreak: number;
  };
  friendshipStatus: 'none' | 'friends' | 'request_sent' | 'request_received' | 'blocked' | 'self';
}

// Interface for friend requests response
export interface FriendRequestsResponse {
  sent: FriendRequest[];
  received: FriendRequest[];
}

// Simple circuit breaker to prevent spam requests
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly threshold = 3;
  private readonly resetTime = 60000; // 1 minute

  isOpen(): boolean {
    if (this.failureCount >= this.threshold) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure > this.resetTime) {
        this.reset();
        return false;
      }
      return true;
    }
    return false;
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
  }

  recordSuccess(): void {
    this.reset();
  }

  private reset(): void {
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }
}

const friendRequestsCircuitBreaker = new CircuitBreaker();

export const friendsApi = {
  // Health check endpoint
  async healthCheck(): Promise<boolean> {
    try {
      console.log('🏥 Checking backend health...');
      // Health endpoint is at root level, not under /api and doesn't require authentication
  const apiUrl = getApiUrl('');
  console.log('🏥 Raw API URL:', apiUrl);
  // Remove a trailing /api only (safer than generic replace which could remove mid-path occurrences)
  const baseUrl = apiUrl.replace(/\/api\/?$/, '');
      console.log('🏥 Base URL after processing:', baseUrl);
      const healthUrl = `${baseUrl}/health`;
      console.log('🏥 Health check URL:', healthUrl);
      
      // Use regular fetch since health check doesn't require authentication
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      
      const isHealthy = response.ok;
      console.log(isHealthy ? '✅ Backend is healthy' : '❌ Backend is unhealthy');
      
      if (!isHealthy) {
        console.log('🏥 Health check response status:', response.status);
        const text = await response.text().catch(() => 'Unable to read response');
        console.log('🏥 Health check response:', text);
      }
      
      return isHealthy;
    } catch (error) {
      console.error('❌ Backend health check failed:', error);
      return false;
    }
  },

  // Search users by username or email
  async searchUsers(query: string, limit?: number): Promise<UserSearchResult[]> {
    try {
      const params = new URLSearchParams({ query });
      if (limit) params.append('limit', limit.toString());
      
      const response = await authService.makeAuthenticatedRequest(
        getApiUrl(`/friends/search?${params.toString()}`)
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to search users');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Search users error:', error);
      throw error;
    }
  },

  // Send friend request
  async sendFriendRequest(userId: string): Promise<void> {
    try {
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
        throw new Error(errorData.message || 'Failed to send friend request');
      }
    } catch (error) {
      console.error('Send friend request error:', error);
      throw error;
    }
  },

  // Respond to friend request (accept/decline)
  async respondToFriendRequest(requestId: string, action: 'accept' | 'decline'): Promise<void> {
    try {
      if (__DEV__) {
        console.log('🔁 Respond to friend request:', { requestId, action });
      }

      const response = await authService.makeAuthenticatedRequest(
        getApiUrl(`/friends/request/${requestId}`),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action }),
        }
      );

      if (!response.ok) {
        // Try to read the response body for better diagnostics
        let errorText = '';
        try {
          const json = await response.json();
          errorText = json?.message || JSON.stringify(json);
        } catch (e) {
          try {
            errorText = await response.text();
          } catch (e2) {
            errorText = `Status ${response.status} ${response.statusText}`;
          }
        }

        console.error('❌ Respond to friend request failed:', {
          requestId,
          action,
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });

        throw new Error(errorText || 'Failed to respond to friend request');
      }
    } catch (error) {
      console.error('Respond to friend request error:', error);
      throw error;
    }
  },

  // Get friend requests (sent and received)
  async getFriendRequests(): Promise<FriendRequestsResponse> {
    // Temporarily disable circuit breaker gating to avoid false "connection" UI
    // We'll still record failures/success to keep telemetry but won't block requests here.

    try {
      if (__DEV__) {
        console.log('🔄 Fetching friend requests...');
      }
      const response = await authService.makeAuthenticatedRequest(
        getApiUrl('/friends/requests')
      );

      if (__DEV__) {
        console.log('📡 Friend requests response status:', response.status);
      }

      if (!response.ok) {
        let errorMessage = 'Failed to get friend requests';
        let errorDetails = null;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          errorDetails = errorData;
          
          // Only log detailed errors in development or for non-500 errors
          if (__DEV__ || response.status !== 500) {
            console.error('❌ Friend requests API error:', {
              status: response.status,
              statusText: response.statusText,
              error: errorData
            });
          }
        } catch (parseError) {
          if (__DEV__) {
            console.error('❌ Failed to parse error response:', parseError);
          }
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }

        // For 500 errors with specific backend issues, provide detailed error message
        if (response.status === 500) {
          if (errorDetails?.message?.includes('toISOString')) {
            errorMessage = 'Backend data formatting error. Friend request data may be corrupted. Please contact support.';
            if (__DEV__) {
              console.error('🐛 Backend formatRequest error detected - likely missing createdAt field in friend request data');
            }
          } else {
            errorMessage = 'Server is experiencing issues. Please try again later.';
            // Reduced logging for known 500 errors
            if (__DEV__) {
              console.warn('⚠️ Friend requests 500 error (backend issue known)');
            }
          }
        }

        // Record failure for circuit breaker
        if (response.status === 500) {
          friendRequestsCircuitBreaker.recordFailure();
        }

        const error = new Error(errorMessage);
        (error as any).status = response.status;
        (error as any).details = errorDetails;
        throw error;
      }

      const data = await response.json();
      
      // Record success and reset circuit breaker
      friendRequestsCircuitBreaker.recordSuccess();
      
      if (__DEV__) {
        console.log('✅ Friend requests loaded successfully:', {
          sent: data.data?.sent?.length || 0,
          received: data.data?.received?.length || 0
        });
      }
      
      // Validate and sanitize the response data to prevent frontend crashes
      const sanitizedData = {
        sent: (data.data?.sent || []).map((request: any) => ({
          ...request,
          createdAt: request.createdAt || new Date().toISOString(), // Fallback for missing dates
          requester: {
            ...request.requester,
            createdAt: request.requester?.createdAt || new Date().toISOString()
          },
          recipient: {
            ...request.recipient,
            createdAt: request.recipient?.createdAt || new Date().toISOString()
          }
        })),
        received: (data.data?.received || []).map((request: any) => ({
          ...request,
          createdAt: request.createdAt || new Date().toISOString(), // Fallback for missing dates
          requester: {
            ...request.requester,
            createdAt: request.requester?.createdAt || new Date().toISOString()
          },
          recipient: {
            ...request.recipient,
            createdAt: request.recipient?.createdAt || new Date().toISOString()
          }
        }))
      };
      
      return sanitizedData;
    } catch (error: any) {
      // Record failure for circuit breaker (except for circuit breaker errors)
      if (error.status !== 503 && error.status === 500) {
        friendRequestsCircuitBreaker.recordFailure();
      }

      // Only log detailed errors in development or for non-500 errors
      if (__DEV__ || error.status !== 500) {
        console.error('💥 Get friend requests error:', {
          message: error.message,
          status: error.status,
          stack: error.stack
        });
      } else {
        // Minimal logging for known 500 errors in production
        console.warn('⚠️ Friend requests unavailable (backend issue)');
      }
      
      // If it's a network error, provide a more user-friendly message
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        error.message = 'Network error. Please check your internet connection.';
      }
      
      throw error;
    }
  },

  // Get friends list
  async getFriends(): Promise<Friend[]> {
    try {
      const response = await authService.makeAuthenticatedRequest(
        getApiUrl('/friends')
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get friends');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Get friends error:', error);
      throw error;
    }
  },

  // Remove friend
  async removeFriend(friendId: string): Promise<void> {
    try {
      const response = await authService.makeAuthenticatedRequest(
        getApiUrl(`/friends/${friendId}`),
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove friend');
      }
    } catch (error) {
      console.error('Remove friend error:', error);
      throw error;
    }
  },

  // Get user profile
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const response = await authService.makeAuthenticatedRequest(
        getApiUrl(`/friends/profile/${userId}`)
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get user profile');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  },

  // Cancel friend request
  async cancelFriendRequest(requestId: string): Promise<void> {
    try {
      if (__DEV__) {
        console.log('🔄 Canceling friend request:', requestId);
      }
      
      const response = await authService.makeAuthenticatedRequest(
        getApiUrl(`/friends/request/${requestId}`),
        {
          method: 'DELETE',
        }
      );

      if (__DEV__) {
        console.log('📡 Cancel request response status:', response.status);
      }

      if (!response.ok) {
        let errorMessage = 'Failed to cancel friend request';
        let errorDetails = null;
        
        try {
          errorDetails = await response.json();
          errorMessage = errorDetails.message || errorMessage;
          
          console.error('❌ Cancel friend request API error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorDetails
          });
        } catch (parseError) {
          console.error('❌ Failed to parse cancel request error response:', parseError);
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }

        // Create a more informative error
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        (error as any).details = errorDetails;
        throw error;
      }

      if (__DEV__) {
        console.log('✅ Friend request cancelled successfully');
      }
    } catch (error) {
      console.error('Cancel friend request error:', error);
      throw error;
    }
  },

  // Debug function to get raw friend request data for backend inspection
  async debugFriendRequests(): Promise<any> {
    try {
      console.log('🔍 Fetching raw friend request data for debugging...');
      const response = await authService.makeAuthenticatedRequest(
        getApiUrl('/friends/debug/requests')
      );

      if (!response.ok) {
        console.error('❌ Debug API not available or failed');
        return null;
      }

      const data = await response.json();
      console.log('🐛 Raw friend request data:', data);
      return data;
    } catch (error) {
      console.error('Debug friend requests error:', error);
      return null;
    }
  },

  // Function to report backend data corruption issues
  async reportDataCorruption(details: any): Promise<void> {
    try {
      console.log('📢 Reporting data corruption to backend...');
      await authService.makeAuthenticatedRequest(
        getApiUrl('/friends/report-corruption'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            issue: 'toISOString_error',
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            details
          }),
        }
      );
      console.log('✅ Data corruption report sent');
    } catch (error) {
      console.error('Failed to report data corruption:', error);
    }
  },
};

export default friendsApi;
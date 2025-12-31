import { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import { friendNotificationService } from '../lib/friendNotificationService';
import { useFriends } from '../lib/friendsContext';

export interface UseFriendNotificationsReturn {
  friendRequestCount: number;
  isNotificationEnabled: boolean;
  refreshNotificationCount: () => Promise<void>;
  clearNotifications: () => Promise<void>;
  initializeNotifications: () => Promise<void>;
}

export function useFriendNotifications(): UseFriendNotificationsReturn {
  const { friendRequests } = useFriends();
  const [friendRequestCount, setFriendRequestCount] = useState(0);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(true);

  // Initialize notifications when hook is first used
  useEffect(() => {
    initializeNotifications();
  }, []);

  // Update count when friend requests change
  useEffect(() => {
    const count = friendRequests?.received.length || 0;
    setFriendRequestCount(count);
    friendNotificationService.updateFriendRequestCount(count);
  }, [friendRequests]);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // App became active, refresh notification count
        refreshNotificationCount();
      }
    });

    return () => subscription?.remove();
  }, []);

  const initializeNotifications = useCallback(async () => {
    try {
      await friendNotificationService.initializeService();
      const settings = friendNotificationService.getSettings();
      setIsNotificationEnabled(settings.enabled);
      await refreshNotificationCount();
    } catch (error) {
      console.error('Failed to initialize friend notifications:', error);
    }
  }, []);

  const refreshNotificationCount = useCallback(async () => {
    try {
      const count = await friendNotificationService.getFriendRequestCount();
      setFriendRequestCount(count);
    } catch (error) {
      console.error('Failed to refresh notification count:', error);
    }
  }, []);

  const clearNotifications = useCallback(async () => {
    try {
      await friendNotificationService.clearFriendRequestNotifications();
      setFriendRequestCount(0);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  }, []);

  return {
    friendRequestCount,
    isNotificationEnabled,
    refreshNotificationCount,
    clearNotifications,
    initializeNotifications,
  };
}
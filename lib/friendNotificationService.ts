import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SafeNotifications from './safeNotifications';
import { authService } from './auth';
import { friendsApi, FriendRequest } from './friendsApi';
import { toastService } from './toastService';

// Storage keys for friend notifications
const FRIEND_NOTIFICATION_SETTINGS_KEY = 'friend_notification_settings';
const LAST_FRIEND_REQUEST_CHECK_KEY = 'last_friend_request_check';
const FRIEND_REQUEST_COUNT_KEY = 'friend_request_count';

interface FriendNotificationSettings {
  enabled: boolean;
  friendRequestReceived: boolean;
  friendRequestAccepted: boolean;
  newFriendActivity: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

const DEFAULT_FRIEND_SETTINGS: FriendNotificationSettings = {
  enabled: true,
  friendRequestReceived: true,
  friendRequestAccepted: true,
  newFriendActivity: true,
  soundEnabled: true,
  vibrationEnabled: true,
};

class FriendNotificationService {
  private settings: FriendNotificationSettings = DEFAULT_FRIEND_SETTINGS;
  private isInitialized = false;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeService();
  }

  // Initialize the service
  async initializeService() {
    if (this.isInitialized) return;

    try {
      await this.loadSettings();
      await this.setupNotificationHandler();
      await this.startPeriodicCheck();
      this.isInitialized = true;
      console.log('Friend notification service initialized');
    } catch (error) {
      console.error('Failed to initialize friend notification service:', error);
    }
  }

  // Setup notification handler specifically for friend notifications
  private async setupNotificationHandler() {
    SafeNotifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const isFriendNotification = notification.request.content.data?.category === 'friend';
        
        return {
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: this.settings.soundEnabled && isFriendNotification,
          shouldSetBadge: true,
        };
      },
    });
  }

  // Load settings from storage
  private async loadSettings() {
    try {
      const settingsJson = await AsyncStorage.getItem(FRIEND_NOTIFICATION_SETTINGS_KEY);
      if (settingsJson) {
        this.settings = { ...DEFAULT_FRIEND_SETTINGS, ...JSON.parse(settingsJson) };
      }
    } catch (error) {
      console.error('Failed to load friend notification settings:', error);
      this.settings = DEFAULT_FRIEND_SETTINGS;
    }
  }

  // Save settings to storage
  async saveSettings(settings: Partial<FriendNotificationSettings>) {
    try {
      this.settings = { ...this.settings, ...settings };
      await AsyncStorage.setItem(FRIEND_NOTIFICATION_SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save friend notification settings:', error);
    }
  }

  // Get current settings
  getSettings(): FriendNotificationSettings {
    return { ...this.settings };
  }

  // Start periodic check for friend requests
  private async startPeriodicCheck() {
    if (!this.settings.enabled || !authService.isAuthenticated()) {
      return;
    }

    // Check every 30 seconds for friend requests when app is active
    this.checkInterval = setInterval(async () => {
      await this.checkForNewFriendRequests();
    }, 30000);

    // Initial check
    await this.checkForNewFriendRequests();
  }

  // Stop periodic check
  stopPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Check for new friend requests
  async checkForNewFriendRequests() {
    try {
      if (!this.settings.enabled || !authService.isAuthenticated()) {
        return;
      }

      const friendRequests = await friendsApi.getFriendRequests();
      const currentRequestCount = friendRequests.received.length;
      
      // Get last known count
      const lastCountStr = await AsyncStorage.getItem(FRIEND_REQUEST_COUNT_KEY);
      const lastCount = lastCountStr ? parseInt(lastCountStr, 10) : 0;

      // If we have new friend requests, send notification
      if (currentRequestCount > lastCount) {
        const newRequestsCount = currentRequestCount - lastCount;
        await this.sendNewFriendRequestNotification(newRequestsCount, friendRequests.received[0]);
        
        // Also show in-app toast for immediate feedback
        if (newRequestsCount === 1 && friendRequests.received[0]) {
          toastService.friendRequestReceived(friendRequests.received[0].requester.username);
        } else {
          toastService.info('New Friend Requests', `You have ${newRequestsCount} new friend requests!`);
        }
      }

      // Update stored count
      await AsyncStorage.setItem(FRIEND_REQUEST_COUNT_KEY, currentRequestCount.toString());
      
      // Update last check time
      await AsyncStorage.setItem(LAST_FRIEND_REQUEST_CHECK_KEY, new Date().toISOString());
      
    } catch (error) {
      console.error('Failed to check for friend requests:', error);
    }
  }

  // Send notification for new friend request received
  async sendNewFriendRequestNotification(count: number, latestRequest?: FriendRequest) {
    if (!this.settings.enabled || !this.settings.friendRequestReceived) {
      return;
    }

    try {
      const title = count === 1 ? '👋 New Friend Request!' : `👋 ${count} New Friend Requests!`;
      let body = '';

      if (count === 1 && latestRequest) {
        body = `${latestRequest.requester.username} wants to be your friend!`;
      } else {
        body = `You have ${count} new friend requests waiting for you.`;
      }

      await SafeNotifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { 
            type: 'friend_request_received',
            category: 'friend',
            count,
            requestId: latestRequest?.id,
            requesterUsername: latestRequest?.requester.username,
          },
          sound: this.settings.soundEnabled ? 'default' : undefined,
          badge: count,
        },
        trigger: null,
      });

      console.log(`Friend request notification sent for ${count} request(s)`);
    } catch (error) {
      console.error('Failed to send friend request notification:', error);
    }
  }

  // Send notification when friend request is accepted
  async sendFriendRequestAcceptedNotification(username: string, userLevel: number, userXP: number) {
    if (!this.settings.enabled || !this.settings.friendRequestAccepted) {
      return;
    }

    try {
      await SafeNotifications.scheduleNotificationAsync({
        content: {
          title: '🎉 Friend Request Accepted!',
          body: `${username} (Level ${userLevel}) accepted your friend request! Start encouraging each other!`,
          data: { 
            type: 'friend_request_accepted',
            category: 'friend',
            username,
            userLevel,
            userXP,
          },
          sound: this.settings.soundEnabled ? 'default' : undefined,
        },
        trigger: null,
      });

      console.log(`Friend request accepted notification sent for ${username}`);
    } catch (error) {
      console.error('Failed to send friend request accepted notification:', error);
    }
  }

  // Send notification for friend activity (level up, achievements, etc.)
  async sendFriendActivityNotification(
    username: string, 
    activityType: 'level_up' | 'achievement' | 'streak_milestone',
    details: any
  ) {
    if (!this.settings.enabled || !this.settings.newFriendActivity) {
      return;
    }

    try {
      let title = '';
      let body = '';

      switch (activityType) {
        case 'level_up':
          title = '🚀 Friend Level Up!';
          body = `${username} reached Level ${details.newLevel}! Send them some encouragement!`;
          break;
        case 'achievement':
          title = '🏆 Friend Achievement!';
          body = `${username} unlocked "${details.achievementName}"! Congratulate them!`;
          break;
        case 'streak_milestone':
          title = '🔥 Friend Streak Milestone!';
          body = `${username} hit a ${details.streakDays}-day streak in "${details.habitName}"! Amazing!`;
          break;
        default:
          return;
      }

      await SafeNotifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { 
            type: 'friend_activity',
            category: 'friend',
            username,
            activityType,
            details,
          },
          sound: this.settings.soundEnabled ? 'default' : undefined,
        },
        trigger: null,
      });

      console.log(`Friend activity notification sent for ${username} - ${activityType}`);
    } catch (error) {
      console.error('Failed to send friend activity notification:', error);
    }
  }

  // Send friend encouragement notification (when friend completes a challenging habit)
  async sendFriendEncouragementNotification(username: string, habitName: string, streakDays: number) {
    if (!this.settings.enabled || !this.settings.newFriendActivity) {
      return;
    }

    try {
      await SafeNotifications.scheduleNotificationAsync({
        content: {
          title: '💪 Encourage Your Friend!',
          body: `${username} just completed "${habitName}" (${streakDays} day streak). Send them a message!`,
          data: { 
            type: 'friend_encouragement',
            category: 'friend',
            username,
            habitName,
            streakDays,
          },
          sound: this.settings.soundEnabled ? 'default' : undefined,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to send friend encouragement notification:', error);
    }
  }

  // Get current friend request count for badge
  async getFriendRequestCount(): Promise<number> {
    try {
      const countStr = await AsyncStorage.getItem(FRIEND_REQUEST_COUNT_KEY);
      return countStr ? parseInt(countStr, 10) : 0;
    } catch (error) {
      console.error('Failed to get friend request count:', error);
      return 0;
    }
  }

  // Update friend request count (call this when user views friend requests)
  async updateFriendRequestCount(count: number) {
    try {
      await AsyncStorage.setItem(FRIEND_REQUEST_COUNT_KEY, count.toString());
    } catch (error) {
      console.error('Failed to update friend request count:', error);
    }
  }

  // Clear all friend request notifications
  async clearFriendRequestNotifications() {
    try {
      await AsyncStorage.setItem(FRIEND_REQUEST_COUNT_KEY, '0');
      // Clear badge by sending a notification with badge: 0
      await SafeNotifications.scheduleNotificationAsync({
        content: {
          title: '',
          body: '',
          badge: 0,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to clear friend request notifications:', error);
    }
  }

  // Handle notification tap/interaction
  async handleNotificationResponse(response: Notifications.NotificationResponse) {
    const data = response.notification.request.content.data;
    
    if (data.category !== 'friend') {
      return false; // Not handled by this service
    }

    // Clear badge when user interacts with friend notifications
    try {
      await SafeNotifications.scheduleNotificationAsync({
        content: { title: '', body: '', badge: 0 },
        trigger: null,
      });
    } catch (error) {
      console.warn('Failed to clear badge:', error);
    }

    switch (data.type) {
      case 'friend_request_received':
        // Navigate to friends tab with focus on friend requests
        return { route: '/friends', params: { focus: 'requests' } };
      case 'friend_request_accepted':
        // Navigate to friends tab or user profile
        return { route: '/friends', params: { focus: 'friends' } };
      case 'friend_activity':
        // Navigate to friend's profile or activity feed
        return { route: '/UserProfile', params: { username: data.username } };
      case 'friend_encouragement':
        // Navigate to messaging or friends tab
        return { route: '/friends', params: { focus: 'friends' } };
      default:
        return { route: '/friends' };
    }
  }

  // Schedule background check for friend requests
  async scheduleBackgroundCheck() {
    try {
      if (Platform.OS === 'ios') {
        // iOS background processing
        await SafeNotifications.scheduleNotificationAsync({
          content: {
            title: 'Checking for friend updates...',
            body: '',
            data: { type: 'background_check' },
          },
          trigger: {
            type: 'timeInterval',
            seconds: 300, // 5 minutes
            repeats: true,
          } as Notifications.TimeIntervalTriggerInput,
        });
      }
    } catch (error) {
      console.error('Failed to schedule background check:', error);
    }
  }

  // Cancel all friend notifications
  async cancelAllFriendNotifications() {
    try {
      const scheduledNotifications = await SafeNotifications.getAllScheduledNotificationsAsync();
      
      for (const notification of scheduledNotifications) {
        if (notification.content.data?.category === 'friend') {
          await SafeNotifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
      
      this.stopPeriodicCheck();
      console.log('All friend notifications cancelled');
    } catch (error) {
      console.error('Failed to cancel friend notifications:', error);
    }
  }

  // Get debug information
  async getDebugInfo() {
    try {
      const count = await this.getFriendRequestCount();
      const lastCheck = await AsyncStorage.getItem(LAST_FRIEND_REQUEST_CHECK_KEY);
      
      return {
        settings: this.settings,
        isInitialized: this.isInitialized,
        hasActiveCheck: this.checkInterval !== null,
        friendRequestCount: count,
        lastCheck: lastCheck ? new Date(lastCheck) : null,
      };
    } catch (error) {
      console.error('Failed to get debug info:', error);
      return null;
    }
  }
}

export const friendNotificationService = new FriendNotificationService();
export type { FriendNotificationSettings };
export { DEFAULT_FRIEND_SETTINGS };
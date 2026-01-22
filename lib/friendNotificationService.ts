import * as Notifications from 'expo-notifications';
import SafeNotifications from './safeNotifications';

interface NotificationResponse {
  route?: string;
  action?: string;
}

/**
 * Friend Notification Service - handles friend-related notifications
 */
export const friendNotificationService = {
  /**
   * Initialize the notification service
   */
  initializeService(): void {
    // Configure notification handling
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  },

  /**
   * Handle notification response when user taps on notification
   */
  async handleNotificationResponse(response: Notifications.NotificationResponse): Promise<NotificationResponse | null> {
    try {
      const data = response.notification.request.content.data;
      
      if (data?.type === 'friend_request') {
        return { route: '/FriendRequests' };
      }
      
      if (data?.type === 'friend_accepted') {
        return { route: '/FriendSearch' };
      }
      
      return null;
    } catch (error) {
      console.error('Error handling notification response:', error);
      return null;
    }
  },

  /**
   * Send a friend request notification
   */
  async sendFriendRequestNotification(fromUsername: string): Promise<void> {
    try {
      await SafeNotifications.scheduleNotificationAsync({
        content: {
          title: 'New Friend Request',
          body: `${fromUsername} wants to be your friend!`,
          data: { type: 'friend_request' },
        },
        trigger: null, // Immediate
      });
    } catch (error) {
      console.error('Failed to send friend request notification:', error);
    }
  },

  /**
   * Send friend accepted notification
   */
  async sendFriendAcceptedNotification(username: string): Promise<void> {
    try {
      await SafeNotifications.scheduleNotificationAsync({
        content: {
          title: 'Friend Request Accepted',
          body: `${username} accepted your friend request!`,
          data: { type: 'friend_accepted' },
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to send friend accepted notification:', error);
    }
  },

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  },
};

export default friendNotificationService;

import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Wrapper to safely use expo-notifications without triggering push token registration in Expo Go
class SafeNotifications {
  static isExpoGo = Constants.appOwnership === 'expo';

  // Safe notification handler setup
  static setNotificationHandler(handler: Notifications.NotificationHandler) {
    try {
      Notifications.setNotificationHandler(handler);
    } catch (error) {
      console.warn('Failed to set notification handler:', error);
    }
  }

  // Safe permission request
  static async requestPermissionsAsync(): Promise<Notifications.NotificationPermissionsStatus> {
    try {
      return await Notifications.requestPermissionsAsync();
    } catch (error) {
      console.warn('Failed to request notification permissions:', error);
      return { status: 'denied' } as Notifications.NotificationPermissionsStatus;
    }
  }

  // Safe permission check
  static async getPermissionsAsync(): Promise<Notifications.NotificationPermissionsStatus> {
    try {
      return await Notifications.getPermissionsAsync();
    } catch (error) {
      console.warn('Failed to get notification permissions:', error);
      return { status: 'denied' } as Notifications.NotificationPermissionsStatus;
    }
  }

  // Safe notification scheduling
  static async scheduleNotificationAsync(
    notificationRequest: Notifications.NotificationRequestInput
  ): Promise<string> {
    try {
      return await Notifications.scheduleNotificationAsync(notificationRequest);
    } catch (error) {
      console.warn('Failed to schedule notification:', error);
      return '';
    }
  }

  // Safe notification cancellation
  static async cancelScheduledNotificationAsync(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.warn('Failed to cancel notification:', error);
    }
  }

  // Safe cancel all notifications
  static async cancelAllScheduledNotificationsAsync(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.warn('Failed to cancel all notifications:', error);
    }
  }

  // Safe get scheduled notifications
  static async getAllScheduledNotificationsAsync(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.warn('Failed to get scheduled notifications:', error);
      return [];
    }
  }

  // Safe listener setup
  static addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    try {
      return Notifications.addNotificationReceivedListener(listener);
    } catch (error) {
      console.warn('Failed to add notification received listener:', error);
      return { remove: () => {} } as Notifications.Subscription;
    }
  }

  // Safe response listener setup
  static addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    try {
      return Notifications.addNotificationResponseReceivedListener(listener);
    } catch (error) {
      console.warn('Failed to add notification response listener:', error);
      return { remove: () => {} } as Notifications.Subscription;
    }
  }

  // Calendar trigger helper - handles Expo Go limitations
  static createTrigger(config: {
    type: 'calendar' | 'timeInterval';
    hour?: number;
    minute?: number;
    seconds?: number;
    repeats?: boolean;
  }): Notifications.NotificationTriggerInput | null {
    try {
      if (config.type === 'calendar') {
        // Check for Expo Go Android limitation
        if (this.isExpoGo && Platform.OS === 'android') {
          // Fallback to time interval trigger
          const now = new Date();
          const target = new Date();
          target.setHours(config.hour || 9, config.minute || 0, 0, 0);
          
          // If target time is in the past today, schedule for tomorrow
          if (target.getTime() <= now.getTime()) {
            target.setDate(target.getDate() + 1);
          }
          
          const secondsUntil = Math.max(1, Math.round((target.getTime() - now.getTime()) / 1000));
          
          return {
            seconds: secondsUntil,
          } as Notifications.TimeIntervalTriggerInput;
        }
        
        // Use calendar trigger for development builds and production
        return {
          type: 'calendar',
          hour: config.hour,
          minute: config.minute,
          repeats: config.repeats || false,
        } as Notifications.CalendarTriggerInput;
      }
      
      if (config.type === 'timeInterval') {
        return {
          seconds: config.seconds || 1,
        } as Notifications.TimeIntervalTriggerInput;
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to create notification trigger:', error);
      return null;
    }
  }
}

export default SafeNotifications;
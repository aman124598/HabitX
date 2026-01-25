import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import SafeNotifications from '../lib/safeNotifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { enhancedNotificationService } from '../lib/enhancedNotificationService';
import { useRouter } from 'expo-router';

export function useNotifications() {
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Request permissions and initialize notifications
    const initializeNotifications = async () => {
      try {
        // Check if we're in Expo Go to avoid push notification errors
        const isExpoGo = Constants.appOwnership === 'expo';
        
        if (isExpoGo && Platform.OS === 'android') {
          console.warn('Running in Expo Go - some notification features may be limited');
        }

        // Initialize the enhanced notification service
        await enhancedNotificationService.initialize();
        
        const hasPermission = await enhancedNotificationService.requestPermissions();
        if (hasPermission) {
          // Schedule daily reminders (morning and evening)
          await enhancedNotificationService.scheduleDailyReminders();
          console.log('Enhanced notifications initialized successfully');
        } else {
          console.warn('Notification permissions denied by user');
        }
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
        // Don't crash the app if notifications fail
      }
    };

    initializeNotifications();

    // Listen for notifications while app is in foreground
    notificationListener.current = SafeNotifications.addNotificationReceivedListener(notification => {
      // Fix deprecation warning by accessing data properly
      const notificationData = notification.request.content.data;
      console.log('Notification received:', {
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notificationData
      });
    });

    // Listen for user interactions with notifications
    responseListener.current = SafeNotifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as any;
      console.log('Notification response received:', data);

      // Handle navigation based on notification type
      switch (data?.type) {
        case 'morning_reminder':
        case 'evening_reminder':
        case 'daily_reminder':
          // Navigate to home screen
          router.push('/(tabs)/home');
          break;
        case 'streak_motivation':
          // Navigate to home screen to see habits
          router.push('/(tabs)/home');
          break;
        case 'xp_reward':
        case 'level_up':
          // Navigate to stats/gamification screen
          router.push('/(tabs)/stats');
          break;
        default:
          // Handle notification response with enhanced service
          enhancedNotificationService.handleNotificationResponse(response);
          // Default navigation to home
          router.push('/(tabs)/home');
      }
    });

    // Cleanup listeners on unmount
    return () => {
      try {
        if (notificationListener.current && typeof notificationListener.current.remove === 'function') {
          notificationListener.current.remove();
        }
        if (responseListener.current && typeof responseListener.current.remove === 'function') {
          responseListener.current.remove();
        }
      } catch (e) {
        // ignore cleanup errors
      }
    };
  }, []);

  return {
    requestPermissions: enhancedNotificationService.requestPermissions.bind(enhancedNotificationService),
    scheduleDailyReminders: enhancedNotificationService.scheduleDailyReminders.bind(enhancedNotificationService),
    sendImmediateNotification: enhancedNotificationService.sendImmediateNotification.bind(enhancedNotificationService),
    cancelAllNotifications: enhancedNotificationService.cancelAllNotifications.bind(enhancedNotificationService),
    getSettings: enhancedNotificationService.getSettings.bind(enhancedNotificationService),
    saveSettings: enhancedNotificationService.saveSettings.bind(enhancedNotificationService),
    getDebugInfo: enhancedNotificationService.getDebugInfo.bind(enhancedNotificationService),
  };
}

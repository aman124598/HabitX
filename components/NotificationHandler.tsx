import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { friendNotificationService } from '../lib/friendNotificationService';
import { notificationService } from '../lib/notificationService';
import SafeNotifications from '../lib/safeNotifications';

interface NotificationHandlerProps {
  children: React.ReactNode;
}

export function NotificationHandler({ children }: NotificationHandlerProps) {
  const router = useRouter();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Initialize notification services
    friendNotificationService.initializeService();
    notificationService.initializeDailyNotifications();

    // Listen for notifications received while app is open
    notificationListener.current = SafeNotifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        // Handle any in-app notification display logic here
      }
    );

    // Listen for user tapping on notifications
    responseListener.current = SafeNotifications.addNotificationResponseReceivedListener(
      async (response) => {
        console.log('Notification response:', response);
        
        const data = response.notification.request.content.data;
        
        // Handle friend notifications
        if (data.category === 'friend') {
          const result = await friendNotificationService.handleNotificationResponse(response);
          if (result && typeof result === 'object' && result.route) {
            // Navigate to the appropriate screen
            router.push(result.route as any);
          }
          return;
        }

        // Handle other types of notifications
        switch (data.type) {
          case 'morning_reminder':
          case 'evening_reminder':
          case 'daily_reminder':
            router.push('/(tabs)/');
            break;
          case 'xp_reward':
          case 'level_up':
            router.push('/(tabs)/stats');
            break;
          case 'streak_milestone':
          case 'perfect_day':
            router.push('/(tabs)/');
            break;
          case 'leaderboard_change':
            router.push('/GlobalLeaderboard');
            break;
          default:
            // Default to home screen
            router.push('/(tabs)/');
            break;
        }
      }
    );

    return () => {
      // Clean up listeners
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [router]);

  return <>{children}</>;
}
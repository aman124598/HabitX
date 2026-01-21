import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SafeNotifications from './safeNotifications';

// Configure notifications safely
SafeNotifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

interface XPNotificationData {
  xpEarned: number;
  totalXP: number;
  level: number;
  achievement?: string;
  badge?: string;
}

class NotificationService {
  private NOTIF_KEY = 'settings:notificationsEnabled';

  private async shouldSend(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(this.NOTIF_KEY);
      return value === 'true';
    } catch (error) {
      console.error('Failed to read notification setting, defaulting to enabled:', error);
      return true;
    }
  }

  // Check if current time is appropriate for morning notifications (6 AM - 12 PM)
  private isMorningTime(): boolean {
    const now = new Date();
    const hour = now.getHours();
    return hour >= 6 && hour < 12;
  }

  // Check if current time is appropriate for evening notifications (6 PM - 11 PM)
  private isEveningTime(): boolean {
    const now = new Date();
    const hour = now.getHours();
    return hour >= 18 && hour < 23;
  }

  // Check if current time is appropriate for general reminders (8 AM - 10 PM)
  private isDaytimeForReminders(): boolean {
    const now = new Date();
    const hour = now.getHours();
    return hour >= 8 && hour < 22;
  }

  // Send XP reward notification
  async sendXPRewardNotification(data: XPNotificationData) {
    try {
      if (!(await this.shouldSend())) {
        return;
      }
      let title = '🎉 XP Earned!';
      let body = `+${data.xpEarned} XP! Total: ${data.totalXP} XP`;

      if (data.achievement) {
        title = '🏆 Achievement Unlocked!';
        body = `${data.achievement}\n+${data.xpEarned} XP earned!`;
      }

      if (data.badge) {
        title = '🎖️ New Badge Earned!';
        body = `${data.badge} badge unlocked!\n+${data.xpEarned} XP earned!`;
      }

      await SafeNotifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { type: 'xp_reward', ...data },
          sound: 'default',
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Failed to send XP notification:', error);
    }
  }

  // Send level up notification
  async sendLevelUpNotification(newLevel: number, totalXP: number) {
    try {
      if (!(await this.shouldSend())) {
        return;
      }
      await SafeNotifications.scheduleNotificationAsync({
        content: {
          title: '🚀 Level Up!',
          body: `Congratulations! You reached Level ${newLevel}!\nTotal XP: ${totalXP}`,
          data: { type: 'level_up', level: newLevel, totalXP },
          sound: 'default',
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to send level up notification:', error);
    }
  }

  // Send streak milestone notification
  async sendStreakMilestoneNotification(habitName: string, streakDays: number, xpBonus: number) {
    try {
      if (!(await this.shouldSend())) {
        return;
      }
      let title = '🔥 Streak Milestone!';
      let body = `${habitName}: ${streakDays} day streak!\n+${xpBonus} bonus XP!`;

      if (streakDays === 7) {
        title = '🔥 Week Warrior!';
      } else if (streakDays === 30) {
        title = '🏆 Month Master!';
      } else if (streakDays === 100) {
        title = '🌟 Century Champion!';
      }

      await SafeNotifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { 
            type: 'streak_milestone', 
            habitName, 
            streakDays, 
            xpBonus 
          },
          sound: 'default',
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to send streak notification:', error);
    }
  }

  // Send perfect day notification
  async sendPerfectDayNotification(totalHabits: number) {
    try {
      if (!(await this.shouldSend())) {
        return;
      }
      await SafeNotifications.scheduleNotificationAsync({
        content: {
          title: '🎯 Perfect Day!',
          body: `All ${totalHabits} habits completed! Great job keeping your streak!`,
          data: { 
            type: 'perfect_day', 
            totalHabits
          },
          sound: 'default',
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to send perfect day notification:', error);
    }
  }

  // Send daily reminder with motivation (only during appropriate hours)
  async sendDailyReminder() {
    try {
      if (!(await this.shouldSend())) {
        return;
      }

      // Only send daily reminders during daytime hours
      if (!this.isDaytimeForReminders()) {
        console.log('Skipping daily reminder - not appropriate time');
        return;
      }

      await SafeNotifications.scheduleNotificationAsync({
        content: {
          title: '🎯 Habit Time!',
          body: 'Stay consistent! Complete your habits today!',
          data: { type: 'daily_reminder' },
          sound: 'default',
        },
        trigger: null, // Show immediately
      });

      console.log('Daily reminder sent');
    } catch (error) {
      console.error('Failed to send daily reminder:', error);
    }
  }

  // Send daily reminder with motivation
  async scheduleDailyReminder(time: string = '09:00') {
    try {
      // Cancel existing reminders
      await SafeNotifications.cancelAllScheduledNotificationsAsync();

      if (!(await this.shouldSend())) {
        return;
      }

      const [hours, minutes] = time.split(':').map(Number);

      // If running in Expo Go on Android, calendar triggers may not be supported.
      const runningInExpoGo = Platform.OS === 'android' && Constants.appOwnership === 'expo';
      if (runningInExpoGo) {
        // Fallback: schedule a single notification at the next occurrence (best-effort).
        const secondsUntil = this.secondsUntilTime(hours, minutes);
        console.warn('Calendar triggers unsupported in Expo Go on Android — scheduling a one-off reminder. Use a development build for recurring reminders.');
        await SafeNotifications.scheduleNotificationAsync({
          content: {
            title: '🎯 Habit Time!',
            body: 'Stay consistent! Complete your habits today!',
            data: { type: 'daily_reminder' },
            sound: 'default',
          },
          trigger: {
            seconds: Math.max(1, secondsUntil),
          } as Notifications.TimeIntervalTriggerInput,
        });
      } else {
        await SafeNotifications.scheduleNotificationAsync({
          content: {
            title: '🎯 Habit Time!',
            body: 'Stay consistent! Complete your habits today!',
            data: { type: 'daily_reminder' },
            sound: 'default',
          },
          trigger: {
            type: 'calendar',
            hour: hours,
            minute: minutes,
            repeats: true,
          } as Notifications.CalendarTriggerInput,
        });
      }
    } catch (error) {
      console.error('Failed to schedule daily reminder:', error);
    }
  }

  // Send morning habit reminder (only if currently morning time)
  async sendMorningHabitReminder() {
    try {
      if (!(await this.shouldSend())) {
        return;
      }

      // Only send morning notifications during morning hours
      if (!this.isMorningTime()) {
        console.log('Skipping morning notification - not morning time');
        return;
      }

      const motivationalMessages = [
        'Good morning! 🌅 Ready to build a new habit today?',
        'Start your day right! 💪 Create a habit that matters.',
        'New day, new habit! 🌟 What will you commit to today?',
        'Rise and shine! ☀️ Set a habit and watch yourself grow.',
        'Morning motivation! 🚀 What positive habit will you start?',
        'A new habit a day keeps mediocrity away! 🎯',
        'Transform your morning! ✨ Add a habit to your routine.',
        'Success starts with habits! 🏆 Create one now.',
      ];

      const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

      await SafeNotifications.scheduleNotificationAsync({
        content: {
          title: '🌅 Good Morning!',
          body: randomMessage,
          data: { type: 'morning_habit_reminder' },
          sound: 'default',
          badge: 1,
        },
        trigger: null, // Show immediately
      });

      console.log('Morning habit reminder sent');
    } catch (error) {
      console.error('Failed to send morning habit reminder:', error);
    }
  }

  // Schedule morning notification to create new habits (7-8 AM)
  async scheduleMorningHabitReminder() {
    try {
      if (!(await this.shouldSend())) {
        return;
      }

      // Get random time between 7:00 and 8:00 AM to feel more natural
      const randomMinutes = Math.floor(Math.random() * 60); // 0-59 minutes
      const hour = 7;

      const motivationalMessages = [
        'Good morning! 🌅 Ready to build a new habit today?',
        'Start your day right! 💪 Create a habit that matters.',
        'New day, new habit! 🌟 What will you commit to today?',
        'Rise and shine! ☀️ Set a habit and watch yourself grow.',
        'Morning motivation! 🚀 What positive habit will you start?',
        'A new habit a day keeps mediocrity away! 🎯',
        'Transform your morning! ✨ Add a habit to your routine.',
        'Success starts with habits! 🏆 Create one now.',
      ];

      const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

      // Cancel any existing morning reminders first
      const scheduledNotifications = await SafeNotifications.getAllScheduledNotificationsAsync();
      for (const notification of scheduledNotifications) {
        if (notification.content.data?.type === 'morning_habit_reminder') {
          await SafeNotifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
      const runningInExpoGo = Platform.OS === 'android' && Constants.appOwnership === 'expo';
      if (runningInExpoGo) {
        const secondsUntil = this.secondsUntilTime(hour, randomMinutes);
        console.warn('Calendar triggers unsupported in Expo Go on Android — scheduling a one-off morning reminder. Use a development build for recurring reminders.');
        await SafeNotifications.scheduleNotificationAsync({
          content: {
            title: '🌅 Good Morning!',
            body: randomMessage,
            data: { type: 'morning_habit_reminder' },
            sound: 'default',
            badge: 1,
          },
          trigger: {
            seconds: Math.max(1, secondsUntil),
          } as Notifications.TimeIntervalTriggerInput,
        });
      } else {
        await SafeNotifications.scheduleNotificationAsync({
          content: {
            title: '🌅 Good Morning!',
            body: randomMessage,
            data: { type: 'morning_habit_reminder' },
            sound: 'default',
            badge: 1,
          },
          trigger: {
            type: 'calendar',
            hour: hour,
            minute: randomMinutes,
            repeats: true,
          } as Notifications.CalendarTriggerInput,
        });
      }

      console.log(`Morning habit reminder scheduled for ${hour}:${randomMinutes.toString().padStart(2, '0')} daily`);
    } catch (error) {
      console.error('Failed to schedule morning habit reminder:', error);
    }
  }

  // Send evening completion reminder (only if currently evening time)
  async sendEveningCompletionReminder() {
    try {
      if (!(await this.shouldSend())) {
        return;
      }

      // Only send evening notifications during evening hours
      if (!this.isEveningTime()) {
        console.log('Skipping evening notification - not evening time');
        return;
      }

      const eveningMessages = [
        'Evening check-in! 🌙 Complete your habits before bed.',
        'Don\'t forget! 📝 Mark your habits as complete.',
        'End your day strong! 💪 Finish your habit checklist.',
        'Last chance! ⏰ Complete today\'s habits now.',
        'Almost done! 🎯 Check off those remaining habits.',
        'Keep the streak alive! 🔥 Complete your habits tonight.',
      ];

      const randomMessage = eveningMessages[Math.floor(Math.random() * eveningMessages.length)];

      await SafeNotifications.scheduleNotificationAsync({
        content: {
          title: '🌙 Evening Reminder',
          body: randomMessage,
          data: { type: 'evening_completion_reminder' },
          sound: 'default',
        },
        trigger: null, // Show immediately
      });

      console.log('Evening completion reminder sent');
    } catch (error) {
      console.error('Failed to send evening completion reminder:', error);
    }
  }

  // Schedule evening reminder to complete habits (7-8 PM)
  async scheduleEveningCompletionReminder() {
    try {
      if (!(await this.shouldSend())) {
        return;
      }

      // Get random time between 7:00 and 8:00 PM
      const randomMinutes = Math.floor(Math.random() * 60);
      const hour = 19; // 7 PM in 24-hour format

      const eveningMessages = [
        'Evening check-in! 🌙 Complete your habits before bed.',
        'Don\'t forget! 📝 Mark your habits as complete.',
        'End your day strong! 💪 Finish your habit checklist.',
        'Last chance! ⏰ Complete today\'s habits now.',
        'Almost done! 🎯 Check off those remaining habits.',
        'Keep the streak alive! 🔥 Complete your habits tonight.',
      ];

      const randomMessage = eveningMessages[Math.floor(Math.random() * eveningMessages.length)];

      // Cancel any existing evening reminders first
      const scheduledNotifications = await SafeNotifications.getAllScheduledNotificationsAsync();
      for (const notification of scheduledNotifications) {
        if (notification.content.data?.type === 'evening_completion_reminder') {
          await SafeNotifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
      const runningInExpoGo = Platform.OS === 'android' && Constants.appOwnership === 'expo';
      if (runningInExpoGo) {
        const secondsUntil = this.secondsUntilTime(hour, randomMinutes);
        console.warn('Calendar triggers unsupported in Expo Go on Android — scheduling a one-off evening reminder. Use a development build for recurring reminders.');
        await SafeNotifications.scheduleNotificationAsync({
          content: {
            title: '🌙 Evening Reminder',
            body: randomMessage,
            data: { type: 'evening_completion_reminder' },
            sound: 'default',
          },
          trigger: {
            seconds: Math.max(1, secondsUntil),
          } as Notifications.TimeIntervalTriggerInput,
        });
      } else {
        await SafeNotifications.scheduleNotificationAsync({
          content: {
            title: '🌙 Evening Reminder',
            body: randomMessage,
            data: { type: 'evening_completion_reminder' },
            sound: 'default',
          },
          trigger: {
            type: 'calendar',
            hour: hour,
            minute: randomMinutes,
            repeats: true,
          } as Notifications.CalendarTriggerInput,
        });
      }

      console.log(`Evening completion reminder scheduled for ${hour}:${randomMinutes.toString().padStart(2, '0')} daily`);
    } catch (error) {
      console.error('Failed to schedule evening completion reminder:', error);
    }
  }

  // Helper: seconds until next occurrence of given hour:minute (in seconds)
  private secondsUntilTime(hour: number, minute: number) {
    const now = new Date();
    const target = new Date(now);
    target.setHours(hour, minute, 0, 0);
    if (target.getTime() <= now.getTime()) {
      // move to next day
      target.setDate(target.getDate() + 1);
    }
    const diffMs = target.getTime() - now.getTime();
    return Math.max(1, Math.round(diffMs / 1000));
  }

  // Initialize all daily notifications
  async initializeDailyNotifications() {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('Notification permissions not granted');
        return;
      }

      // Schedule both morning and evening reminders
      await this.scheduleMorningHabitReminder();
      await this.scheduleEveningCompletionReminder();

      console.log('Daily notifications initialized successfully');
    } catch (error) {
      console.error('Failed to initialize daily notifications:', error);
    }
  }

  // Cancel all scheduled notifications
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All scheduled notifications cancelled');
    } catch (error) {
      console.error('Failed to cancel notifications:', error);
    }
  }

  // Get list of all scheduled notifications (for debugging)
  async getScheduledNotifications() {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      return notifications;
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }

  // Send motivational messages based on progress
  async sendMotivationalMessage(type: 'comeback' | 'consistency' | 'achievement') {
    try {
      if (!(await this.shouldSend())) {
        return;
      }
      let title = '';
      let body = '';

      switch (type) {
        case 'comeback':
          title = '💪 Welcome Back!';
          body = 'Ready to get back on track? Your habits are waiting!';
          break;
        case 'consistency':
          title = '🔥 On Fire!';
          body = 'Your consistency is amazing! Keep up the great work!';
          break;
        case 'achievement':
          title = '🏆 Amazing Progress!';
          body = 'You\'re crushing your goals! Check out your achievements!';
          break;
      }

      await SafeNotifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { type: 'motivational', category: type },
          sound: 'default',
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to send motivational message:', error);
    }
  }

  // Handle notification responses
  handleNotificationResponse(response: Notifications.NotificationResponse) {
    const data = response.notification.request.content.data;
    
    switch (data.type) {
      case 'xp_reward':
        // Could navigate to gamification dashboard
        break;
      case 'level_up':
        // Could show level up animation
        break;
      case 'streak_milestone':
        // Could navigate to habit details
        break;
      case 'perfect_day':
        // Could show celebration animation
        break;
      case 'daily_reminder':
        // Could navigate to home screen
        break;
      case 'morning_habit_reminder':
        // Navigate to home screen to create new habit
        break;
      case 'evening_completion_reminder':
        // Navigate to home screen to complete habits
        break;
      default:
        // Unknown notification type
    }
  }

  // Request notification permissions
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();

import * as Notifications from 'expo-notifications';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import SafeNotifications from './safeNotifications';

// Background task names
const MORNING_REMINDER_TASK = 'morning-reminder-task';
const EVENING_REMINDER_TASK = 'evening-reminder-task';
const STREAK_CHECK_TASK = 'streak-check-task';

// Storage keys
const SETTINGS_KEY = 'notification_settings';
const LAST_STREAK_CHECK_KEY = 'last_streak_check';

interface NotificationSettings {
  enabled: boolean;
  morningReminders: boolean;
  eveningReminders: boolean;
  streakReminders: boolean;
  motivationalMessages: boolean;
  morningTime: string; // "07:30"
  eveningTime: string; // "19:30"
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string; // "07:00"
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  morningReminders: true,
  eveningReminders: true,
  streakReminders: true,
  motivationalMessages: true,
  morningTime: '07:30',
  eveningTime: '19:30',
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
};

class EnhancedNotificationService {
  private settings: NotificationSettings = DEFAULT_SETTINGS;
  private isInitialized = false;

  constructor() {
    this.initializeBackgroundTasks();
  }

  // Initialize background tasks
  private initializeBackgroundTasks() {
    // Morning reminder task
    TaskManager.defineTask(MORNING_REMINDER_TASK, async () => {
      try {
        await this.loadSettings();
        if (this.settings.enabled && this.settings.morningReminders) {
          await this.sendMorningReminder();
        }
        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch (error) {
        console.error('Morning reminder task error:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });

    // Evening reminder task
    TaskManager.defineTask(EVENING_REMINDER_TASK, async () => {
      try {
        await this.loadSettings();
        if (this.settings.enabled && this.settings.eveningReminders) {
          await this.sendEveningReminder();
        }
        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch (error) {
        console.error('Evening reminder task error:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });

    // Streak check task
    TaskManager.defineTask(STREAK_CHECK_TASK, async () => {
      try {
        await this.loadSettings();
        if (this.settings.enabled && this.settings.streakReminders) {
          await this.checkStreakStatus();
        }
        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch (error) {
        console.error('Streak check task error:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });
  }

  // Initialize the service
  async initialize() {
    if (this.isInitialized) return;

    try {
      await this.loadSettings();
      await this.setupNotificationHandler();
      await this.setupAndroidChannel();
      await this.requestPermissions();
      await this.registerBackgroundTasks();
      this.isInitialized = true;
      console.log('Enhanced notification service initialized');
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }

  // Create Android notification channel (required for Android 8+)
  private async setupAndroidChannel() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Habit Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#DC2626',
        sound: 'default',
      });
      await Notifications.setNotificationChannelAsync('streaks', {
        name: 'Streak Alerts',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
      });
    }
  }

  // Setup notification handler
  private async setupNotificationHandler() {
    SafeNotifications.setNotificationHandler({
      handleNotification: async () => {
        const isQuietHours = this.isQuietHours();
        return {
          shouldShowAlert: !isQuietHours,
          shouldShowBanner: !isQuietHours,
          shouldShowList: true,
          shouldPlaySound: !isQuietHours,
          shouldSetBadge: false,
        };
      },
    });
  }

  // Load settings from storage
  private async loadSettings() {
    try {
      const settingsJson = await AsyncStorage.getItem(SETTINGS_KEY);
      if (settingsJson) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(settingsJson) };
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      this.settings = DEFAULT_SETTINGS;
    }
  }

  // Save settings to storage
  async saveSettings(settings: Partial<NotificationSettings>) {
    try {
      this.settings = { ...this.settings, ...settings };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));

      // Re-register background tasks if settings changed
      if (settings.morningTime || settings.eveningTime || settings.enabled) {
        await this.registerBackgroundTasks();
      }
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  }

  // Get current settings
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  // Check if it's quiet hours
  private isQuietHours(): boolean {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [quietStart] = this.settings.quietHoursStart.split(':').map(Number);
    const [quietEnd] = this.settings.quietHoursEnd.split(':').map(Number);

    const quietStartMinutes = quietStart * 60;
    const quietEndMinutes = quietEnd * 60;

    // Handle overnight quiet hours (e.g., 22:00 to 07:00)
    if (quietStartMinutes > quietEndMinutes) {
      return currentTime >= quietStartMinutes || currentTime < quietEndMinutes;
    }

    return currentTime >= quietStartMinutes && currentTime < quietEndMinutes;
  }

  // Register background tasks
  private async registerBackgroundTasks() {
    try {
      if (!this.settings.enabled) {
        await this.unregisterBackgroundTasks();
        return;
      }

      await BackgroundFetch.registerTaskAsync(STREAK_CHECK_TASK, {
        minimumInterval: 30 * 60, // 30 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });

      console.log('Background tasks registered successfully');
    } catch (error) {
      console.error('Failed to register background tasks:', error);
    }
  }

  // Unregister all background tasks
  private async unregisterBackgroundTasks() {
    try {
      const registeredTasks = await TaskManager.getRegisteredTasksAsync();

      for (const task of registeredTasks) {
        if ([MORNING_REMINDER_TASK, EVENING_REMINDER_TASK, STREAK_CHECK_TASK].includes(task.taskName)) {
          await BackgroundFetch.unregisterTaskAsync(task.taskName);
        }
      }

      console.log('Background tasks unregistered');
    } catch (error) {
      console.error('Failed to unregister background tasks:', error);
    }
  }

  // Send morning reminder
  private async sendMorningReminder() {
    if (this.isQuietHours()) return;

    const morningMessages = [
      'Good morning! 🌅 Start your day with purpose - check your habits!',
      'Rise and shine! ☀️ Your habits are waiting to be conquered today.',
      'New day, new opportunities! 💪 Let\'s build those habits together.',
      'Morning motivation! 🚀 Small steps lead to big changes.',
      'Good morning! 🌟 Your future self will thank you for today\'s habits.',
      'Start strong! 🎯 Every habit completed is a victory.',
      'Morning reminder! ✨ Consistency is the key to success.',
    ];

    const message = morningMessages[Math.floor(Math.random() * morningMessages.length)];

    await SafeNotifications.scheduleNotificationAsync({
      content: {
        title: '🌅 Good Morning!',
        body: message,
        data: { type: 'morning_reminder' },
        sound: 'default',
        ...(Platform.OS === 'android' ? { channelId: 'default' } : {}),
      },
      trigger: null,
    });

    console.log('Morning reminder sent');
  }

  // Send evening reminder
  private async sendEveningReminder() {
    if (this.isQuietHours()) return;

    const eveningMessages = [
      'Evening check! 🌙 Don\'t forget to complete your habits before bed.',
      'End strong! 💪 Mark off those remaining habits for the day.',
      'Almost there! 🎯 Complete your habits and keep your streak alive.',
      'Evening reminder! 🔥 Your dedication today builds tomorrow\'s success.',
      'Finish the day right! ✅ Check off your completed habits.',
      'Last call! ⏰ Complete your habits and earn that XP.',
      'Evening motivation! 🌟 Every habit matters, even the small ones.',
    ];

    const message = eveningMessages[Math.floor(Math.random() * eveningMessages.length)];

    await SafeNotifications.scheduleNotificationAsync({
      content: {
        title: '🌙 Evening Check-in',
        body: message,
        data: { type: 'evening_reminder' },
        sound: 'default',
        ...(Platform.OS === 'android' ? { channelId: 'default' } : {}),
      },
      trigger: null,
    });

    console.log('Evening reminder sent');
  }

  // Check streak status
  private async checkStreakStatus() {
    try {
      const lastCheckStr = await AsyncStorage.getItem(LAST_STREAK_CHECK_KEY);
      const now = new Date();

      // Only check once per day
      if (lastCheckStr) {
        const lastCheck = new Date(lastCheckStr);
        if (now.toDateString() === lastCheck.toDateString()) {
          return;
        }
      }

      // Send motivational streak reminders
      await this.sendStreakMotivation();

      await AsyncStorage.setItem(LAST_STREAK_CHECK_KEY, now.toISOString());
    } catch (error) {
      console.error('Failed to check streak status:', error);
    }
  }

  // Send streak motivation
  private async sendStreakMotivation() {
    if (this.isQuietHours()) return;

    const streakMessages = [
      '🔥 Keep your streak alive! Don\'t break the chain.',
      '💪 Consistency beats perfection. Keep going!',
      '🎯 Your streak is your superpower. Maintain it!',
      '⚡ Every day counts. Keep building those habits!',
      '🏆 Champions maintain their streaks. You\'ve got this!',
      '🌟 Your dedication is showing. Don\'t stop now!',
      '🚀 Streak power activated! Keep the momentum going.',
    ];

    const message = streakMessages[Math.floor(Math.random() * streakMessages.length)];

    await SafeNotifications.scheduleNotificationAsync({
      content: {
        title: '🔥 Streak Reminder',
        body: message,
        data: { type: 'streak_motivation' },
        sound: 'default',
        ...(Platform.OS === 'android' ? { channelId: 'streaks' } : {}),
      },
      trigger: null,
    });

    console.log('Streak motivation sent');
  }

  // Schedule daily reminders
  async scheduleDailyReminders() {
    try {
      if (!this.settings.enabled) return;

      // Cancel existing scheduled notifications
      await SafeNotifications.cancelAllScheduledNotificationsAsync();

      // Schedule morning reminder
      if (this.settings.morningReminders) {
        const [morningHour, morningMinute] = this.settings.morningTime.split(':').map(Number);
        const morningTrigger = SafeNotifications.createTrigger({
          type: 'calendar',
          hour: morningHour,
          minute: morningMinute,
          repeats: true,
        });
        if (morningTrigger) {
          await SafeNotifications.scheduleNotificationAsync({
            content: {
              title: '🌅 Good Morning!',
              body: 'Start your day with purpose - check your habits!',
              data: { type: 'morning_reminder' },
              sound: 'default',
              ...(Platform.OS === 'android' ? { channelId: 'default' } : {}),
            },
            trigger: morningTrigger,
          });
        }
      }

      // Schedule evening reminder
      if (this.settings.eveningReminders) {
        const [eveningHour, eveningMinute] = this.settings.eveningTime.split(':').map(Number);
        const eveningTrigger = SafeNotifications.createTrigger({
          type: 'calendar',
          hour: eveningHour,
          minute: eveningMinute,
          repeats: true,
        });
        if (eveningTrigger) {
          await SafeNotifications.scheduleNotificationAsync({
            content: {
              title: '🌙 Evening Check-in',
              body: 'Don\'t forget to complete your habits before bed.',
              data: { type: 'evening_reminder' },
              sound: 'default',
              ...(Platform.OS === 'android' ? { channelId: 'default' } : {}),
            },
            trigger: eveningTrigger,
          });
        }
      }

      // Schedule a midday streak reminder
      if (this.settings.streakReminders) {
        const streakTrigger = SafeNotifications.createTrigger({
          type: 'calendar',
          hour: 14,
          minute: 0,
          repeats: true,
        });
        if (streakTrigger) {
          await SafeNotifications.scheduleNotificationAsync({
            content: {
              title: '🔥 Streak Check',
              body: 'Don\'t break your streak! Complete your habits today.',
              data: { type: 'streak_motivation' },
              sound: 'default',
              ...(Platform.OS === 'android' ? { channelId: 'streaks' } : {}),
            },
            trigger: streakTrigger,
          });
        }
      }

      console.log('Daily reminders scheduled successfully');
    } catch (error) {
      console.error('Failed to schedule daily reminders:', error);
    }
  }

  // Send immediate notification
  async sendImmediateNotification(title: string, body: string, data: any = {}) {
    if (!this.settings.enabled) return;
    if (this.isQuietHours()) return;

    await SafeNotifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: null,
    });
  }

  // Request permissions
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // Request background app refresh permissions on iOS
      if (Platform.OS === 'ios') {
        const backgroundStatus = await BackgroundFetch.getStatusAsync();
        if (backgroundStatus === BackgroundFetch.BackgroundFetchStatus.Denied) {
          console.warn('Background fetch is disabled');
        }
      }

      return finalStatus === 'granted';
    } catch (error) {
      console.error('Failed to request permissions:', error);
      return false;
    }
  }

  // Handle notification tap
  handleNotificationResponse(response: Notifications.NotificationResponse) {
    const data = response.notification.request.content.data;

    // Navigation logic based on notification type
    switch (data.type) {
      case 'morning_reminder':
      case 'evening_reminder':
        // Navigate to home screen
        break;
      case 'streak_motivation':
        // Navigate to habit details or stats
        break;
      default:
        break;
    }
  }

  // Cancel all notifications
  async cancelAllNotifications() {
    try {
      await SafeNotifications.cancelAllScheduledNotificationsAsync();
      await this.unregisterBackgroundTasks();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Failed to cancel notifications:', error);
    }
  }

  // Get debug info
  async getDebugInfo() {
    try {
      const scheduledNotifications = await SafeNotifications.getAllScheduledNotificationsAsync();
      const registeredTasks = await TaskManager.getRegisteredTasksAsync();

      return {
        settings: this.settings,
        scheduledNotifications: scheduledNotifications.length,
        registeredTasks: registeredTasks.map(task => task.taskName),
        isQuietHours: this.isQuietHours(),
        isInitialized: this.isInitialized,
      };
    } catch (error) {
      console.error('Failed to get debug info:', error);
      return null;
    }
  }
}

export const enhancedNotificationService = new EnhancedNotificationService();
export type { NotificationSettings };
export { DEFAULT_SETTINGS };
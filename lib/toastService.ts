import { useToast } from './toastContext';

/**
 * Toast Service - A centralized service for showing toasts throughout the app
 * This provides a singleton-like interface for showing toasts from anywhere
 */

let toastInstance: ReturnType<typeof useToast> | null = null;

export const setToastInstance = (instance: ReturnType<typeof useToast>) => {
  toastInstance = instance;
};

export const toastService = {
  // Basic toast methods
  show: (title: string, message?: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    if (toastInstance) {
      toastInstance.showToast({ type, title, message });
    } else {
      console.warn('Toast instance not available. Make sure ToastProvider is set up.');
    }
  },

  success: (title: string, message?: string) => {
    if (toastInstance) {
      toastInstance.success(title, message);
    }
  },

  error: (title: string, message?: string) => {
    if (toastInstance) {
      toastInstance.error(title, message);
    }
  },

  warning: (title: string, message?: string) => {
    if (toastInstance) {
      toastInstance.warning(title, message);
    }
  },

  info: (title: string, message?: string) => {
    if (toastInstance) {
      toastInstance.info(title, message);
    }
  },

  // Gamification-specific toasts
  xpReward: (xp: number, title?: string, subtitle?: string) => {
    if (toastInstance) {
      toastInstance.xpReward(xp, title, subtitle);
    }
  },

  achievement: (title: string, message?: string, xp?: number) => {
    if (toastInstance) {
      toastInstance.achievement(title, message, xp);
    }
  },

  // Habit-specific toasts
  habitCompleted: (habitName: string) => {
    if (toastInstance) {
      toastInstance.success('Habit Completed!', `Great job completing "${habitName}"!`);
    }
  },

  habitCreated: (habitName: string) => {
    if (toastInstance) {
      toastInstance.success('Habit Created!', `"${habitName}" added to your routine.`);
    }
  },

  habitDeleted: (habitName: string) => {
    if (toastInstance) {
      toastInstance.warning('Habit Deleted', `"${habitName}" removed from your habits.`);
    }
  },

  // Streak-specific toasts
  streakMilestone: (habitName: string, streakDays: number) => {
    if (toastInstance) {
      let title = '🔥 Streak Milestone!';
      if (streakDays === 7) title = '🔥 Week Warrior!';
      else if (streakDays === 30) title = '👑 Month Master!';
      else if (streakDays === 100) title = '🏆 Century Champion!';
      
      const bonusXP = streakDays === 7 ? 50 : streakDays === 30 ? 200 : streakDays === 100 ? 500 : 10;
      toastInstance.achievement(title, `${streakDays} day streak for "${habitName}"!`, bonusXP);
    }
  },

  perfectDay: (totalHabits: number) => {
    if (toastInstance) {
      toastInstance.achievement('🎯 Perfect Day!', `All ${totalHabits} habits completed today!`, 25);
    }
  },

  // Level up
  levelUp: (newLevel: number) => {
    if (toastInstance) {
      toastInstance.achievement('🚀 Level Up!', `Congratulations! You reached Level ${newLevel}!`);
    }
  },

  // Friend-specific toasts
  friendRequestSent: (username: string) => {
    if (toastInstance) {
      toastInstance.info('👋 Friend Request Sent', `Request sent to ${username}!`);
    }
  },

  friendRequestReceived: (username: string, count: number = 1) => {
    if (toastInstance) {
      const title = count === 1 ? '👋 New Friend Request!' : `👋 ${count} New Friend Requests!`;
      const message = count === 1 
        ? `${username} wants to be your friend!` 
        : `You have ${count} new friend requests waiting.`;
      toastInstance.info(title, message);
    }
  },

  friendRequestAccepted: (username: string) => {
    if (toastInstance) {
      toastInstance.success('🎉 Friend Request Accepted!', `You are now friends with ${username}!`);
    }
  },

  friendRequestDeclined: (username: string) => {
    if (toastInstance) {
      toastInstance.warning('Friend Request Declined', `Declined request from ${username}.`);
    }
  },

  friendRequestAlreadySent: (username: string) => {
    if (toastInstance) {
      toastInstance.warning('Already Sent', `You have already sent a friend request to ${username}.`);
    }
  },

  friendRequestAlreadyFriends: (username: string) => {
    if (toastInstance) {
      toastInstance.info('Already Friends', `You are already friends with ${username}!`);
    }
  },

  friendRemoved: (username: string) => {
    if (toastInstance) {
      toastInstance.warning('Friend Removed', `${username} has been removed from your friends.`);
    }
  },

  friendAdded: (username: string) => {
    if (toastInstance) {
      toastInstance.success('🤝 New Friend Added!', `${username} is now your friend!`);
    }
  },

  friendOnline: (username: string) => {
    if (toastInstance) {
      toastInstance.info('🟢 Friend Online', `${username} is now online!`);
    }
  },

  friendAchievement: (username: string, achievement: string) => {
    if (toastInstance) {
      toastInstance.info('🏆 Friend Achievement', `${username} unlocked: ${achievement}!`);
    }
  },

  friendLevelUp: (username: string, level: number) => {
    if (toastInstance) {
      toastInstance.info('🚀 Friend Level Up', `${username} reached Level ${level}!`);
    }
  },

  friendStreakMilestone: (username: string, habitName: string, days: number) => {
    if (toastInstance) {
      let milestone = '';
      if (days === 7) milestone = '🔥 Week';
      else if (days === 30) milestone = '👑 Month';
      else if (days === 100) milestone = '🏆 Century';
      else milestone = `${days} Day`;
      
      toastInstance.info(`${milestone} Streak!`, `${username} hit ${days} days with "${habitName}"!`);
    }
  },

  friendSystemError: (message?: string) => {
    if (toastInstance) {
      let errorMessage = message || 'There was a problem with the friend system. Please try again.';
      
      // Special handling for known backend issues
      if (message?.includes('toISOString') || message?.includes('formatting error')) {
        errorMessage = 'Server data issue detected. Our team has been notified.';
      } else if (message?.includes('500')) {
        errorMessage = 'Server is temporarily unavailable. Trying to reconnect...';
      }
      
      toastInstance.error('🔧 Friend System Issue', errorMessage);
    }
  },

  friendSystemRecovered: () => {
    if (toastInstance) {
      toastInstance.success('✅ System Restored', 'Friend system is back online!');
    }
  },

  // New method for backend data corruption issues
  friendDataCorruption: () => {
    if (toastInstance) {
      toastInstance.error('🔧 Data Issue Detected', 'Friend request data needs repair. Please contact support if this persists.');
    }
  },

  // Circuit breaker message
  friendServiceTemporarilyDisabled: () => {
    if (toastInstance) {
      toastInstance.warning('🔄 Service Temporarily Disabled', 'Friend requests are disabled for 1 minute due to server issues. Please try again later.');
    }
  },

  searchNoResults: (query: string) => {
    if (toastInstance) {
      toastInstance.info('No Users Found', `No results found for "${query}". Try a different search term.`);
    }
  },

  profilePrivate: (username: string) => {
    if (toastInstance) {
      toastInstance.warning('Profile Private', `${username}'s profile is private. Send a friend request to connect!`);
    }
  },

  // Clear all toasts
  clear: () => {
    if (toastInstance) {
      toastInstance.clearAllToasts();
    }
  },
};
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STREAK_CELEBRATION_KEY = '@streak_celebration_shown';

interface StreakMilestone {
  shouldShow: boolean;
  streakCount: number;
  isNewMilestone: boolean;
}

/**
 * Hook to determine if streak celebration should be shown
 * Shows on milestone streaks: 7, 14, 30, 50, 100, 365, etc.
 */
export function useStreakCelebration(totalStreakDays: number): StreakMilestone {
  const [lastShownStreak, setLastShownStreak] = useState<number>(0);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    checkStreakMilestone();
  }, [totalStreakDays]);

  const checkStreakMilestone = async () => {
    try {
      const stored = await AsyncStorage.getItem(STREAK_CELEBRATION_KEY);
      const lastShown = stored ? parseInt(stored, 10) : 0;
      setLastShownStreak(lastShown);

      // Define milestones
      const milestones = [7, 14, 21, 30, 50, 75, 100, 150, 200, 250, 300, 365, 500, 1000];
      
      // Check if current streak is a milestone and hasn't been celebrated yet
      const isNewMilestone = milestones.includes(totalStreakDays) && totalStreakDays > lastShown;
      
      if (isNewMilestone) {
        setShouldShow(true);
        await AsyncStorage.setItem(STREAK_CELEBRATION_KEY, totalStreakDays.toString());
      } else {
        setShouldShow(false);
      }
    } catch (error) {
      console.error('Error checking streak milestone:', error);
      setShouldShow(false);
    }
  };

  const markAsShown = async () => {
    try {
      await AsyncStorage.setItem(STREAK_CELEBRATION_KEY, totalStreakDays.toString());
      setShouldShow(false);
    } catch (error) {
      console.error('Error marking streak as shown:', error);
    }
  };

  return {
    shouldShow,
    streakCount: totalStreakDays,
    isNewMilestone: totalStreakDays > lastShownStreak,
  };
}

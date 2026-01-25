import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import habitsService, { Habit, CreateHabitData } from '../lib/habitsApi';
import { notificationService } from '../lib/notificationService';
import { useAuth } from '../lib/authContext';
import { getToday } from '../lib/dateHelper';
import { useToast } from '../lib/toastContext';

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setHabits([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const list = await habitsService.getHabits();
      setHabits(list);
    } catch (error) {
      console.error('Failed to refresh habits:', error);
      toast.error('Error', 'Failed to load habits');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addHabit = useCallback(async (habitData: CreateHabitData) => {
    try {
      // Defensive validation before sending to API
      if (!habitData.startDate) {
        throw new Error('Validation: startDate is required');
      }
      if (!habitData.category) {
        throw new Error('Validation: category is required');
      }

      const habit = await habitsService.createHabit(habitData);
      setHabits(prev => {
        const newHabits = [...prev, habit];
        
        if (prev.length === 0) {
          toast.success('🎉 Welcome!', 'Your first habit has been created!');
        }
        
        return newHabits;
      });
      
      return habit;
    } catch (error: any) {
      console.error('Failed to add habit:', error);
      toast.error('Error', error.message || 'Failed to create habit');
      throw error;
    }
  }, []);

  // Track habits being toggled to prevent race conditions
  const [togglingHabits, setTogglingHabits] = useState<Set<string>>(new Set());

  const toggleHabit = useCallback(async (id: string) => {
    // Prevent multiple simultaneous toggles for the same habit
    if (togglingHabits.has(id)) {
      console.log('Toggle already in progress for habit:', id);
      return;
    }

    try {
      const oldHabit = habits.find(h => h.id === id);
      if (!oldHabit) {
        console.error('Habit not found in state:', id);
        toast.error('Error', 'Habit not found');
        return;
      }
      
      // Mark habit as being toggled
      setTogglingHabits(prev => new Set(prev).add(id));
      
      // Get consistent date format
      const today = getToday();
      const isCurrentlyCompleted = oldHabit.lastCompletedOn === today;
      
      console.log('Toggling habit:', { id, name: oldHabit.name, isCurrentlyCompleted, today, lastCompletedOn: oldHabit.lastCompletedOn });

      // Make API call WITHOUT optimistic update first
      const response = await habitsService.toggleHabitCompletion(id);
      const updatedHabit = response.habit;
      const xpData = response.xp;
      console.log('Server response for toggle:', { id, updatedHabit, xpData });
      
      // Only update state after successful API response
      setHabits(prev => prev.map(h => h.id === id ? updatedHabit : h));
      
      // Check if habit was just completed (not uncompleted)
      const todayStr = getToday();
      const wasCompleted = oldHabit?.lastCompletedOn === todayStr;
      const isNowCompleted = updatedHabit.lastCompletedOn === todayStr;
      
      console.log('Completion status check:', { wasCompleted, isNowCompleted, todayStr });
      
      if (!wasCompleted && isNowCompleted) {
        // Show XP earned toast
        if (xpData && xpData.earned > 0) {
          toast.success('⭐ XP Earned!', `+${xpData.earned} XP • Level ${xpData.level}`);
        } else {
          toast.success('Habit Completed!', `Great job completing "${oldHabit.name}"!`);
        }
        
        // Check for streak milestones
        if (updatedHabit.streak === 7 || updatedHabit.streak === 30 || updatedHabit.streak === 100) {
          let streakTitle = '';
          if (updatedHabit.streak === 7) streakTitle = '🔥 Week Warrior!';
          else if (updatedHabit.streak === 30) streakTitle = '👑 Month Master!';
          else if (updatedHabit.streak === 100) streakTitle = '🏆 Century Champion!';
          
          toast.success(streakTitle, `${updatedHabit.streak} day streak!`);
        }
        
        // Check for perfect day
        const updatedHabits = await habitsService.getHabits();
        const todayCompleted = updatedHabits.filter(h => h.lastCompletedOn === todayStr).length;
        if (todayCompleted === updatedHabits.length && updatedHabits.length > 1) {
          toast.success('🎯 Perfect Day!', `All ${updatedHabits.length} habits completed!`);
        }
        
        setHabits(updatedHabits);
      }
    } catch (error: any) {
      console.error('Failed to toggle habit:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      toast.error('Error', error.message || 'Failed to update habit');
      
      // Refresh from server to get correct state
      refresh();
    } finally {
      // Always remove from toggling set
      setTogglingHabits(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  }, [habits, refresh, togglingHabits, toast]);

  const confirmDelete = useCallback((id: string) => {
    Alert.alert('Delete Habit', 'Are you sure you want to delete this habit?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', 
        style: 'destructive', 
        onPress: async () => {
          try {
            await habitsService.deleteHabit(id);
            setHabits(prev => prev.filter(h => h.id !== id));
          } catch (error: any) {
            console.error('Failed to delete habit:', error);
            toast.error('Error', error.message || 'Failed to delete habit');
          }
        }
      },
    ]);
  }, []);

  const updateHabit = useCallback(async (id: string, data: Partial<CreateHabitData>) => {
    try {
      const updatedHabit = await habitsService.updateHabit(id, data);
      setHabits(prev => prev.map(h => h.id === id ? updatedHabit : h));
      return updatedHabit;
    } catch (error: any) {
      console.error('Failed to update habit:', error);
      toast.error('Error', error.message || 'Failed to update habit');
      throw error;
    }
  }, []);

  const clearAllHabits = useCallback(async () => {
    try {
      await habitsService.clearAllHabits();
      setHabits([]);
    } catch (error: any) {
      console.error('Failed to clear all habits:', error);
      toast.error('Error', error.message || 'Failed to clear all habits');
      throw error;
    }
  }, []);

  return { habits, loading, refresh, addHabit, toggleHabit, confirmDelete, updateHabit, clearAllHabits };
}

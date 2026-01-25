import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import habitsService, { Habit, CreateHabitData } from '../lib/habitsApi';
import { notificationService } from '../lib/notificationService';
import { useAuth } from '../lib/authContext';
import { getToday } from '../lib/dateHelper';

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

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
      setHabits(prev => [...prev, habit]);
      
      return habit;
    } catch (error: any) {
      console.error('Failed to add habit:', error);
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
        // Refresh habits list silently
        const updatedHabits = await habitsService.getHabits();
        setHabits(updatedHabits);
      }
    } catch (error: any) {
      console.error('Failed to toggle habit:', error);
      console.error('Error details:', error.response?.data || error.message);
      
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
  }, [habits, refresh, togglingHabits]);

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
      throw error;
    }
  }, []);

  const clearAllHabits = useCallback(async () => {
    try {
      await habitsService.clearAllHabits();
      setHabits([]);
    } catch (error: any) {
      console.error('Failed to clear all habits:', error);
      throw error;
    }
  }, []);

  return { habits, loading, refresh, addHabit, toggleHabit, confirmDelete, updateHabit, clearAllHabits };
}

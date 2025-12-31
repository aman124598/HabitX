import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TutorialContextType {
  hasSeenTutorial: boolean;
  setHasSeenTutorial: (value: boolean) => void;
  markAsNewUser: () => Promise<void>;
  isLoading: boolean;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

const TUTORIAL_STORAGE_KEY = '@habit_tracker_tutorial_seen';

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [hasSeenTutorial, setHasSeenTutorialState] = useState(true); // Default to true
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTutorialState();
  }, []);

  const loadTutorialState = async () => {
    try {
      const value = await AsyncStorage.getItem(TUTORIAL_STORAGE_KEY);
      if (value !== null) {
        setHasSeenTutorialState(value === 'true');
      } else {
        // If no value exists, this is likely a new install
        // But we'll default to true and only show tutorial when explicitly marked as new user
        setHasSeenTutorialState(true);
      }
    } catch (error) {
      console.error('Error loading tutorial state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setHasSeenTutorial = async (value: boolean) => {
    try {
      await AsyncStorage.setItem(TUTORIAL_STORAGE_KEY, value.toString());
      setHasSeenTutorialState(value);
    } catch (error) {
      console.error('Error saving tutorial state:', error);
    }
  };

  // Mark user as new (should see tutorial)
  const markAsNewUser = async () => {
    try {
      await AsyncStorage.setItem(TUTORIAL_STORAGE_KEY, 'false');
      setHasSeenTutorialState(false);
    } catch (error) {
      console.error('Error marking as new user:', error);
    }
  };

  return (
    <TutorialContext.Provider
      value={{ hasSeenTutorial, setHasSeenTutorial, markAsNewUser, isLoading }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}

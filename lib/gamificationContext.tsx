import React, { createContext, useContext, useState, ReactNode } from 'react';

interface XPReward {
  amount: number;
  title?: string;
  subtitle?: string;
}

interface StreakInfo {
  days: number;
  habitName: string;
}

interface LevelInfo {
  oldLevel: number;
  newLevel: number;
  xpGained: number;
}

interface GamificationContextType {
  showFlamesAnimation: (reward: XPReward) => void;
  showStreakCelebration: (info: StreakInfo) => void;
  showLevelUpCelebration: (info: LevelInfo) => void;
  currentReward: XPReward | null;
  streakInfo: StreakInfo | null;
  levelInfo: LevelInfo | null;
  isAnimationVisible: boolean;
  hideAnimation: () => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

interface GamificationProviderProps {
  children: ReactNode;
}

export function GamificationProvider({ children }: GamificationProviderProps) {
  const [currentReward, setCurrentReward] = useState<XPReward | null>(null);
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
  const [isAnimationVisible, setIsAnimationVisible] = useState(false);

  const showFlamesAnimation = (reward: XPReward) => {
    // Only show animation for XP rewards greater than 20
    if (reward.amount > 20) {
      setCurrentReward(reward);
      setIsAnimationVisible(true);
    }
  };

  const showStreakCelebration = (info: StreakInfo) => {
    setStreakInfo(info);
    setCurrentReward({
      amount: info.days * 10,
      title: `${info.days} Day Streak!`,
      subtitle: `Keep up the momentum with ${info.habitName}!`
    });
    setIsAnimationVisible(true);
  };

  const showLevelUpCelebration = (info: LevelInfo) => {
    setLevelInfo(info);
    setCurrentReward({
      amount: info.xpGained,
      title: `Level ${info.newLevel} Reached!`,
      subtitle: `You've gained ${info.xpGained} XP!`
    });
    setIsAnimationVisible(true);
  };

  const hideAnimation = () => {
    setIsAnimationVisible(false);
    // Clear all celebration data after a delay to allow exit animation
    setTimeout(() => {
      setCurrentReward(null);
      setStreakInfo(null);
      setLevelInfo(null);
    }, 300);
  };

  const contextValue: GamificationContextType = {
    showFlamesAnimation,
    showStreakCelebration,
    showLevelUpCelebration,
    currentReward,
    streakInfo,
    levelInfo,
    isAnimationVisible,
    hideAnimation,
  };

  return (
    <GamificationContext.Provider value={contextValue}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification(): GamificationContextType {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    // Provide a fallback that doesn't crash but logs warnings
    console.warn('useGamification must be used within a GamificationProvider. Using fallback.');
    return {
      showFlamesAnimation: (reward) => {
        console.warn('Flames animation triggered but no provider found:', reward);
      },
      showStreakCelebration: (info) => {
        console.warn('Streak celebration triggered but no provider found:', info);
      },
      showLevelUpCelebration: (info) => {
        console.warn('Level up celebration triggered but no provider found:', info);
      },
      currentReward: null,
      streakInfo: null,
      levelInfo: null,
      isAnimationVisible: false,
      hideAnimation: () => {},
    };
  }
  return context;
}
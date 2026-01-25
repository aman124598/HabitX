import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../lib/authContext';
import { userGamificationService } from '../lib/userGamificationApi';
import { gamificationService } from '../lib/gamificationService';

interface XPData {
  totalXP: number;
  level: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progressToNextLevel: number;
}

// XP required for each level (level = floor(totalXP / 100) + 1)
const XP_PER_LEVEL = 100;

function calculateLevelData(totalXP: number): XPData {
  const level = Math.floor(totalXP / XP_PER_LEVEL) + 1;
  const xpForCurrentLevel = (level - 1) * XP_PER_LEVEL;
  const xpForNextLevel = level * XP_PER_LEVEL;
  const xpInCurrentLevel = totalXP - xpForCurrentLevel;
  const progressToNextLevel = (xpInCurrentLevel / XP_PER_LEVEL) * 100;

  return {
    totalXP,
    level,
    xpForCurrentLevel,
    xpForNextLevel,
    progressToNextLevel: Math.min(100, Math.max(0, progressToNextLevel)),
  };
}

export function useXP() {
  const { user, isAuthenticated } = useAuth();
  const [xpData, setXPData] = useState<XPData>({
    totalXP: 0,
    level: 1,
    xpForCurrentLevel: 0,
    xpForNextLevel: 100,
    progressToNextLevel: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastXPGain, setLastXPGain] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setXPData(calculateLevelData(0));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await userGamificationService.getUserGamification();
      setXPData(calculateLevelData(data.totalXP));
    } catch (error) {
      console.error('Failed to fetch XP data:', error);
      // Try to use cached data
      const cached = gamificationService.getCachedUserGamification();
      if (cached) {
        setXPData(calculateLevelData(cached.totalXP));
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Initial load and when user changes
  useEffect(() => {
    if (user) {
      // Use user data if available
      const totalXP = user.totalXP || 0;
      setXPData(calculateLevelData(totalXP));
      setLoading(false);
      
      // Also fetch fresh data from server
      refresh();
    } else {
      setXPData(calculateLevelData(0));
      setLoading(false);
    }
  }, [user]);

  const handleXPGain = useCallback((xpEarned: number, newTotal: number) => {
    setLastXPGain(xpEarned);
    setXPData(calculateLevelData(newTotal));
    
    // Clear the XP gain notification after 3 seconds
    setTimeout(() => {
      setLastXPGain(null);
    }, 3000);
  }, []);

  return {
    ...xpData,
    loading,
    refresh,
    lastXPGain,
    handleXPGain,
  };
}

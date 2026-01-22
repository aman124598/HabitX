import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from './auth';
import { getApiUrl } from './config';

interface UserGamification {
  totalXP: number;
  level: number;
}

const CACHE_KEY = 'user_gamification_cache';
const BACKUP_KEY = 'user_gamification_backup';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

let cachedData: UserGamification | null = null;
let cacheTimestamp: number = 0;

/**
 * Gamification service for managing user XP and levels
 */
export const gamificationService = {
  /**
   * Get cached user gamification data
   */
  getCachedUserGamification(): UserGamification | null {
    return cachedData;
  },

  /**
   * Set cached data
   */
  setCachedUserGamification(data: UserGamification): void {
    cachedData = data;
    cacheTimestamp = Date.now();
    
    // Also save to AsyncStorage as backup
    AsyncStorage.setItem(BACKUP_KEY, JSON.stringify({
      data,
      timestamp: cacheTimestamp,
    })).catch(console.error);
  },

  /**
   * Clear cache
   */
  clearCache(): void {
    cachedData = null;
    cacheTimestamp = 0;
    AsyncStorage.removeItem(CACHE_KEY).catch(console.error);
  },

  /**
   * Check if cache is valid
   */
  isCacheValid(): boolean {
    return cachedData !== null && (Date.now() - cacheTimestamp) < CACHE_DURATION;
  },

  /**
   * Load cached data from AsyncStorage
   */
  async loadFromStorage(): Promise<UserGamification | null> {
    try {
      const stored = await AsyncStorage.getItem(BACKUP_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        cachedData = parsed.data;
        cacheTimestamp = parsed.timestamp;
        return cachedData;
      }
    } catch (error) {
      console.error('Failed to load gamification from storage:', error);
    }
    return null;
  },
};

export default gamificationService;

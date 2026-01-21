import authService from './auth';
import { getApiUrl } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserGamificationData {
  totalXP: number;
  level: number;
}

export interface AddXPResponse {
  totalXP: number;
  level: number;
  xpAdded: number;
  leveledUp: boolean;
  previousLevel: number;
}

export interface GamificationResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

class UserGamificationService {
  private readonly BACKUP_KEY = 'user_gamification_backup';
  private readonly MAX_BACKUP_AGE = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  private async backupUserGamification(data: UserGamificationData): Promise<void> {
    try {
      const backup = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(this.BACKUP_KEY, JSON.stringify(backup));
      console.log('📦 Backed up gamification data:', data);
    } catch (error) {
      console.warn('Failed to backup gamification data:', error);
    }
  }

  private async restoreUserGamificationBackup(): Promise<UserGamificationData | null> {
    try {
      const backupStr = await AsyncStorage.getItem(this.BACKUP_KEY);
      if (!backupStr) return null;

      const backup = JSON.parse(backupStr);
      const age = Date.now() - backup.timestamp;
      
      // Only use backup if it's less than 24 hours old
      if (age > this.MAX_BACKUP_AGE) {
        console.log('Backup too old, ignoring:', age / (60 * 60 * 1000), 'hours');
        return null;
      }

      console.log('📥 Restored gamification backup:', backup.data);
      return backup.data;
    } catch (error) {
      console.warn('Failed to restore gamification backup:', error);
      return null;
    }
  }

  async getUserGamification(): Promise<UserGamificationData> {
    try {
      const response = await authService.makeAuthenticatedRequest(getApiUrl('/auth/gamification'));
      
      if (!response.ok) {
        // Don't log every failure - just return default
        if (response.status === 401 || response.status === 403) {
          // User not authenticated - this is expected, don't spam logs
          const backup = await this.restoreUserGamificationBackup();
          if (backup) return backup;
          return { totalXP: 0, level: 1 };
        }
        throw new Error(`Failed to fetch user gamification data: ${response.status}`);
      }

      const data: GamificationResponse<UserGamificationData> = await response.json();
      
      // Check if server returned suspicious zero values
      if (data.data.totalXP === 0 && data.data.level === 1) {
        const backup = await this.restoreUserGamificationBackup();
        if (backup && backup.totalXP > 0) {
          console.warn('⚠️ Server returned zero XP but backup exists with XP:', backup.totalXP);
          
          // Try to restore the backup to server
          try {
            await this.addXP(0); // This will trigger level recalculation on server
          } catch (restoreError) {
            // Ignore restore errors
          }
          
          return backup;
        }
      }
      
      // Backup current data for future use
      await this.backupUserGamification(data.data);
      
      return data.data;
    } catch (error) {
      // Try to use backup data as fallback without spamming logs
      const backup = await this.restoreUserGamificationBackup();
      if (backup) {
        return backup;
      }
      
      // Return default values silently
      return { totalXP: 0, level: 1 };
    }
  }

  async addXP(xp: number): Promise<AddXPResponse> {
    try {
      console.log('🎮 Adding XP to user:', xp);
      
      const response = await authService.makeAuthenticatedRequest(getApiUrl('/auth/gamification/xp'), {
        method: 'POST',
        body: JSON.stringify({ xp }),
      });

      console.log('📊 Add XP response status:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        let errorData;
        let errorText = '';
        try {
          errorText = await response.text();
          console.error('❌ Raw error response:', errorText);
          errorData = JSON.parse(errorText);
        } catch (parseError) {
          console.error('❌ Failed to parse error response:', parseError);
          throw new Error(`Request failed with status ${response.status}: ${errorText}`);
        }
        throw new Error(errorData.message || `Failed to add XP (Status: ${response.status})`);
      }

      const responseText = await response.text();
      console.log('📝 Raw add XP response:', responseText);
      
      try {
        const data: GamificationResponse<AddXPResponse> = JSON.parse(responseText);
        console.log('✅ XP added successfully. New total:', data.data.totalXP, 'Level:', data.data.level);
        
        // Backup the updated gamification data
        await this.backupUserGamification({
          totalXP: data.data.totalXP,
          level: data.data.level,
        });
        
        return data.data;
      } catch (parseError) {
        console.error('❌ JSON parse error for add XP response:', parseError);
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('❌ Add XP error:', error);
      throw error;
    }
  }
}

export const userGamificationService = new UserGamificationService();
export default userGamificationService;
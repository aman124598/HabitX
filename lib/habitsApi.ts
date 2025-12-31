import authService from './auth';
import { getApiUrl } from './config';

export type Frequency = 'daily' | 'weekly' | 'custom';
export type Category = 'Health' | 'Work' | 'Learning' | 'Lifestyle';

export interface CustomFrequency {
  type: 'times_per_week' | 'times_per_month' | 'every_x_days';
  value: number;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  goal?: string;
  frequency: Frequency;
  customFrequency?: CustomFrequency;
  category: Category;
  startDate: string;
  streak: number;
  lastCompletedOn?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  xp?: number;
  badges?: string[];
}

export interface CreateHabitData {
  name: string;
  description?: string;
  goal?: string;
  frequency?: Frequency;
  customFrequency?: CustomFrequency;
  category: Category;
  startDate: string;
}

export interface HabitResponse {
  success: boolean;
  data: Habit | Habit[];
  message?: string;
}

class HabitsService {
  async getHabits(): Promise<Habit[]> {
    try {
      const response = await authService.makeAuthenticatedRequest(getApiUrl('/habits'));
      
      if (!response.ok) {
        throw new Error('Failed to fetch habits');
      }

      const data: HabitResponse = await response.json();
      return Array.isArray(data.data) ? data.data : [];
    } catch (error) {
      console.error('Get habits error:', error);
      throw error;
    }
  }

  async createHabit(habitData: CreateHabitData): Promise<Habit> {
    try {
      console.log('🚀 Creating habit with data:', habitData);
      
      const response = await authService.makeAuthenticatedRequest(getApiUrl('/habits'), {
        method: 'POST',
        body: JSON.stringify(habitData),
      });

      console.log('📊 Create habit response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Create habit failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || errorData.error || 'Failed to create habit');
        } catch {
          throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to create habit'}`);
        }
      }

      const responseText = await response.text();
      console.log('📝 Raw response text:', responseText);
      
      try {
        const data: HabitResponse = JSON.parse(responseText);
        console.log('✅ Parsed habit response:', data);
        return data.data as Habit;
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('❌ Create habit error:', error);
      throw error;
    }
  }

  async updateHabit(id: string, habitData: Partial<CreateHabitData>): Promise<Habit> {
    try {
      const response = await authService.makeAuthenticatedRequest(getApiUrl(`/habits/${id}`), {
        method: 'PUT',
        body: JSON.stringify(habitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update habit');
      }

      const data: HabitResponse = await response.json();
      return data.data as Habit;
    } catch (error) {
      console.error('Update habit error:', error);
      throw error;
    }
  }

  async deleteHabit(id: string): Promise<void> {
    try {
      const response = await authService.makeAuthenticatedRequest(getApiUrl(`/habits/${id}`), {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete habit');
      }
    } catch (error) {
      console.error('Delete habit error:', error);
      throw error;
    }
  }

  async toggleHabitCompletion(id: string): Promise<Habit> {
    try {
      console.log('🔄 Toggling habit completion for ID:', id);
      
      const response = await authService.makeAuthenticatedRequest(getApiUrl(`/habits/${id}/toggle`), {
        method: 'POST',
      });

      console.log('📊 Toggle response status:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
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
        throw new Error(errorData.message || `Failed to toggle habit completion (Status: ${response.status})`);
      }

      const responseText = await response.text();
      console.log('📝 Raw toggle response:', responseText);
      
      try {
        const data: HabitResponse = JSON.parse(responseText);
        console.log('✅ Parsed toggle response:', data);
        return data.data as Habit;
      } catch (parseError) {
        console.error('❌ JSON parse error for toggle response:', parseError);
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('❌ Toggle habit completion error:', error);
      throw error;
    }
  }

  async clearAllHabits(): Promise<void> {
    try {
      const response = await authService.makeAuthenticatedRequest(getApiUrl('/habits/clear'), {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to clear all habits');
      }
    } catch (error) {
      console.error('Clear all habits error:', error);
      throw error;
    }
  }

  async addNote(habitId: string, text: string): Promise<Habit> {
    try {
      const response = await authService.makeAuthenticatedRequest(getApiUrl(`/habits/${habitId}/notes`), {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add note');
      }
      const data: HabitResponse = await response.json();
      return data.data as Habit;
    } catch (error) {
      console.error('Add note error:', error);
      throw error;
    }
  }

  async addAttachment(habitId: string, attachment: { filename: string; url: string; mimeType?: string; size?: number; }): Promise<Habit> {
    try {
      const response = await authService.makeAuthenticatedRequest(getApiUrl(`/habits/${habitId}/attachments`), {
        method: 'POST',
        body: JSON.stringify(attachment),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add attachment');
      }
      const data: HabitResponse = await response.json();
      return data.data as Habit;
    } catch (error) {
      console.error('Add attachment error:', error);
      throw error;
    }
  }

  async exportHabits(format: 'csv' | 'json' = 'csv'): Promise<{ contentType: string; data: string } | Habit[]> {
    try {
      const url = getApiUrl(`/habits/export${format ? `?format=${format}` : ''}`);
      const response = await authService.makeAuthenticatedRequest(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to export habits');
      }
      if (format === 'csv') {
        const text = await response.text();
        return { contentType: 'text/csv', data: text };
      }
      const data: HabitResponse = await response.json();
      return data.data as Habit[];
    } catch (error) {
      console.error('Export habits error:', error);
      throw error;
    }
  }

  async importHabits(items: any[]): Promise<Habit[]> {
    try {
      const response = await authService.makeAuthenticatedRequest(getApiUrl('/habits/import'), {
        method: 'POST',
        body: JSON.stringify({ items }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import habits');
      }
      const data: HabitResponse = await response.json();
      return data.data as Habit[];
    } catch (error) {
      console.error('Import habits error:', error);
      throw error;
    }
  }

  async gamifyHabit(habitId: string, payload: { xp?: number; }): Promise<Habit> {
    try {
      const response = await authService.makeAuthenticatedRequest(getApiUrl(`/habits/${habitId}/gamify`), {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to gamify habit');
      }
      const data: HabitResponse = await response.json();
      return data.data as Habit;
    } catch (error) {
      console.error('Gamify habit error:', error);
      throw error;
    }
  }

  async shareHabit(habitId: string, userIds: string[]): Promise<Habit> {
    try {
      const response = await authService.makeAuthenticatedRequest(getApiUrl(`/habits/${habitId}/share`), {
        method: 'POST',
        body: JSON.stringify({ userIds }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to share habit');
      }
      const data: HabitResponse = await response.json();
      return data.data as Habit;
    } catch (error) {
      console.error('Share habit error:', error);
      throw error;
    }
  }

  async setReminders(habitId: string, reminders: { time: string; timezone?: string; enabled?: boolean }[]): Promise<Habit> {
    try {
      const response = await authService.makeAuthenticatedRequest(getApiUrl(`/habits/${habitId}/reminders`), {
        method: 'POST',
        body: JSON.stringify({ reminders }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to set reminders');
      }
      const data: HabitResponse = await response.json();
      return data.data as Habit;
    } catch (error) {
      console.error('Set reminders error:', error);
      throw error;
    }
  }
}

export const habitsService = new HabitsService();
export default habitsService;

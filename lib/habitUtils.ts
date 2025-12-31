// Utility functions for handling frequency display and logic

export function getFrequencyDisplay(frequency: string, customFrequency?: any): string {
  switch (frequency) {
    case 'daily':
      return 'Daily';
    case 'weekly':
      return 'Weekly';
    case 'custom':
      if (!customFrequency) return 'Custom';
      const { type, value } = customFrequency;
      switch (type) {
        case 'times_per_week':
          return `${value} times per week`;
        case 'times_per_month':
          return `${value} times per month`;
        case 'every_x_days':
          return `Every ${value} days`;
        default:
          return 'Custom';
      }
    default:
      return frequency;
  }
}

export function getCategoryColor(category: string): string {
  switch (category) {
    case 'Health':
      return '#22c55e'; // Green
    case 'Work':
      return '#3b82f6'; // Blue
    case 'Learning':
      return '#8b5cf6'; // Purple
    case 'Lifestyle':
      return '#f59e0b'; // Orange
    default:
      return '#6b7280'; // Gray
  }
}

export function getCategoryIcon(category: string): string {
  switch (category) {
    case 'Health':
      return 'fitness-outline';
    case 'Work':
      return 'briefcase-outline';
    case 'Learning':
      return 'book-outline';
    case 'Lifestyle':
      return 'leaf-outline';
    default:
      return 'ellipse-outline';
  }
}

export const CATEGORIES = [
  { value: 'Health', label: 'Health', icon: 'fitness-outline', color: '#22c55e' },
  { value: 'Work', label: 'Work', icon: 'briefcase-outline', color: '#3b82f6' },
  { value: 'Learning', label: 'Learning', icon: 'book-outline', color: '#8b5cf6' },
  { value: 'Lifestyle', label: 'Lifestyle', icon: 'leaf-outline', color: '#f59e0b' },
] as const;

export const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'custom', label: 'Custom' },
] as const;

export const CUSTOM_FREQUENCY_TYPES = [
  { value: 'times_per_week', label: 'times per week' },
  { value: 'times_per_month', label: 'times per month' },
  { value: 'every_x_days', label: 'every X days' },
] as const;

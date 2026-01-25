import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from './theme';

export type ThemeMode = 'light' | 'dark';

interface ThemeColors {
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    overlay: string;
    glass: string;
    glassDark: string;
    glassLight: string;
    glassMedium: string;
    gradient: [string, string];
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
    accent: string;
    muted: string;
  };
  border: {
    light: string;
    medium: string;
    dark: string;
    focus: string;
    glass: string;
  };
  brand: {
    primary: string;
    secondary: string;
    tertiary: string;
    gradient: [string, string];
    gradientAlt: [string, string];
    gradientWarm: [string, string];
    gradientCool: [string, string];
    gradientSunset: [string, string];
    gradientOcean: [string, string];
    gradientForest: [string, string];
    gradientRoyal: [string, string];
  };
  status: {
    success: string;
    successLight: string;
    warning: string;
    warningLight: string;
    error: string;
    errorLight: string;
    info: string;
    infoLight: string;
  };
  card: {
    background: string;
    backgroundDark: string;
    backgroundGlass: string;
    backgroundGlassDark: string;
    shadow: string;
    border: string;
    borderGlass: string;
  };
  button: {
    primary: string;
    primaryHover: string;
    secondary: string;
    secondaryHover: string;
    success: string;
    warning: string;
    error: string;
    disabled: string;
  };
  category: {
    health: string;
    work: string;
    learning: string;
    lifestyle: string;
  };
  surface: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
}

const lightTheme: ThemeColors = {
  background: {
    primary: '#FFFFFF', // Pure white
    secondary: '#F8F9FA', // Slight gray
    tertiary: '#F1F3F5', // Card backgrounds
    overlay: 'rgba(0, 0, 0, 0.5)',
    glass: '#FFFFFF',
    glassDark: '#F8F9FA',
    glassLight: '#FFFFFF',
    glassMedium: '#F8F9FA',
    gradient: ['#FFFFFF', '#F8F9FA'],
  },
  text: {
    primary: '#0A0A0A', // Near black
    secondary: '#4A4A4A', // Dark gray
    tertiary: '#8A8A8A', // Medium gray
    inverse: '#FFFFFF', // White for dark backgrounds
    accent: '#B91C1C', // Dark red
    muted: '#6A6A6A',
  },
  border: {
    light: 'rgba(0, 0, 0, 0.06)',
    medium: 'rgba(0, 0, 0, 0.1)',
    dark: 'rgba(0, 0, 0, 0.15)',
    focus: '#DC2626', // Red focus
    glass: 'rgba(0, 0, 0, 0.04)',
  },
  brand: {
    primary: '#DC2626', // Dark red
    secondary: '#EF4444', // Lighter red
    tertiary: '#FCA5A5', // Light red
    gradient: ['#DC2626', '#B91C1C'] as [string, string],
    gradientAlt: ['#EF4444', '#DC2626'] as [string, string],
    gradientWarm: ['#DC2626', '#991B1B'] as [string, string],
    gradientCool: ['#B91C1C', '#DC2626'] as [string, string],
    gradientSunset: ['#EF4444', '#B91C1C'] as [string, string],
    gradientOcean: ['#DC2626', '#7F1D1D'] as [string, string],
    gradientForest: ['#DC2626', '#991B1B'] as [string, string],
    gradientRoyal: ['#B91C1C', '#EF4444'] as [string, string],
  },
  status: {
    success: '#16A34A', // Green
    successLight: '#DCFCE7',
    warning: '#D97706', // Amber
    warningLight: '#FEF3C7',
    error: '#DC2626', // Red
    errorLight: '#FEE2E2',
    info: '#DC2626', // Red for brand consistency
    infoLight: '#FEE2E2',
  },
  card: {
    background: '#FFFFFF',
    backgroundDark: '#F8F9FA',
    backgroundGlass: '#FFFFFF',
    backgroundGlassDark: '#F8F9FA',
    shadow: '#94A3B8',
    border: 'rgba(0, 0, 0, 0.06)',
    borderGlass: 'rgba(0, 0, 0, 0.04)',
  },
  button: {
    primary: '#DC2626', // Red primary
    primaryHover: '#B91C1C',
    secondary: '#F1F3F5',
    secondaryHover: '#E2E8F0',
    success: '#16A34A',
    warning: '#D97706',
    error: '#DC2626',
    disabled: '#CBD5E1',
  },
  category: {
    health: '#16A34A', // Green
    work: '#2563EB', // Blue
    learning: '#DC2626', // Red
    lifestyle: '#D97706', // Amber
  },
  surface: {
    primary: '#FFFFFF',
    secondary: '#F8F9FA',
    tertiary: '#F1F3F5',
  },
};

const darkTheme: ThemeColors = {
  background: {
    primary: '#0A0A0A', // True dark black
    secondary: '#141414', // Slightly lighter black
    tertiary: '#1A1A1A', // Card backgrounds
    overlay: 'rgba(0, 0, 0, 0.9)',
    glass: 'rgba(20, 20, 20, 0.95)',
    glassDark: 'rgba(10, 10, 10, 0.98)',
    glassLight: 'rgba(26, 26, 26, 0.95)',
    glassMedium: 'rgba(20, 20, 20, 0.9)',
    gradient: ['#0A0A0A', '#141414'],
  },
  text: {
    primary: '#FFFFFF', // Pure white
    secondary: '#A0A0A0', // Muted gray
    tertiary: '#666666', // Darker gray
    inverse: '#0A0A0A', // Dark for light backgrounds
    accent: '#DC2626', // Red accent
    muted: '#808080',
  },
  border: {
    light: 'rgba(255, 255, 255, 0.08)',
    medium: 'rgba(255, 255, 255, 0.12)',
    dark: 'rgba(255, 255, 255, 0.2)',
    focus: '#DC2626', // Red focus
    glass: 'rgba(255, 255, 255, 0.06)',
  },
  brand: {
    primary: '#DC2626', // Dark red
    secondary: '#EF4444', // Slightly lighter red
    tertiary: '#B91C1C', // Deeper red
    gradient: ['#DC2626', '#B91C1C'] as [string, string],
    gradientAlt: ['#EF4444', '#DC2626'] as [string, string],
    gradientWarm: ['#DC2626', '#991B1B'] as [string, string],
    gradientCool: ['#B91C1C', '#DC2626'] as [string, string],
    gradientSunset: ['#EF4444', '#B91C1C'] as [string, string],
    gradientOcean: ['#DC2626', '#7F1D1D'] as [string, string],
    gradientForest: ['#DC2626', '#991B1B'] as [string, string],
    gradientRoyal: ['#B91C1C', '#EF4444'] as [string, string],
  },
  status: {
    success: '#22C55E', // Green
    successLight: 'rgba(34, 197, 94, 0.15)',
    warning: '#F59E0B', // Amber
    warningLight: 'rgba(245, 158, 11, 0.15)',
    error: '#EF4444', // Red
    errorLight: 'rgba(239, 68, 68, 0.15)',
    info: '#DC2626', // Red for info in this theme
    infoLight: 'rgba(220, 38, 38, 0.15)',
  },
  card: {
    background: '#141414',
    backgroundDark: '#0A0A0A',
    backgroundGlass: '#1A1A1A',
    backgroundGlassDark: '#0F0F0F',
    shadow: '#000000',
    border: 'rgba(255, 255, 255, 0.06)',
    borderGlass: 'rgba(255, 255, 255, 0.04)',
  },
  button: {
    primary: '#DC2626', // Red primary
    primaryHover: '#EF4444',
    secondary: '#1A1A1A',
    secondaryHover: '#262626',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    disabled: '#333333',
  },
  category: {
    health: '#22C55E', // Green
    work: '#3B82F6', // Blue
    learning: '#DC2626', // Red
    lifestyle: '#F59E0B', // Amber
  },
  surface: {
    primary: '#141414',
    secondary: '#1A1A1A',
    tertiary: '#262626',
  },
};

interface ThemeContextType {
  themeMode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'settings:theme';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');

  const isDark = themeMode === 'dark';
  const colors = isDark ? darkTheme : lightTheme;

  useEffect(() => {
    loadThemeFromStorage();
  }, []);

  const loadThemeFromStorage = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (typeof savedTheme === 'string' && savedTheme.length > 0) {
        try {
          const parsedTheme = JSON.parse(savedTheme) as string;
          if (parsedTheme === 'system') {
            setThemeModeState('light');
          } else if (parsedTheme === 'light' || parsedTheme === 'dark') {
            setThemeModeState(parsedTheme as ThemeMode);
          }
        } catch (e) {
          console.warn('Ignored invalid theme in storage:', e);
        }
      }
    } catch (error) {
      console.error('Failed to load theme from storage:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(mode));
      try {
        const { setAndroidLauncherIcon } = await import('./androidIconSwitcher');
        if (mode === 'dark') {
          setAndroidLauncherIcon('dark');
        } else if (mode === 'light') {
          setAndroidLauncherIcon('light');
        } else {
          setAndroidLauncherIcon('default');
        }
      } catch (e) {
        // ignore if native module not available
      }
    } catch (error) {
      console.error('Failed to save theme to storage:', error);
    }
  };

  const value: ThemeContextType = {
    themeMode,
    colors,
    isDark,
    setThemeMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

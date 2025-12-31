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
  };
  brand: {
    primary: string;
    secondary: string;
    tertiary: string;
    gradient: [string, string];
    gradientAlt: [string, string];
    gradientWarm: [string, string];
    gradientCool: [string, string];
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
    shadow: string;
    border: string;
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
}

const lightTheme: ThemeColors = {
  background: {
    primary: Colors.gray[50],
    secondary: Colors.white,
    tertiary: Colors.gray[100],
    overlay: 'rgba(15, 23, 42, 0.6)',
    glass: 'rgba(255, 255, 255, 0.85)',
    glassDark: 'rgba(15, 23, 42, 0.7)',
  },
  text: {
    primary: Colors.gray[900],
    secondary: Colors.gray[600],
    tertiary: Colors.gray[400],
    inverse: Colors.white,
    accent: Colors.primary[600],
    muted: Colors.gray[500],
  },
  border: {
    light: Colors.gray[200],
    medium: Colors.gray[300],
    dark: Colors.gray[400],
    focus: Colors.primary[400],
  },
  brand: {
    primary: Colors.primary[500],
    secondary: Colors.secondary[500],
    tertiary: Colors.primary[400],
    gradient: [Colors.primary[500], Colors.secondary[500]],
    gradientAlt: [Colors.primary[600], Colors.primary[400]],
    gradientWarm: ['#F97316', '#FBBF24'],
    gradientCool: [Colors.secondary[500], Colors.primary[400]],
  },
  status: {
    success: Colors.success[500],
    successLight: Colors.success[100],
    warning: Colors.warning[500],
    warningLight: Colors.warning[100],
    error: Colors.error[500],
    errorLight: Colors.error[100],
    info: Colors.primary[500],
    infoLight: Colors.primary[100],
  },
  card: {
    background: Colors.white,
    backgroundDark: Colors.gray[800],
    shadow: Colors.gray[900],
    border: Colors.gray[100],
  },
  button: {
    primary: Colors.primary[500],
    primaryHover: Colors.primary[600],
    secondary: Colors.gray[100],
    secondaryHover: Colors.gray[200],
    success: Colors.success[500],
    warning: Colors.warning[500],
    error: Colors.error[500],
    disabled: Colors.gray[300],
  },
  category: {
    health: '#10B981',
    work: '#3B82F6',
    learning: '#8B5CF6',
    lifestyle: '#F59E0B',
  },
};

const darkTheme: ThemeColors = {
  background: {
    primary: '#0F172A', // slate-950
    secondary: '#1E293B', // slate-800
    tertiary: '#334155', // slate-700
    overlay: 'rgba(0, 0, 0, 0.8)',
    glass: 'rgba(30, 41, 59, 0.85)',
    glassDark: 'rgba(15, 23, 42, 0.9)',
  },
  text: {
    primary: '#F8FAFC', // slate-50
    secondary: '#CBD5E1', // slate-300
    tertiary: '#64748B', // slate-500
    inverse: '#0F172A', // slate-950
    accent: Colors.primary[400],
    muted: '#94A3B8',
  },
  border: {
    light: '#334155', // slate-700
    medium: '#475569', // slate-600
    dark: '#64748B', // slate-500
    focus: Colors.primary[400],
  },
  brand: {
    primary: Colors.primary[400],
    secondary: Colors.secondary[400],
    tertiary: Colors.primary[300],
    gradient: [Colors.primary[500], Colors.secondary[500]],
    gradientAlt: [Colors.primary[500], Colors.primary[300]],
    gradientWarm: ['#FB923C', '#FCD34D'],
    gradientCool: [Colors.secondary[400], Colors.primary[300]],
  },
  status: {
    success: Colors.success[400],
    successLight: 'rgba(16, 185, 129, 0.2)',
    warning: Colors.warning[400],
    warningLight: 'rgba(245, 158, 11, 0.2)',
    error: Colors.error[400],
    errorLight: 'rgba(244, 63, 94, 0.2)',
    info: Colors.primary[400],
    infoLight: 'rgba(139, 92, 246, 0.2)',
  },
  card: {
    background: '#1E293B', // slate-800
    backgroundDark: '#0F172A',
    shadow: '#000000',
    border: '#334155',
  },
  button: {
    primary: Colors.primary[500],
    primaryHover: Colors.primary[400],
    secondary: '#334155',
    secondaryHover: '#475569',
    success: Colors.success[500],
    warning: Colors.warning[500],
    error: Colors.error[500],
    disabled: '#475569',
  },
  category: {
    health: '#34D399',
    work: '#60A5FA',
    learning: '#A78BFA',
    lifestyle: '#FBBF24',
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

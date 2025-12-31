import { Platform } from 'react-native';

export const Colors = {
  // Primary Brand Colors - Vibrant Purple/Indigo
  primary: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#8B5CF6', // Main brand color
    600: '#7C3AED',
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#4C1D95',
  },
  
  // Secondary/Accent Colors - Vibrant Teal/Cyan
  secondary: {
    50: '#ECFEFF',
    100: '#CFFAFE',
    200: '#A5F3FC',
    300: '#67E8F9',
    400: '#22D3EE',
    500: '#06B6D4',
    600: '#0891B2',
    700: '#0E7490',
    800: '#155E75',
    900: '#164E63',
  },
  
  // Success Colors - Emerald Green
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },
  
  // Warning Colors - Amber
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  
  // Error Colors - Rose
  error: {
    50: '#FFF1F2',
    100: '#FFE4E6',
    200: '#FECDD3',
    300: '#FDA4AF',
    400: '#FB7185',
    500: '#F43F5E',
    600: '#E11D48',
    700: '#BE123C',
    800: '#9F1239',
    900: '#881337',
  },
  
  // Neutral Colors - Slate
  gray: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },
  
  // Special Colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const Theme = {
  colors: {
    // Background Colors
    background: {
      primary: Colors.gray[50],
      secondary: Colors.white,
      tertiary: Colors.gray[100],
      overlay: 'rgba(15, 23, 42, 0.6)',
      glass: 'rgba(255, 255, 255, 0.8)',
      glassDark: 'rgba(15, 23, 42, 0.7)',
    },
    
    // Text Colors
    text: {
      primary: Colors.gray[900],
      secondary: Colors.gray[600],
      tertiary: Colors.gray[400],
      inverse: Colors.white,
      accent: Colors.primary[600],
      muted: Colors.gray[500],
    },
    
    // Border Colors
    border: {
      light: Colors.gray[200],
      medium: Colors.gray[300],
      dark: Colors.gray[400],
      focus: Colors.primary[400],
    },
    
    // Brand Colors
    brand: {
      primary: Colors.primary[500],
      secondary: Colors.secondary[500],
      tertiary: Colors.primary[400],
      gradient: [Colors.primary[500], Colors.secondary[500]] as [string, string],
      gradientAlt: [Colors.primary[600], Colors.primary[400]] as [string, string],
      gradientWarm: ['#F97316', '#FBBF24'] as [string, string],
      gradientCool: [Colors.secondary[500], Colors.primary[400]] as [string, string],
    },
    
    // Status Colors
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
    
    // Component Specific Colors
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
    
    // Category Colors
    category: {
      health: '#10B981',
      work: '#3B82F6',
      learning: '#8B5CF6',
      lifestyle: '#F59E0B',
    },
  },
  
  // Spacing Scale
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    xxxxl: 48,
  },
  
  // Border Radius Scale
  borderRadius: {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 20,
    xxxl: 28,
    full: 9999,
  },
  
  // Font Sizes
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 17,
    xl: 19,
    xxl: 22,
    xxxl: 28,
    xxxxl: 34,
    xxxxxl: 42,
  },
  
  // Font Weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  
  // Animation Durations
  animation: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
};

// Enhanced shadow definitions with more depth
const ShadowStyles = {
  none: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    boxShadow: 'none',
  },
  xs: {
    shadowColor: Colors.gray[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
  },
  sm: {
    shadowColor: Colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    boxShadow: '0 2px 4px rgba(15, 23, 42, 0.06)',
  },
  md: {
    shadowColor: Colors.gray[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
  },
  lg: {
    shadowColor: Colors.gray[900],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
  },
  xl: {
    shadowColor: Colors.gray[900],
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 12,
    boxShadow: '0 12px 40px rgba(15, 23, 42, 0.16)',
  },
  colored: {
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    boxShadow: '0 8px 24px rgba(139, 92, 246, 0.3)',
  },
};

// Platform-specific shadow helper
export const getShadow = (shadowLevel: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'colored') => {
  const shadow = ShadowStyles[shadowLevel];
  if (Platform.OS === 'web') {
    return { boxShadow: shadow.boxShadow };
  }
  return {
    shadowColor: shadow.shadowColor,
    shadowOffset: shadow.shadowOffset,
    shadowOpacity: shadow.shadowOpacity,
    shadowRadius: shadow.shadowRadius,
    elevation: shadow.elevation,
  };
};

// Glass morphism effect helper
export const getGlassMorphism = (opacity: number = 0.8) => {
  if (Platform.OS === 'web') {
    return {
      backgroundColor: `rgba(255, 255, 255, ${opacity})`,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
    };
  }
  return {
    backgroundColor: `rgba(255, 255, 255, ${opacity})`,
  };
};

export default Theme;
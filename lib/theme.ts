import { Platform } from 'react-native';

export const Colors = {
  // Primary Brand Colors - Vibrant Purple/Indigo with Glassmorphic Touch
  primary: {
    50: '#FAF5FF',
    100: '#F3E8FF',
    200: '#E9D5FF',
    300: '#D8B4FE',
    400: '#C084FC',
    500: '#A855F7', // Main brand color - more vibrant
    600: '#9333EA',
    700: '#7E22CE',
    800: '#6B21A8',
    900: '#581C87',
  },
  
  // Secondary/Accent Colors - Vibrant Teal/Cyan with depth
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
  
  // Neutral Colors - Slate with enhanced contrast
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
  
  // Glassmorphic overlay colors
  glass: {
    light: 'rgba(255, 255, 255, 0.7)',
    medium: 'rgba(255, 255, 255, 0.5)',
    dark: 'rgba(0, 0, 0, 0.3)',
    ultraLight: 'rgba(255, 255, 255, 0.9)',
  },
};

export const Theme = {
  colors: {
    // Background Colors - Clean solid backgrounds
    background: {
      primary: '#FFFFFF',
      secondary: '#F8F9FA',
      tertiary: '#F1F3F5',
      overlay: 'rgba(0, 0, 0, 0.5)',
      glass: '#FFFFFF',
      glassDark: '#0A0A0A',
      glassLight: '#FFFFFF',
      glassMedium: '#F8F9FA',
      gradient: ['#FFFFFF', '#F8F9FA'],
    },
    
    // Text Colors
    text: {
      primary: '#0A0A0A',
      secondary: '#4A4A4A',
      tertiary: '#8A8A8A',
      inverse: '#FFFFFF',
      accent: '#DC2626',
      muted: '#6A6A6A',
    },
    
    // Border Colors
    border: {
      light: 'rgba(0, 0, 0, 0.06)',
      medium: 'rgba(0, 0, 0, 0.1)',
      dark: 'rgba(0, 0, 0, 0.15)',
      focus: '#DC2626',
    },
    
    // Brand Colors - Dark Red Theme
    brand: {
      primary: '#DC2626',
      secondary: '#EF4444',
      tertiary: '#FCA5A5',
      gradient: ['#DC2626', '#B91C1C'] as [string, string],
      gradientAlt: ['#EF4444', '#DC2626'] as [string, string],
      gradientWarm: ['#DC2626', '#991B1B'] as [string, string],
      gradientCool: ['#B91C1C', '#DC2626'] as [string, string],
      gradientSunset: ['#EF4444', '#B91C1C'] as [string, string],
      gradientOcean: ['#DC2626', '#7F1D1D'] as [string, string],
      gradientForest: ['#DC2626', '#991B1B'] as [string, string],
      gradientRoyal: ['#B91C1C', '#EF4444'] as [string, string],
    },
    
    // Status Colors
    status: {
      success: '#16A34A',
      successLight: '#DCFCE7',
      warning: '#D97706',
      warningLight: '#FEF3C7',
      error: '#DC2626',
      errorLight: '#FEE2E2',
      info: '#DC2626',
      infoLight: '#FEE2E2',
    },
    
    // Component Specific Colors
    card: {
      background: '#FFFFFF',
      backgroundDark: '#0A0A0A',
      backgroundGlass: '#FFFFFF',
      backgroundGlassDark: '#141414',
      shadow: '#94A3B8',
      border: 'rgba(0, 0, 0, 0.06)',
      borderGlass: 'rgba(0, 0, 0, 0.04)',
    },
    
    button: {
      primary: '#DC2626',
      primaryHover: '#B91C1C',
      secondary: '#F1F3F5',
      secondaryHover: '#E2E8F0',
      success: '#16A34A',
      warning: '#D97706',
      error: '#DC2626',
      disabled: '#CBD5E1',
    },
    
    // Category Colors
    category: {
      health: '#16A34A',
      work: '#2563EB',
      learning: '#DC2626',
      lifestyle: '#D97706',
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
  
  // Border Radius Scale with more organic curves
  borderRadius: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    xxl: 32,
    xxxl: 40,
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

// Clean shadow definitions - subtle and modern
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
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  sm: {
    shadowColor: Colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.06)',
  },
  md: {
    shadowColor: Colors.gray[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.08)',
  },
  lg: {
    shadowColor: Colors.gray[900],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.1)',
  },
  xl: {
    shadowColor: Colors.gray[900],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
  },
  colored: {
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    boxShadow: '0 4px 16px rgba(168, 85, 247, 0.2)',
  },
  glow: {
    shadowColor: Colors.primary[400],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
    boxShadow: '0 0 16px rgba(168, 85, 247, 0.3)',
  },
};

export const getShadow = (shadowLevel: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'colored' | 'glow') => {
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

// Enhanced Glass morphism effect helper with blur intensity options
export const getGlassMorphism = (opacity: number = 0.7, blurIntensity: 'light' | 'medium' | 'strong' = 'medium') => {
  const blurValues = {
    light: '10px',
    medium: '20px',
    strong: '30px',
  };
  
  if (Platform.OS === 'web') {
    return {
      backgroundColor: `rgba(255, 255, 255, ${opacity})`,
      backdropFilter: `blur(${blurValues[blurIntensity]}) saturate(180%)`,
      WebkitBackdropFilter: `blur(${blurValues[blurIntensity]}) saturate(180%)`,
      border: '1px solid rgba(255, 255, 255, 0.3)',
    };
  }
  return {
    backgroundColor: `rgba(255, 255, 255, ${opacity})`,
    borderWidth: 1,
    borderColor: `rgba(255, 255, 255, ${opacity * 0.5})`,
  };
};

// Dark glass morphism effect
export const getDarkGlassMorphism = (opacity: number = 0.7, blurIntensity: 'light' | 'medium' | 'strong' = 'medium') => {
  const blurValues = {
    light: '10px',
    medium: '20px',
    strong: '30px',
  };
  
  if (Platform.OS === 'web') {
    return {
      backgroundColor: `rgba(30, 41, 59, ${opacity})`,
      backdropFilter: `blur(${blurValues[blurIntensity]}) saturate(180%)`,
      WebkitBackdropFilter: `blur(${blurValues[blurIntensity]}) saturate(180%)`,
      border: '1px solid rgba(255, 255, 255, 0.1)',
    };
  }
  return {
    backgroundColor: `rgba(30, 41, 59, ${opacity})`,
    borderWidth: 1,
    borderColor: `rgba(255, 255, 255, ${opacity * 0.2})`,
  };
};

export default Theme;
import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle, TextStyle, PressableProps, Platform, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import Theme, { getShadow, getGlassMorphism, getDarkGlassMorphism } from '../lib/theme';
import { useTheme } from '../lib/themeContext';

// Animated Pressable for buttons
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ==================== ThemedView ====================
export interface ThemedViewProps {
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'card' | 'overlay' | 'glass' | 'glassLight' | 'glassDark';
  children: React.ReactNode;
  gradient?: boolean;
  gradientColors?: [string, string];
}

export function ThemedView({ style, variant = 'primary', children, gradient = false, gradientColors, ...props }: ThemedViewProps) {
  const { colors, isDark } = useTheme();
  
  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary': return colors.background.primary;
      case 'secondary': return colors.background.secondary;
      case 'tertiary': return colors.background.tertiary;
      case 'card': return colors.card.background;
      case 'overlay': return colors.background.overlay;
      case 'glass': return colors.background.glass;
      case 'glassLight': return colors.background.glassLight;
      case 'glassDark': return colors.background.glassDark;
      default: return colors.background.primary;
    }
  };

  if (gradient) {
    return (
      <LinearGradient
        colors={gradientColors || colors.background.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[style]}
      >
        {children}
      </LinearGradient>
    );
  }

  // Use BlurView for glass variants on native platforms
  if ((variant === 'glass' || variant === 'glassLight' || variant === 'glassDark') && Platform.OS !== 'web') {
    return (
      <BlurView
        intensity={variant === 'glassLight' ? 80 : variant === 'glassDark' ? 100 : 90}
        tint={isDark ? 'dark' : 'light'}
        style={[
          { backgroundColor: getBackgroundColor() },
          style,
        ]}
        {...props}
      >
        {children}
      </BlurView>
    );
  }

  return (
    <View
      style={[
        { backgroundColor: getBackgroundColor() },
        (variant === 'glass' || variant === 'glassLight' || variant === 'glassDark') && Platform.OS === 'web' && 
          (isDark ? getDarkGlassMorphism(0.7, 'medium') : getGlassMorphism(0.7, 'medium')) as ViewStyle,
        variant === 'card' && getShadow('md'),
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

// ==================== ThemedText ====================
export interface ThemedTextProps {
  style?: StyleProp<TextStyle>;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'accent' | 'success' | 'warning' | 'error';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | 'xxl' | 'xxxl' | 'xxxxl' | 'xxxxxl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  align?: 'left' | 'center' | 'right';
  children: React.ReactNode;
  numberOfLines?: number;
}

export function ThemedText({ 
  style, 
  variant = 'primary', 
  size = 'base', 
  weight = 'normal',
  align = 'left',
  children,
  numberOfLines,
  ...props 
}: ThemedTextProps) {
  const { colors } = useTheme();
  
  const getTextColor = () => {
    switch (variant) {
      case 'primary': return colors.text.primary;
      case 'secondary': return colors.text.secondary;
      case 'tertiary': return colors.text.tertiary;
      case 'inverse': return colors.text.inverse;
      case 'accent': return colors.brand.primary;
      case 'success': return colors.status.success;
      case 'warning': return colors.status.warning;
      case 'error': return colors.status.error;
      default: return colors.text.primary;
    }
  };

  return (
    <Text
      style={[
        {
          color: getTextColor(),
          fontSize: Theme.fontSize[size],
          fontWeight: Theme.fontWeight[weight] as any,
          textAlign: align,
        },
        style,
      ]}
      numberOfLines={numberOfLines}
      {...props}
    >
      {children}
    </Text>
  );
}

// ==================== ThemedButton ====================
export interface ThemedButtonProps extends PressableProps {
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  gradient?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  rounded?: boolean;
  glow?: boolean;
  children: React.ReactNode;
}

export function ThemedButton({ 
  style, 
  textStyle,
  variant = 'primary', 
  size = 'md', 
  gradient = false,
  icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  rounded = false,
  glow = false,
  children, 
  disabled,
  onPress,
  ...props 
}: ThemedButtonProps) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };
  
  const sizeStyles = {
    sm: { paddingVertical: 10, paddingHorizontal: 16, gap: 6 },
    md: { paddingVertical: 14, paddingHorizontal: 20, gap: 8 },
    lg: { paddingVertical: 16, paddingHorizontal: 24, gap: 10 },
    xl: { paddingVertical: 20, paddingHorizontal: 32, gap: 12 },
  };

  const textSizes: Record<string, 'sm' | 'base' | 'lg' | 'xl'> = {
    sm: 'sm',
    md: 'base',
    lg: 'lg',
    xl: 'xl',
  };

  const getButtonColors = () => {
    if (disabled) {
      return { bg: colors.button.disabled, text: colors.text.tertiary };
    }
    switch (variant) {
      case 'primary':
        return { bg: colors.brand.primary, text: colors.text.inverse };
      case 'secondary':
        return { bg: isDark ? colors.background.tertiary : colors.button.secondary, text: colors.text.primary };
      case 'success':
        return { bg: colors.status.success, text: colors.text.inverse };
      case 'warning':
        return { bg: colors.status.warning, text: colors.text.inverse };
      case 'error':
        return { bg: colors.status.error, text: colors.text.inverse };
      case 'outline':
        return { bg: 'transparent', text: colors.brand.primary, border: colors.brand.primary };
      case 'ghost':
        return { bg: 'transparent', text: colors.brand.primary };
      case 'glass':
        return { bg: colors.card.backgroundGlass, text: colors.text.primary, border: colors.card.borderGlass };
      default:
        return { bg: colors.brand.primary, text: colors.text.inverse };
    }
  };

  const buttonColors = getButtonColors();

  const buttonContent = (
    <View style={[styles.buttonContent, { gap: sizeStyles[size].gap }]}>
      {icon && iconPosition === 'left' && icon}
      <ThemedText 
        variant="inverse" 
        size={textSizes[size]}
        weight="semibold" 
        style={[{ color: buttonColors.text }, textStyle] as any}
      >
        {children}
      </ThemedText>
      {icon && iconPosition === 'right' && icon}
    </View>
  );

  const baseButtonStyle = [
    styles.button,
    sizeStyles[size],
    { 
      backgroundColor: buttonColors.bg,
      borderRadius: rounded ? Theme.borderRadius.full : Theme.borderRadius.xl,
    },
    (variant === 'outline' || variant === 'glass') && { borderWidth: 2, borderColor: buttonColors.border },
    variant === 'primary' && !gradient && (glow ? getShadow('glow') : getShadow('md')),
    variant === 'glass' && (isDark ? getDarkGlassMorphism(0.6, 'medium') : getGlassMorphism(0.6, 'medium')) as ViewStyle,
    fullWidth && { width: '100%' },
    style,
  ];

  if (gradient && variant === 'primary' && !disabled) {
    return (
      <AnimatedPressable 
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={disabled ? undefined : onPress}
        style={[animatedStyle, fullWidth && { width: '100%' }]}
        {...props}
      >
        <LinearGradient
          colors={colors.brand.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.button,
            sizeStyles[size],
            { borderRadius: rounded ? Theme.borderRadius.full : Theme.borderRadius.xl },
            glow ? getShadow('glow') : getShadow('colored'),
            style,
          ]}
        >
          {buttonContent}
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  // Glass button with BlurView on native
  if (variant === 'glass' && Platform.OS !== 'web') {
    return (
      <AnimatedPressable 
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={disabled ? undefined : onPress}
        style={[animatedStyle, fullWidth && { width: '100%' }]}
        {...props}
      >
        <BlurView
          intensity={70}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.button,
            sizeStyles[size],
            { 
              borderRadius: rounded ? Theme.borderRadius.full : Theme.borderRadius.xl,
              borderWidth: 2,
              borderColor: buttonColors.border,
              overflow: 'hidden',
            },
            style,
          ]}
        >
          {buttonContent}
        </BlurView>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable 
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={disabled ? undefined : onPress}
      style={[animatedStyle, baseButtonStyle]} 
      {...props}
    >
      {buttonContent}
    </AnimatedPressable>
  );
}

// ==================== ThemedCard ====================
export interface ThemedCardProps {
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'outlined' | 'gradient' | 'glass' | 'glassDark' | 'premium';
  gradientColors?: [string, string];
  children: React.ReactNode;
  onPress?: () => void;
  glow?: boolean;
}

export function ThemedCard({ 
  style, 
  variant = 'default', 
  gradientColors,
  children, 
  onPress,
  glow = false,
  ...props 
}: ThemedCardProps) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    }
  };
  
  const getCardStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle = {
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      borderRadius: Theme.borderRadius.xl,
      padding: Theme.spacing.lg,
      overflow: 'hidden',
    };

    switch (variant) {
      case 'elevated':
        return [baseStyle, { borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }, glow ? getShadow('glow') : getShadow('lg')];
      case 'outlined':
        return [baseStyle, { 
          borderWidth: 1.5, 
          borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
        }, getShadow('sm')];
      case 'glass':
        return [
          baseStyle,
          { borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
          getShadow('md'),
        ] as ViewStyle[];
      case 'glassDark':
        return [
          baseStyle,
          { borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' },
          getShadow('lg'),
        ] as ViewStyle[];
      case 'premium':
        return [
          baseStyle,
          {
            borderWidth: 1,
            borderColor: isDark ? 'rgba(168, 85, 247, 0.3)' : 'rgba(168, 85, 247, 0.15)',
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          },
          glow ? getShadow('glow') : getShadow('md'),
        ];
      case 'gradient':
        return [baseStyle];
      default:
        return [baseStyle, { borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }, getShadow('sm')];
    }
  };

  if (variant === 'gradient') {
    const cardContent = (
      <LinearGradient
        colors={gradientColors || colors.brand.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          {
            borderRadius: Theme.borderRadius.xxl,
            padding: Theme.spacing.lg,
          },
          glow ? getShadow('glow') : getShadow('colored'),
          style,
        ]}
      >
        {children}
      </LinearGradient>
    );

    if (onPress) {
      return (
        <AnimatedPressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
          style={animatedStyle}
        >
          {cardContent}
        </AnimatedPressable>
      );
    }
    return cardContent;
  }

  // Glass cards with BlurView on native
  if ((variant === 'glass' || variant === 'glassDark') && Platform.OS !== 'web') {
    const cardView = (
      <BlurView
        intensity={variant === 'glassDark' ? 90 : 70}
        tint={isDark ? 'dark' : 'light'}
        style={[
          {
            borderRadius: Theme.borderRadius.xxl,
            padding: Theme.spacing.lg,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: colors.card.borderGlass,
          },
          getShadow('md'),
          style,
        ]}
        {...props}
      >
        {children}
      </BlurView>
    );

    if (onPress) {
      return (
        <AnimatedPressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
          style={animatedStyle}
        >
          {cardView}
        </AnimatedPressable>
      );
    }
    return cardView;
  }

  const cardView = (
    <View style={[getCardStyle(), style] as ViewStyle[]} {...props}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={animatedStyle}
      >
        {cardView}
      </AnimatedPressable>
    );
  }

  return cardView;
}

// ==================== ThemedBadge ====================
export interface ThemedBadgeProps {
  style?: ViewStyle;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline' | 'glass' | 'premium';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  glow?: boolean;
  children: React.ReactNode;
}

export function ThemedBadge({ 
  style, 
  variant = 'default',
  size = 'md',
  icon,
  glow = false,
  children 
}: ThemedBadgeProps) {
  const { colors, isDark } = useTheme();

  const sizeStyles = {
    sm: { paddingVertical: 3, paddingHorizontal: 10, fontSize: Theme.fontSize.xs },
    md: { paddingVertical: 5, paddingHorizontal: 12, fontSize: Theme.fontSize.sm },
    lg: { paddingVertical: 7, paddingHorizontal: 16, fontSize: Theme.fontSize.base },
  };

  const getVariantStyle = () => {
    switch (variant) {
      case 'success':
        return { bg: colors.status.successLight, text: colors.status.success };
      case 'warning':
        return { bg: colors.status.warningLight, text: colors.status.warning };
      case 'error':
        return { bg: colors.status.errorLight, text: colors.status.error };
      case 'info':
        return { bg: colors.status.infoLight, text: colors.status.info };
      case 'outline':
        return { bg: 'transparent', text: colors.text.secondary, border: colors.border.medium };
      case 'glass':
        return { bg: colors.card.backgroundGlass, text: colors.text.primary, border: colors.card.borderGlass };
      case 'premium':
        return { bg: colors.brand.primary, text: colors.text.inverse };
      default:
        return { bg: colors.background.tertiary, text: colors.text.secondary };
    }
  };

  const variantStyle = getVariantStyle();

  return (
    <View
      style={[
        styles.badge,
        sizeStyles[size],
        {
          backgroundColor: variantStyle.bg,
          borderWidth: (variant === 'outline' || variant === 'glass') ? 1.5 : 0,
          borderColor: variantStyle.border,
          borderRadius: Theme.borderRadius.full,
        },
        variant === 'glass' && (isDark ? getDarkGlassMorphism(0.5, 'light') : getGlassMorphism(0.5, 'light')) as ViewStyle,
        variant === 'premium' && (glow ? getShadow('glow') : getShadow('colored')),
        style,
      ]}
    >
      {icon && <View style={{ marginRight: 4 }}>{icon}</View>}
      <Text style={{ 
        color: variantStyle.text, 
        fontSize: sizeStyles[size].fontSize, 
        fontWeight: '600',
        letterSpacing: 0.3,
      }}>
        {children}
      </Text>
    </View>
  );
}

// ==================== ThemedDivider ====================
export interface ThemedDividerProps {
  style?: ViewStyle;
  orientation?: 'horizontal' | 'vertical';
  color?: string;
}

export function ThemedDivider({ style, orientation = 'horizontal', color }: ThemedDividerProps) {
  const { colors } = useTheme();
  
  const dividerStyle: ViewStyle = orientation === 'horizontal' 
    ? { height: 1, width: '100%' }
    : { width: 1, height: '100%' };

  return (
    <View
      style={[
        { backgroundColor: color || colors.border.light },
        dividerStyle,
        style,
      ]}
    />
  );
}

// ==================== ThemedProgressBar ====================
export interface ThemedProgressBarProps {
  progress: number; // 0-100
  style?: ViewStyle;
  height?: number;
  color?: string;
  backgroundColor?: string;
  animated?: boolean;
  showLabel?: boolean;
  gradient?: boolean;
  gradientColors?: [string, string];
  glow?: boolean;
}

export function ThemedProgressBar({ 
  progress, 
  style, 
  height = 10,
  color,
  backgroundColor,
  animated = true,
  showLabel = false,
  gradient = false,
  gradientColors,
  glow = false,
}: ThemedProgressBarProps) {
  const { colors } = useTheme();
  const animatedWidth = useSharedValue(0);

  React.useEffect(() => {
    animatedWidth.value = withTiming(Math.min(100, Math.max(0, progress)), { duration: 600 });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value}%`,
  }));

  const progressContent = gradient ? (
    <LinearGradient
      colors={gradientColors || colors.brand.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[
        styles.progressFill,
        {
          height,
          borderRadius: height / 2,
        },
        animated ? animatedStyle : { width: `${Math.min(100, progress)}%` },
        glow && getShadow('glow'),
      ]}
    />
  ) : (
    <Animated.View
      style={[
        styles.progressFill,
        {
          height,
          backgroundColor: color || colors.brand.primary,
          borderRadius: height / 2,
        },
        animated ? animatedStyle : { width: `${Math.min(100, progress)}%` },
        glow && getShadow('glow'),
      ]}
    />
  );

  return (
    <View
      style={[
        styles.progressContainer,
        { 
          height, 
          backgroundColor: backgroundColor || colors.background.secondary, 
          borderRadius: height / 2 
        },
        style,
      ]}
    >
      {progressContent}
    </View>
  );
}

// ==================== ThemedIconButton ====================
export interface ThemedIconButtonProps extends TouchableOpacityProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'primary' | 'ghost' | 'danger' | 'glass' | 'premium';
  style?: ViewStyle;
  glow?: boolean;
}

export function ThemedIconButton({ 
  icon, 
  size = 'md', 
  variant = 'default',
  style,
  glow = false,
  onPress,
  ...props 
}: ThemedIconButtonProps) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.88, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const sizeMap = { sm: 36, md: 44, lg: 52, xl: 60 };

  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: colors.brand.primary, shadow: glow ? 'glow' : 'md' };
      case 'ghost':
        return { backgroundColor: 'transparent', shadow: 'none' };
      case 'danger':
        return { backgroundColor: colors.status.errorLight, shadow: 'sm' };
      case 'glass':
        return { backgroundColor: colors.card.backgroundGlass, shadow: 'md' };
      case 'premium':
        return { backgroundColor: colors.brand.primary, shadow: glow ? 'glow' : 'colored' };
      default:
        return { backgroundColor: colors.background.tertiary, shadow: 'xs' };
    }
  };

  const variantStyle = getVariantStyle();

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={[
        animatedStyle,
        styles.iconButton,
        {
          width: sizeMap[size],
          height: sizeMap[size],
          borderRadius: sizeMap[size] / 2,
          backgroundColor: variantStyle.backgroundColor,
        },
        variant === 'glass' && (isDark ? getDarkGlassMorphism(0.6, 'light') : getGlassMorphism(0.6, 'light')) as ViewStyle,
        variantStyle.shadow !== 'none' && getShadow(variantStyle.shadow as any),
        glow && getShadow('glow'),
        style,
      ]}
      {...props}
    >
      <MaterialIcons 
        name={icon} 
        size={sizeMap[size] * 0.6} 
        color={variant === 'ghost' || variant === 'glass' ? colors.text.primary : '#FFFFFF'} 
      />
    </AnimatedPressable>
  );
}

// ==================== Styles ====================
const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Theme.borderRadius.full,
  },
  
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  progressTrack: {
    flex: 1,
    overflow: 'hidden',
  },
  
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ==================== Utility Styles ====================
export const themedStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background.primary,
  },
  
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  shadow: getShadow('md'),
  
  rounded: {
    borderRadius: Theme.borderRadius.lg,
  },
  
  roundedFull: {
    borderRadius: Theme.borderRadius.full,
  },
});

export default Theme;

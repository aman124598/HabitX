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
import Theme, { getShadow, getGlassMorphism } from '../lib/theme';
import { useTheme } from '../lib/themeContext';

// Animated Pressable for buttons
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ==================== ThemedView ====================
export interface ThemedViewProps {
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'card' | 'overlay' | 'glass';
  children: React.ReactNode;
}

export function ThemedView({ style, variant = 'primary', children, ...props }: ThemedViewProps) {
  const { colors } = useTheme();
  
  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary': return colors.background.primary;
      case 'secondary': return colors.background.secondary;
      case 'tertiary': return colors.background.tertiary;
      case 'card': return colors.card.background;
      case 'overlay': return colors.background.overlay;
      case 'glass': return 'rgba(255, 255, 255, 0.85)';
      default: return colors.background.primary;
    }
  };

  return (
    <View
      style={[
        { backgroundColor: getBackgroundColor() },
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
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  gradient?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  rounded?: boolean;
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
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };
  
  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 14, gap: 6 },
    md: { paddingVertical: 12, paddingHorizontal: 18, gap: 8 },
    lg: { paddingVertical: 14, paddingHorizontal: 22, gap: 10 },
    xl: { paddingVertical: 18, paddingHorizontal: 28, gap: 12 },
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
      borderRadius: rounded ? Theme.borderRadius.full : Theme.borderRadius.lg,
    },
    variant === 'outline' && { borderWidth: 2, borderColor: buttonColors.border },
    variant === 'primary' && !gradient && getShadow('sm'),
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
          end={{ x: 1, y: 0 }}
          style={[
            styles.button,
            sizeStyles[size],
            { borderRadius: rounded ? Theme.borderRadius.full : Theme.borderRadius.lg },
            getShadow('colored'),
            style,
          ]}
        >
          {buttonContent}
        </LinearGradient>
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
  variant?: 'default' | 'elevated' | 'outlined' | 'gradient' | 'glass';
  gradientColors?: [string, string];
  children: React.ReactNode;
  onPress?: () => void;
}

export function ThemedCard({ 
  style, 
  variant = 'default', 
  gradientColors,
  children, 
  onPress,
  ...props 
}: ThemedCardProps) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    }
  };
  
  const getCardStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle = {
      backgroundColor: isDark ? colors.card.backgroundDark : colors.card.background,
      borderRadius: Theme.borderRadius.xl,
      padding: Theme.spacing.lg,
      overflow: 'hidden',
    };

    switch (variant) {
      case 'elevated':
        return [baseStyle, getShadow('lg')];
      case 'outlined':
        return [baseStyle, { borderWidth: 1, borderColor: colors.border.light }, getShadow('xs')];
      case 'glass':
        return [baseStyle, getGlassMorphism(0.85) as ViewStyle, getShadow('md')];
      case 'gradient':
        return [baseStyle];
      default:
        return [baseStyle, getShadow('sm')];
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
            borderRadius: Theme.borderRadius.xl,
            padding: Theme.spacing.lg,
          },
          getShadow('colored'),
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
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function ThemedBadge({ 
  style, 
  variant = 'default',
  size = 'md',
  icon,
  children 
}: ThemedBadgeProps) {
  const { colors } = useTheme();

  const sizeStyles = {
    sm: { paddingVertical: 2, paddingHorizontal: 8, fontSize: Theme.fontSize.xs },
    md: { paddingVertical: 4, paddingHorizontal: 10, fontSize: Theme.fontSize.sm },
    lg: { paddingVertical: 6, paddingHorizontal: 14, fontSize: Theme.fontSize.base },
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
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: variantStyle.border,
        },
        style,
      ]}
    >
      {icon && <View style={{ marginRight: 4 }}>{icon}</View>}
      <Text style={{ color: variantStyle.text, fontSize: sizeStyles[size].fontSize, fontWeight: '600' }}>
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
}

export function ThemedProgressBar({ 
  progress, 
  style, 
  height = 8,
  color,
  backgroundColor,
  animated = true,
  showLabel = false,
}: ThemedProgressBarProps) {
  const { colors } = useTheme();
  const animatedWidth = useSharedValue(0);

  React.useEffect(() => {
    animatedWidth.value = withTiming(Math.min(100, Math.max(0, progress)), { duration: 500 });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value}%`,
  }));

  return (
    <View style={[styles.progressContainer, style]}>
      <View
        style={[
          styles.progressTrack,
          {
            height,
            backgroundColor: backgroundColor || colors.background.tertiary,
            borderRadius: height / 2,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.progressFill,
            {
              height,
              backgroundColor: color || colors.brand.primary,
              borderRadius: height / 2,
            },
            animated ? animatedStyle : { width: `${Math.min(100, progress)}%` },
          ]}
        />
      </View>
      {showLabel && (
        <ThemedText variant="secondary" size="sm" weight="semibold" style={{ marginLeft: 8 }}>
          {Math.round(progress)}%
        </ThemedText>
      )}
    </View>
  );
}

// ==================== ThemedIconButton ====================
export interface ThemedIconButtonProps extends PressableProps {
  icon: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'ghost' | 'danger';
  style?: ViewStyle;
}

export function ThemedIconButton({ 
  icon, 
  size = 'md', 
  variant = 'default',
  style,
  onPress,
  ...props 
}: ThemedIconButtonProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const sizeMap = { sm: 32, md: 40, lg: 48 };

  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: colors.brand.primary };
      case 'ghost':
        return { backgroundColor: 'transparent' };
      case 'danger':
        return { backgroundColor: colors.status.errorLight };
      default:
        return { backgroundColor: colors.background.tertiary };
    }
  };

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
        },
        getVariantStyle(),
        style,
      ]}
      {...props}
    >
      {icon}
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

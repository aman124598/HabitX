import React, { useEffect, useRef } from 'react';
import { View, Pressable, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Removed gradient to keep a pure iOS-style glass effect
// import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ThemedText } from '../Themed';
import { useTheme } from '../../lib/themeContext';
import Theme, { getShadow } from '../../lib/theme';
import { ToastData, ToastType } from '../../lib/toastContext';

export interface ToastProps {
  toast: ToastData;
  onHide: (id: string) => void;
  index: number;
}

export default function Toast({ toast, onHide, index }: ToastProps) {
  const { colors } = useTheme();
  const slideAnim = useRef(new Animated.Value(300)).current; // Start off-screen (right)
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;
  const iconScaleAnim = useRef(new Animated.Value(0)).current;

  // Animation on mount with improved spring physics
  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 9,
        delay: index * 80, // Stagger animation for multiple toasts
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        delay: index * 80,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 9,
        delay: index * 80,
      }),
    ]).start();

    // Icon bounce animation with slight delay for extra polish
    Animated.sequence([
      Animated.delay(150 + index * 80),
      Animated.spring(iconScaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 120,
        friction: 5,
      }),
    ]).start();
  }, [slideAnim, fadeAnim, scaleAnim, iconScaleAnim, index]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 350,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 0.85,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
    ]).start(() => {
      onHide(toast.id);
    });
  };

  const getToastColors = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          gradientColors: ['transparent', 'transparent'],
          iconBg: 'rgba(0, 0, 0, 0.06)',
          iconColor: '#111827',
          textColor: '#111827',
          borderColor: 'rgba(0, 0, 0, 0.12)',
          shadowColor: 'rgba(0,0,0,0.25)',
        };
      case 'error':
        return {
          gradientColors: ['transparent', 'transparent'],
          iconBg: 'rgba(0, 0, 0, 0.06)',
          iconColor: '#111827',
          textColor: '#111827',
          borderColor: 'rgba(0, 0, 0, 0.12)',
          shadowColor: 'rgba(0,0,0,0.25)',
        };
      case 'warning':
        return {
          gradientColors: ['transparent', 'transparent'],
          iconBg: 'rgba(0, 0, 0, 0.06)',
          iconColor: '#111827',
          textColor: '#111827',
          borderColor: 'rgba(0, 0, 0, 0.12)',
          shadowColor: 'rgba(0,0,0,0.25)',
        };
      case 'info':
        return {
          gradientColors: ['transparent', 'transparent'],
          iconBg: 'rgba(0, 0, 0, 0.06)',
          iconColor: '#111827',
          textColor: '#111827',
          borderColor: 'rgba(0, 0, 0, 0.12)',
          shadowColor: 'rgba(0,0,0,0.25)',
        };
      case 'achievement':
        return {
          gradientColors: ['transparent', 'transparent'],
          iconBg: 'rgba(0, 0, 0, 0.06)',
          iconColor: '#111827',
          textColor: '#111827',
          borderColor: 'rgba(0, 0, 0, 0.12)',
          shadowColor: 'rgba(0,0,0,0.25)',
        };
      case 'xp':
        return {
          gradientColors: ['transparent', 'transparent'],
          iconBg: 'rgba(0, 0, 0, 0.06)',
          iconColor: '#111827',
          textColor: '#111827',
          borderColor: 'rgba(0, 0, 0, 0.12)',
          shadowColor: 'rgba(0,0,0,0.25)',
        };
      default:
        return {
          gradientColors: [colors.card.background, colors.card.background],
          iconBg: colors.background.tertiary,
          iconColor: colors.text.primary,
          textColor: colors.text.primary,
          borderColor: colors.border.light,
          shadowColor: colors.card.shadow,
        };
    }
  };

  const toastColors = getToastColors(toast.type);

  const styles = StyleSheet.create({
    container: {
      marginBottom: Theme.spacing.md,
      marginHorizontal: Theme.spacing.md,
    },
    
    toast: {
      borderRadius: Theme.borderRadius.xl,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: toastColors.borderColor,
      shadowColor: toastColors.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 6,
    },
    
    toastInner: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Theme.spacing.lg,
      minHeight: 72,
      backgroundColor: 'rgba(255, 255, 255, 0.65)', // iOS-like light glass for readability
    },
    
    iconContainer: {
      marginRight: Theme.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.06)',
    },
    
    content: {
      flex: 1,
      marginRight: Theme.spacing.sm,
    },
    
    title: {
      marginBottom: toast.message ? 4 : 0,
      letterSpacing: 0.2,
    },
    
    message: {
      lineHeight: 18,
      opacity: 0.95,
    },
    
    closeButton: {
      padding: Theme.spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(0, 0, 0, 0.06)',
    },
    
    actionButton: {
      marginTop: Theme.spacing.sm,
      paddingVertical: Theme.spacing.sm,
      paddingHorizontal: Theme.spacing.md,
      backgroundColor: 'rgba(0, 0, 0, 0.06)',
      borderRadius: Theme.borderRadius.md,
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.12)',
    },
    
    xpContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Theme.spacing.sm,
    },
    
    xpBadge: {
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      paddingHorizontal: Theme.spacing.md,
      paddingVertical: 6,
      borderRadius: Theme.borderRadius.full,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      shadowColor: 'rgba(0,0,0,0.4)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
  });

  const renderIcon = () => {
    let iconName = toast.icon;
    
    if (!iconName) {
      switch (toast.type) {
        case 'success':
          iconName = 'checkmark-circle';
          break;
        case 'error':
          iconName = 'close-circle';
          break;
        case 'warning':
          iconName = 'warning';
          break;
        case 'info':
          iconName = 'information-circle';
          break;
        case 'achievement':
          iconName = 'trophy';
          break;
        case 'xp':
          iconName = 'sparkles';
          break;
        default:
          iconName = 'notifications';
      }
    }

    return (
      <Animated.View 
        style={[
          styles.iconContainer,
          {
            transform: [{ scale: iconScaleAnim }],
          },
        ]}
      >
        <Ionicons 
          name={iconName as any} 
          size={24} 
          color={toastColors.iconColor} 
        />
      </Animated.View>
    );
  };

  const renderXPBadge = () => {
    if (toast.type !== 'xp' && toast.type !== 'achievement') return null;
    
    const xpAmount = toast.data?.xp;
    if (!xpAmount) return null;

    return (
      <View style={styles.xpContainer}>
        <View style={styles.xpBadge}>
          <Ionicons name="sparkles" size={14} color="#FFD700" />
          <ThemedText 
            size="sm" 
            weight="bold" 
            style={{ color: '#FFD700', marginLeft: 6 }}
          >
            +{xpAmount} XP
          </ThemedText>
        </View>
      </View>
    );
  };

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateX: slideAnim },
            { scale: Animated.multiply(scaleAnim, pressAnim) },
          ],
          opacity: fadeAnim,
        },
      ]}
    >
      <View style={styles.toast}>
        <BlurView
          intensity={25}
          tint="light"
          style={{ 
            borderRadius: Theme.borderRadius.xl,
            overflow: 'hidden',
          }}
        >
            <Pressable
              style={[
                styles.toastInner,
                { 
                  borderWidth: 1,
                  borderColor: toastColors.borderColor,
                }
              ]}
              onPress={toast.onAction}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              disabled={!toast.onAction}
            >
            {renderIcon()}
            
            <View style={styles.content}>
              <ThemedText 
                weight="bold" 
                size="base"
                style={[styles.title as any, { color: toastColors.textColor }] as any}
              >
                {toast.title}
              </ThemedText>
              
              {toast.message && (
                <ThemedText 
                  size="sm" 
                  style={[styles.message, { color: toastColors.textColor }] as any}
                >
                  {toast.message}
                </ThemedText>
              )}
              
              {renderXPBadge()}
              
              {toast.actionLabel && toast.onAction && (
                <Pressable style={styles.actionButton} onPress={toast.onAction}>      
                  <ThemedText 
                    size="sm" 
                    weight="semibold"
                    style={{ color: toastColors.textColor }}
                  >
                    {toast.actionLabel}
                  </ThemedText>
                </Pressable>
              )}
            </View>
            
            <Pressable 
              style={styles.closeButton} 
              onPress={hideToast}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons 
                name="close" 
                size={18} 
                color={toastColors.textColor} 
              />
            </Pressable>
          </Pressable>
        </BlurView>
      </View>
    </Animated.View>
  );
}
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { ThemedText, ThemedCard } from '../Themed';
import { useTheme } from '../../lib/themeContext';
import Theme from '../../lib/theme';
import { gamificationService } from '../../lib/gamificationService';

interface XPIndicatorProps {
  habits: any[];
  compact?: boolean;
  gamificationData?: any;
}

export function XPIndicator({ habits, compact = false, gamificationData }: XPIndicatorProps) {
  const { colors, isDark } = useTheme();
  const progressWidth = useSharedValue(0);
  
  if (habits.length === 0) return null;

  const data = gamificationData || gamificationService.getGamificationData(habits, gamificationService.getCachedUserGamification() || undefined);
  const progressPercentage = data.nextLevelXP > 0 
    ? (data.currentLevelXP / data.nextLevelXP) * 100 
    : 0;

  React.useEffect(() => {
    progressWidth.value = withTiming(Math.min(progressPercentage, 100), {
      duration: 800,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [progressPercentage]);

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  // Level badge colors based on level
  const getLevelColor = () => {
    if (data.level >= 50) return ['#F59E0B', '#FBBF24']; // Gold
    if (data.level >= 25) return ['#8B5CF6', '#A78BFA']; // Purple
    if (data.level >= 10) return ['#06B6D4', '#22D3EE']; // Cyan
    return colors.brand.gradient;
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <LinearGradient
          colors={getLevelColor()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.compactLevelBadge}
        >
          <Ionicons name="star" size={12} color="white" />
          <ThemedText variant="inverse" size="sm" weight="extrabold">
            {data.level}
          </ThemedText>
        </LinearGradient>
        <View style={styles.compactXPInfo}>
          <ThemedText variant="secondary" size="xs" weight="semibold">
            {data.totalXP} XP
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <ThemedCard variant="elevated" style={styles.container}>
      <View style={styles.header}>
        {/* Level Badge */}
        <LinearGradient
          colors={getLevelColor()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.levelBadge}
        >
          <Ionicons name="star" size={18} color="white" />
          <ThemedText variant="inverse" size="lg" weight="extrabold">
            {data.level}
          </ThemedText>
        </LinearGradient>
        
        {/* XP Info */}
        <View style={styles.xpInfo}>
          <ThemedText variant="primary" size="base" weight="bold">
            Level {data.level}
          </ThemedText>
          <ThemedText variant="secondary" size="sm">
            {data.currentLevelXP} / {data.nextLevelXP} XP to next level
          </ThemedText>
        </View>
        
        {/* Total XP */}
        <View style={[styles.totalXPBadge, { backgroundColor: colors.status.infoLight }]}>
          <ThemedText variant="accent" size="sm" weight="bold">
            {data.totalXP}
          </ThemedText>
          <ThemedText variant="accent" size="xs">
            XP
          </ThemedText>
        </View>
      </View>
      
      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={[styles.progressTrack, { backgroundColor: isDark ? colors.background.tertiary : colors.background.tertiary }]}>
          <Animated.View style={[progressAnimatedStyle, { height: '100%' }]}>
            <LinearGradient
              colors={colors.brand.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.progressFill}
            />
          </Animated.View>
        </View>
        <ThemedText variant="tertiary" size="xs" weight="medium" style={styles.progressLabel}>
          {Math.round(progressPercentage)}%
        </ThemedText>
      </View>
    </ThemedCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Theme.spacing.lg,
    padding: Theme.spacing.lg,
    gap: Theme.spacing.md,
  },
  
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  
  compactLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.full,
    gap: 4,
  },
  
  compactXPInfo: {
    // No additional styles
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
  },
  
  levelBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  
  xpInfo: {
    flex: 1,
  },
  
  totalXPBadge: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.borderRadius.lg,
  },
  
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  
  progressLabel: {
    minWidth: 36,
    textAlign: 'right',
  },
});

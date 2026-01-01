import React, { useEffect } from 'react';
import { View, Pressable, StyleSheet, Platform, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { ThemedText } from '../Themed';
import { useTheme } from '../../lib/themeContext';
import Theme from '../../lib/theme';

type HeaderProps = {
  onSettings?: () => void;
  onProfile?: () => void;
  onToggleTheme?: () => void;
  currentStreak: number;
  successRate: number;
  greeting: string;
  subtitle: string;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function StatCard({ 
  icon, 
  iconColor, 
  value, 
  label,
  isStreak = false,
}: { 
  icon: keyof typeof Ionicons.glyphMap; 
  iconColor: string; 
  value: string | number; 
  label: string;
  isStreak?: boolean;
}) {
  const scale = useSharedValue(1);
  const iconPulse = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  // Pulse animation for streak icon
  useEffect(() => {
    if (isStreak && Number(value) > 0) {
      iconPulse.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1000 }),
          withTiming(0.2, { duration: 1000 })
        ),
        -1,
        true
      );
    }
  }, [isStreak, value]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconPulse.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <AnimatedPressable
      onPressIn={() => { scale.value = withSpring(0.95, { damping: 15, stiffness: 400 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
      style={[animatedStyle, styles.statCard]}
    >
      {/* Glassmorphic background */}
      <View style={styles.statCardInner}>
        <View style={styles.statIconWrapper}>
          {isStreak && Number(value) > 0 && (
            <Animated.View 
              style={[
                styles.iconGlow,
                glowAnimatedStyle,
                { backgroundColor: iconColor }
              ]} 
            />
          )}
          <Animated.View 
            style={[
              styles.statIconContainer, 
              { backgroundColor: `${iconColor}35` },
              iconAnimatedStyle
            ]}
          >
            <Ionicons name={icon} size={24} color={iconColor} />
          </Animated.View>
        </View>
        <View style={styles.statContent}>
          <ThemedText variant="inverse" size="xxl" weight="extrabold" style={styles.statValue}>
            {value}
          </ThemedText>
          <ThemedText variant="inverse" size="xs" weight="medium" style={styles.statLabel}>
            {label}
          </ThemedText>
        </View>
      </View>
    </AnimatedPressable>
  );
}

function IconButton({ 
  icon, 
  onPress, 
  accessibilityLabel,
  size = 20,
}: { 
  icon: keyof typeof Ionicons.glyphMap; 
  onPress: () => void; 
  accessibilityLabel: string;
  size?: number;
}) {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` }
    ],
  }));

  const handlePress = () => {
    // Add rotation animation for theme toggle
    if (accessibilityLabel === 'Toggle theme') {
      rotation.value = withSequence(
        withSpring(20, { damping: 8, stiffness: 400 }),
        withSpring(-20, { damping: 8, stiffness: 400 }),
        withSpring(0, { damping: 10, stiffness: 300 })
      );
    }
    onPress();
  };

  return (
    <AnimatedPressable
      onPressIn={() => { scale.value = withSpring(0.85, { damping: 15, stiffness: 400 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
      onPress={handlePress}
      accessibilityLabel={accessibilityLabel}
      style={[animatedStyle, styles.headerIconButton]}
    >
      <Ionicons name={icon} size={size} color="white" />
    </AnimatedPressable>
  );
}

export default function Header({ 
  onSettings, 
  onProfile, 
  onToggleTheme, 
  currentStreak, 
  successRate, 
  greeting, 
  subtitle 
}: HeaderProps) {
  const { colors, isDark } = useTheme();
  const greetingOpacity = useSharedValue(0);
  const greetingTranslateY = useSharedValue(20);
  const statsOpacity = useSharedValue(0);
  const statsTranslateY = useSharedValue(15);

  // Entrance animations
  useEffect(() => {
    greetingOpacity.value = withTiming(1, { duration: 600 });
    greetingTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    
    statsOpacity.value = withTiming(1, { duration: 600 });
    statsTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
  }, []);

  const greetingAnimatedStyle = useAnimatedStyle(() => ({
    opacity: greetingOpacity.value,
    transform: [{ translateY: greetingTranslateY.value }],
  }));

  const statsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: statsOpacity.value,
    transform: [{ translateY: statsTranslateY.value }],
  }));
  
  return (
    <View style={styles.wrapper}>
      <LinearGradient 
        colors={colors.brand.gradient}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Animated decorative elements */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeCircle3} />
        <View style={styles.decorativeLine1} />
        <View style={styles.decorativeLine2} />
        
        <View style={styles.container}>
          {/* Top Row - Greeting & Actions */}
          <Animated.View style={[styles.topRow, greetingAnimatedStyle]}>
            <View style={styles.greetingContainer}>
              <ThemedText variant="inverse" size="xxxl" weight="extrabold" style={styles.greeting}>
                {greeting}
              </ThemedText>
              <ThemedText variant="inverse" size="base" weight="medium" style={styles.subtitle}>
                {subtitle}
              </ThemedText>
            </View>
            
            <View style={styles.actionButtons}>
              {onToggleTheme && (
                <IconButton 
                  icon={isDark ? 'sunny-outline' : 'moon-outline'} 
                  onPress={onToggleTheme} 
                  accessibilityLabel="Toggle theme"
                />
              )}
              {onProfile && (
                <IconButton 
                  icon="person-circle-outline" 
                  onPress={onProfile} 
                  accessibilityLabel="Profile"
                  size={24}
                />
              )}
              {onSettings && (
                <IconButton 
                  icon="settings-outline" 
                  onPress={onSettings} 
                  accessibilityLabel="Settings"
                />
              )}
            </View>
          </Animated.View>

          {/* Stats Row */}
          <Animated.View style={[styles.statsRow, statsAnimatedStyle]}>
            <StatCard 
              icon="flame" 
              iconColor="#FBBF24" 
              value={currentStreak} 
              label="Day Streak"
              isStreak={true}
            />
            <StatCard 
              icon="trending-up" 
              iconColor="#34D399" 
              value={`${successRate}%`} 
              label="Today's Progress"
            />
          </Animated.View>
        </View>
      </LinearGradient>
      
      {/* Curved bottom with enhanced styling */}
      <View style={styles.curvedBottom}>
        <LinearGradient 
          colors={colors.brand.gradient}
          style={styles.curvedGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  
  gradient: { 
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 24) + 16,
    paddingBottom: 36,
    overflow: 'hidden',
  },
  
  // Enhanced decorative background elements
  decorativeCircle1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: -70,
    right: -50,
  },
  
  decorativeCircle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    bottom: 10,
    left: -40,
  },
  
  decorativeCircle3: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    top: 90,
    left: '35%',
  },

  decorativeLine1: {
    position: 'absolute',
    width: 100,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: 50,
    right: 20,
    transform: [{ rotate: '-30deg' }],
    borderRadius: 1,
  },

  decorativeLine2: {
    position: 'absolute',
    width: 60,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: 60,
    left: 40,
    transform: [{ rotate: '45deg' }],
    borderRadius: 1,
  },
  
  container: {
    paddingHorizontal: Theme.spacing.lg,
    zIndex: 1,
  },
  
  topRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.xl,
  },
  
  greetingContainer: {
    flex: 1,
    paddingRight: Theme.spacing.md,
  },
  
  greeting: {
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  
  subtitle: {
    opacity: 0.85,
    letterSpacing: 0.3,
  },
  
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  
  headerIconButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  statsRow: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
  },
  
  statCard: {
    flex: 1,
  },
  
  statCardInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    backdropFilter: 'blur(10px)',
  },

  statIconWrapper: {
    position: 'relative',
    marginRight: Theme.spacing.md,
  },

  iconGlow: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 16,
    top: -4,
    left: -4,
  },
  
  statIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  statContent: {
    flex: 1,
  },

  statValue: {
    letterSpacing: -0.5,
  },
  
  statLabel: {
    opacity: 0.8,
    marginTop: 3,
    letterSpacing: 0.2,
  },
  
  curvedBottom: {
    height: 24,
    marginTop: -24,
    overflow: 'hidden',
  },
  
  curvedGradient: {
    height: 48,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
});

import React from 'react';
import { View, Pressable, StyleSheet, Platform, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
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
  delay = 0,
}: { 
  icon: keyof typeof Ionicons.glyphMap; 
  iconColor: string; 
  value: string | number; 
  label: string;
  delay?: number;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={() => { scale.value = withSpring(0.95); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      style={[animatedStyle, styles.statCard]}
    >
      {/* Glassmorphic background */}
      <View style={styles.statCardInner}>
        <View style={[styles.statIconContainer, { backgroundColor: `${iconColor}30` }]}>
          <Ionicons name={icon} size={22} color={iconColor} />
        </View>
        <View style={styles.statContent}>
          <ThemedText variant="inverse" size="xxl" weight="extrabold">
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

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={() => { scale.value = withSpring(0.85); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      onPress={onPress}
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
  
  return (
    <View style={styles.wrapper}>
      <LinearGradient 
        colors={colors.brand.gradient}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Decorative circles */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeCircle3} />
        
        <View style={styles.container}>
          {/* Top Row - Greeting & Actions */}
          <View style={styles.topRow}>
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
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <StatCard 
              icon="flame" 
              iconColor="#FBBF24" 
              value={currentStreak} 
              label="Day Streak"
            />
            <StatCard 
              icon="trending-up" 
              iconColor="#34D399" 
              value={`${successRate}%`} 
              label="Today"
              delay={100}
            />
          </View>
        </View>
      </LinearGradient>
      
      {/* Curved bottom */}
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
    paddingBottom: 32,
    overflow: 'hidden',
  },
  
  // Decorative background circles
  decorativeCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -60,
    right: -40,
  },
  
  decorativeCircle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: 20,
    left: -30,
  },
  
  decorativeCircle3: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: 80,
    left: '40%',
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
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  
  subtitle: {
    opacity: 0.9,
  },
  
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  
  statsRow: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
  },
  
  statCard: {
    flex: 1,
  },
  
  statCardInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  
  statContent: {
    flex: 1,
  },
  
  statLabel: {
    opacity: 0.85,
    marginTop: 2,
  },
  
  curvedBottom: {
    height: 20,
    marginTop: -20,
    overflow: 'hidden',
  },
  
  curvedGradient: {
    height: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
});

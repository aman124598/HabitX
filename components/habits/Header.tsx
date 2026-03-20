import React, { useEffect, useMemo, useRef } from 'react';
import { View, Pressable, StyleSheet, Platform, StatusBar, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import { ThemedText } from '../Themed';
import { useTheme } from '../../lib/themeContext';
import Theme from '../../lib/theme';
import Svg, { Path, Circle } from 'react-native-svg';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DATE_ITEM_WIDTH = 52;

type HeaderProps = {
  onSettings?: () => void;
  onProfile?: () => void;
  onToggleTheme?: () => void;
  currentStreak: number;
  successRate: number;
  greeting: string;
  subtitle: string;
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
};

function getWeekDates(centerDate: Date): Date[] {
  const dates: Date[] = [];
  // Show 9 days: 4 before, today, 4 after
  for (let i = -4; i <= 4; i++) {
    const d = new Date(centerDate);
    d.setDate(centerDate.getDate() + i);
    dates.push(d);
  }
  return dates;
}

const DAY_NAMES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

function DateItem({ date, isToday, isSelected, onPress }: {
  date: Date;
  isToday: boolean;
  isSelected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.9, { damping: 15, stiffness: 400 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
        onPress={onPress}
        style={[
          styles.dateItem,
          isSelected && styles.dateItemSelected,
        ]}
      >
        <ThemedText
          style={[
            styles.dayName,
            { color: isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.5)' },
          ]}
        >
          {DAY_NAMES[date.getDay()]}
        </ThemedText>
        <View style={[
          styles.dateCircle,
          isSelected && styles.dateCircleSelected,
        ]}>
          <ThemedText
            style={[
              styles.dateNumber,
              { color: isSelected ? '#1A1A2E' : 'rgba(255,255,255,0.8)' },
            ]}
          >
            {date.getDate()}
          </ThemedText>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function LandscapeDecoration() {
  return (
    <View style={styles.landscapeContainer} pointerEvents="none">
      <Svg width={SCREEN_WIDTH} height={120} viewBox={`0 0 ${SCREEN_WIDTH} 120`}>
        {/* Rolling hills - back layer */}
        <Path
          d={`M0 90 Q${SCREEN_WIDTH * 0.15} 50, ${SCREEN_WIDTH * 0.3} 70 Q${SCREEN_WIDTH * 0.45} 90, ${SCREEN_WIDTH * 0.55} 65 Q${SCREEN_WIDTH * 0.7} 40, ${SCREEN_WIDTH * 0.85} 60 Q${SCREEN_WIDTH} 80, ${SCREEN_WIDTH} 75 L${SCREEN_WIDTH} 120 L0 120 Z`}
          fill="rgba(255,255,255,0.04)"
        />
        {/* Rolling hills - front layer */}
        <Path
          d={`M0 100 Q${SCREEN_WIDTH * 0.1} 80, ${SCREEN_WIDTH * 0.25} 85 Q${SCREEN_WIDTH * 0.4} 90, ${SCREEN_WIDTH * 0.5} 78 Q${SCREEN_WIDTH * 0.65} 65, ${SCREEN_WIDTH * 0.8} 80 Q${SCREEN_WIDTH * 0.9} 90, ${SCREEN_WIDTH} 85 L${SCREEN_WIDTH} 120 L0 120 Z`}
          fill="rgba(255,255,255,0.06)"
        />
        {/* Accent dots - like birds/stars */}
        <Circle cx={SCREEN_WIDTH * 0.2} cy={55} r={3} fill="rgba(45,212,191,0.6)" />
        <Circle cx={SCREEN_WIDTH * 0.35} cy={45} r={2} fill="rgba(45,212,191,0.4)" />
        <Circle cx={SCREEN_WIDTH * 0.7} cy={50} r={3} fill="rgba(45,212,191,0.6)" />
        <Circle cx={SCREEN_WIDTH * 0.85} cy={40} r={2} fill="rgba(45,212,191,0.4)" />
        <Circle cx={SCREEN_WIDTH * 0.55} cy={35} r={2.5} fill="rgba(45,212,191,0.5)" />
      </Svg>
    </View>
  );
}

export default function Header({
  onSettings,
  onProfile,
  onToggleTheme,
  currentStreak,
  successRate,
  greeting,
  subtitle,
  selectedDate: propSelectedDate,
  onDateSelect,
}: HeaderProps) {
  const { colors, isDark } = useTheme();
  const today = useMemo(() => new Date(), []);
  const selectedDate = propSelectedDate || today;
  const dates = useMemo(() => getWeekDates(today), [today]);
  const scrollRef = useRef<ScrollView>(null);

  // Auto-scroll to today on mount
  useEffect(() => {
    const todayIndex = 4; // center of the 9 dates
    const scrollX = todayIndex * DATE_ITEM_WIDTH - (SCREEN_WIDTH - DATE_ITEM_WIDTH) / 2;
    setTimeout(() => {
      scrollRef.current?.scrollTo({ x: Math.max(0, scrollX), animated: false });
    }, 100);
  }, []);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const headerBg = isDark ? '#1A1A2E' : colors.brand.gradient[0];

  return (
    <View style={styles.wrapper}>
      <View style={[styles.headerBackground, { backgroundColor: headerBg }]}>
        {/* Decorative landscape */}
        <LandscapeDecoration />

        <View style={styles.container}>
          {/* Top Row - Title & Actions */}
          <Animated.View entering={FadeIn.duration(400)} style={styles.topRow}>
            <View style={styles.topRowLeft}>
              {onToggleTheme && (
                <Pressable onPress={onToggleTheme} style={styles.iconBtn}>
                  <Ionicons
                    name={isDark ? 'sunny-outline' : 'moon-outline'}
                    size={20}
                    color="rgba(255,255,255,0.7)"
                  />
                </Pressable>
              )}
            </View>

            <ThemedText style={styles.titleText}>Today</ThemedText>

            <View style={styles.topRowRight}>
              {onProfile && (
                <Pressable onPress={onProfile} style={styles.iconBtn}>
                  <Ionicons name="person-circle-outline" size={22} color="rgba(255,255,255,0.7)" />
                </Pressable>
              )}
              {onSettings && (
                <Pressable onPress={onSettings} style={styles.iconBtn}>
                  <Ionicons name="settings-outline" size={20} color="rgba(255,255,255,0.7)" />
                </Pressable>
              )}
            </View>
          </Animated.View>

          {/* Date Strip */}
          <Animated.View entering={FadeIn.duration(500).delay(100)}>
            <ScrollView
              ref={scrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateStrip}
            >
              {dates.map((date, i) => (
                <DateItem
                  key={i}
                  date={date}
                  isToday={isSameDay(date, today)}
                  isSelected={isSameDay(date, selectedDate)}
                  onPress={() => onDateSelect?.(date)}
                />
              ))}
            </ScrollView>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },

  headerBackground: {
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 24) + 16,
    paddingBottom: 16,
    overflow: 'hidden',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  landscapeContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },

  container: {
    zIndex: 1,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
  },

  topRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
  },

  topRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 60,
    gap: 8,
  },

  titleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dateStrip: {
    paddingHorizontal: Theme.spacing.md,
    gap: 4,
  },

  dateItem: {
    width: DATE_ITEM_WIDTH,
    alignItems: 'center',
    paddingVertical: 6,
  },

  dateItemSelected: {},

  dayName: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 6,
  },

  dateCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dateCircleSelected: {
    backgroundColor: '#FFFFFF',
  },

  dateNumber: {
    fontSize: 15,
    fontWeight: '700',
  },

});

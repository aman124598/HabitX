import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useTheme } from '../../lib/themeContext';

const { width, height } = Dimensions.get('window');

// ─── Slide Data ──────────────────────────────────────────────────
interface Slide {
  icon: keyof typeof Ionicons.glyphMap;
  emoji: string;
  title: string;
  subtitle: string;
  features: { icon: keyof typeof Ionicons.glyphMap; text: string }[];
  gradient: [string, string, string];
}

const slides: Slide[] = [
  {
    icon: 'rocket',
    emoji: '🚀',
    title: 'Build Better Habits',
    subtitle: 'Create, track, and master your daily habits with smart categories and streaks.',
    features: [
      { icon: 'add-circle', text: 'Create habits in Health, Work, Learning & Lifestyle' },
      { icon: 'flame', text: 'Build streaks to stay consistent every day' },
      { icon: 'trophy', text: 'Earn XP and level up as you progress' },
    ],
    gradient: ['#667eea', '#764ba2', '#f093fb'],
  },
  {
    icon: 'timer',
    emoji: '⏱️',
    title: 'Track Your Time',
    subtitle: 'Built-in timer for each habit so you know exactly how long things take.',
    features: [
      { icon: 'play-circle', text: 'One-tap timer on every habit card' },
      { icon: 'bar-chart', text: '7-day time insights and daily breakdown' },
      { icon: 'analytics', text: 'See where your time really goes' },
    ],
    gradient: ['#11998e', '#38ef7d', '#56ab2f'],
  },
  {
    icon: 'stats-chart',
    emoji: '📊',
    title: 'Powerful Insights',
    subtitle: 'Beautiful stats, activity calendar, and progress tracking at a glance.',
    features: [
      { icon: 'grid', text: 'GitHub-style activity heatmap' },
      { icon: 'notifications', text: 'Smart reminders so you never miss a day' },
      { icon: 'cloud-upload', text: 'Backup & export your data anytime' },
    ],
    gradient: ['#fc5c7d', '#6a82fb', '#fc5c7d'],
  },
];

// ─── Component ───────────────────────────────────────────────────

interface TutorialScreenProps {
  onComplete: () => void;
}

export default function TutorialScreen({ onComplete }: TutorialScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const { colors, isDark } = useTheme();

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      scrollViewRef.current?.scrollTo({ x: next * width, animated: true });
    } else {
      onComplete();
    }
  };

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    if (index >= 0 && index < slides.length) {
      setCurrentIndex(index);
    }
  };

  const slide = slides[currentIndex];
  const isLast = currentIndex === slides.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0a0a0f' : '#fafafa' }]}>
      {/* Skip */}
      <Pressable
        style={styles.skipBtn}
        onPress={onComplete}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={[styles.skipText, { color: colors.text.tertiary }]}>Skip</Text>
      </Pressable>

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {slides.map((s, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            {/* Hero gradient circle */}
            <LinearGradient
              colors={s.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCircle}
            >
              <Text style={styles.heroEmoji}>{s.emoji}</Text>
            </LinearGradient>

            {/* Title */}
            <Text style={[styles.title, { color: colors.text.primary }]}>
              {s.title}
            </Text>

            {/* Subtitle */}
            <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
              {s.subtitle}
            </Text>

            {/* Feature List */}
            <View style={styles.featureList}>
              {s.features.map((f, fi) => (
                <View
                  key={fi}
                  style={[
                    styles.featureRow,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.05)'
                        : 'rgba(0,0,0,0.03)',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.featureIcon,
                      { backgroundColor: `${s.gradient[0]}20` },
                    ]}
                  >
                    <Ionicons name={f.icon} size={18} color={s.gradient[0]} />
                  </View>
                  <Text
                    style={[styles.featureText, { color: colors.text.secondary }]}
                    numberOfLines={2}
                  >
                    {f.text}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {/* Dots */}
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  width: i === currentIndex ? 28 : 8,
                  backgroundColor:
                    i === currentIndex ? slide.gradient[0] : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'),
                },
              ]}
            />
          ))}
        </View>

        {/* CTA Button */}
        <Pressable onPress={handleNext} style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
          <LinearGradient
            colors={[slide.gradient[0], slide.gradient[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaBtn}
          >
            <Text style={styles.ctaText}>
              {isLast ? 'Get Started' : 'Next'}
            </Text>
            <Ionicons
              name={isLast ? 'checkmark-circle' : 'arrow-forward'}
              size={20}
              color="#fff"
            />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 58 : 42,
    right: 24,
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },

  // ── Slide ──
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 20,
  },
  heroCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  heroEmoji: {
    fontSize: 52,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 10,
  },

  // ── Features ──
  featureList: {
    width: '100%',
    maxWidth: 380,
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },

  // ── Bottom ──
  bottomSection: {
    paddingHorizontal: 32,
    paddingBottom: Platform.OS === 'ios' ? 50 : 36,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  ctaText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});

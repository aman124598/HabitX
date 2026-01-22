import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeContext';
import Theme, { getShadow } from '../../lib/theme';

const { width, height } = Dimensions.get('window');

interface TutorialCard {
  id: number;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
}

const tutorialCards: TutorialCard[] = [
  {
    id: 1,
    icon: 'add-circle-outline',
    title: 'Create Habits',
    description: 'Add custom habits with categories like Health, Work, Learning, or Lifestyle. Set your goals and start tracking!',
    color: '#3B82F6',
  },
  {
    id: 2,
    icon: 'checkmark-circle-outline',
    title: 'Daily Check-ins',
    description: 'Mark your habits complete each day with a simple tap. Build consistency one day at a time.',
    color: '#10B981',
  },
  {
    id: 3,
    icon: 'flame-outline',
    title: 'Build Streaks',
    description: 'Stay motivated with streaks! Complete habits consistently to build powerful momentum.',
    color: '#F59E0B',
  },
  {
    id: 4,
    icon: 'stats-chart-outline',
    title: 'Track Progress',
    description: 'View detailed statistics, weekly charts, and insights about your habit completion rates.',
    color: '#8B5CF6',
  },
  {
    id: 5,
    icon: 'notifications-outline',
    title: 'Smart Reminders',
    description: 'Set up daily reminders so you never forget to complete your habits.',
    color: '#EC4899',
  },
];

interface TutorialScreenProps {
  onComplete: () => void;
}

export default function TutorialScreen({ onComplete }: TutorialScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const { colors, isDark } = useTheme();

  const handleNext = () => {
    if (currentIndex < tutorialCards.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setCurrentIndex(index);
  };

  const currentCard = tutorialCards[currentIndex];

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Skip button */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleSkip}
        activeOpacity={0.7}
      >
        <Text style={[styles.skipText, { color: colors.text.secondary }]}>
          Skip
        </Text>
      </TouchableOpacity>

      {/* Cards ScrollView */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {tutorialCards.map((card) => (
          <View key={card.id} style={[styles.cardContainer, { width }]}>
            <View style={styles.card}>
              {/* Icon */}
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${card.color}15` },
                ]}
              >
                <Ionicons name={card.icon} size={64} color={card.color} />
              </View>

              {/* Title */}
              <Text style={[styles.title, { color: colors.text.primary }]}>
                {card.title}
              </Text>

              {/* Description */}
              <Text style={[styles.description, { color: colors.text.secondary }]}>
                {card.description}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Pagination dots */}
      <View style={styles.pagination}>
        {tutorialCards.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor:
                  index === currentIndex
                    ? currentCard.color
                    : colors.border.light,
                width: index === currentIndex ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Next/Get Started button */}
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: currentCard.color },
          getShadow('md'),
        ]}
        onPress={handleNext}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>
          {currentIndex === tutorialCards.length - 1 ? 'Get Started' : 'Next'}
        </Text>
        <Ionicons
          name={
            currentIndex === tutorialCards.length - 1
              ? 'checkmark'
              : 'arrow-forward'
          }
          size={20}
          color="#FFFFFF"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    fontSize: Theme.fontSize.base,
    fontWeight: Theme.fontWeight.medium as any,
  },
  scrollView: {
    flex: 1,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 400,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: Theme.fontSize.xxxl,
    fontWeight: Theme.fontWeight.bold as any,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: Theme.fontSize.lg,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 32,
    marginBottom: Platform.OS === 'ios' ? 50 : 40,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: Theme.borderRadius.lg,
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.semibold as any,
  },
});

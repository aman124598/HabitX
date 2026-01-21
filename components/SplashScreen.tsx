import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationComplete }) => {
  // Simple animation values
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;
  const dot1Scale = useRef(new Animated.Value(0.8)).current;
  const dot2Scale = useRef(new Animated.Value(0.8)).current;
  const dot3Scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Simple entrance animation
    const mainSequence = Animated.sequence([
      // Title entrance
      Animated.parallel([
        Animated.spring(titleTranslateY, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
        Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      // Subtitle entrance
      Animated.delay(100),
      Animated.timing(subtitleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      // Loading dots
      Animated.timing(dotsOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]);

    // Loading dots animation
    const dotsAnimation = Animated.loop(
      Animated.sequence([
        Animated.spring(dot1Scale, { toValue: 1.2, tension: 300, friction: 10, useNativeDriver: true }),
        Animated.spring(dot1Scale, { toValue: 0.8, tension: 300, friction: 10, useNativeDriver: true }),
        Animated.spring(dot2Scale, { toValue: 1.2, tension: 300, friction: 10, useNativeDriver: true }),
        Animated.spring(dot2Scale, { toValue: 0.8, tension: 300, friction: 10, useNativeDriver: true }),
        Animated.spring(dot3Scale, { toValue: 1.2, tension: 300, friction: 10, useNativeDriver: true }),
        Animated.spring(dot3Scale, { toValue: 0.8, tension: 300, friction: 10, useNativeDriver: true }),
      ])
    );

    // Start animations
    mainSequence.start(() => {
      dotsAnimation.start();
      // Complete after brief delay
      setTimeout(() => {
        onAnimationComplete();
      }, 1500);
    });

    return () => {
      dotsAnimation.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Clean gradient background */}
      <LinearGradient
        colors={["#0F0F1A", "#1a1a2e", "#16213e"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Logo Section */}
      <View style={styles.logoSection}>
        {/* Title */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              transform: [{ translateY: titleTranslateY }],
              opacity: titleOpacity,
            },
          ]}
        >
          <Text style={styles.title}>HABIT</Text>
          <View style={styles.titleXContainer}>
            <LinearGradient
              colors={["#8B5CF6", "#06B6D4"]}
              style={styles.titleGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.titleX}>X</Text>
            </LinearGradient>
          </View>
        </Animated.View>
      </View>

      {/* Subtitle */}
      <Animated.View style={[styles.subtitleContainer, { opacity: subtitleOpacity }]}>
        <Text style={styles.subtitle}>Transform your life, one habit at a time</Text>
      </Animated.View>

      {/* Loading indicator */}
      <Animated.View style={[styles.loadingContainer, { opacity: dotsOpacity }]}>
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, { transform: [{ scale: dot1Scale }] }]} />
          <Animated.View style={[styles.dot, { transform: [{ scale: dot2Scale }] }]} />
          <Animated.View style={[styles.dot, { transform: [{ scale: dot3Scale }] }]} />
        </View>
        <Text style={styles.loadingText}>Loading your journey</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  logoSection: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 48,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 42,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 6,
  },
  titleXContainer: {
    marginLeft: 4,
  },
  titleGradient: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  titleX: {
    fontSize: 42,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 2,
  },
  subtitleContainer: {
    paddingHorizontal: 40,
    marginBottom: 60,
  },
  subtitle: {
    fontSize: 16,
    color: "#94A3B8",
    textAlign: "center",
    fontWeight: "400",
    letterSpacing: 0.5,
    lineHeight: 24,
  },
  loadingContainer: {
    alignItems: "center",
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#8B5CF6",
  },
  loadingText: {
    fontSize: 14,
    color: "#64748B",
    letterSpacing: 1,
  },
});

export default SplashScreen;

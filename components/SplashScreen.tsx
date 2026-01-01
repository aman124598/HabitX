import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Theme, { getShadow } from "../lib/theme";

const { width, height } = Dimensions.get("window");

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationComplete }) => {
  // Animation values
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoGlow = useRef(new Animated.Value(0)).current;
  const ringScale1 = useRef(new Animated.Value(0.5)).current;
  const ringScale2 = useRef(new Animated.Value(0.5)).current;
  const ringScale3 = useRef(new Animated.Value(0.5)).current;
  const ringOpacity1 = useRef(new Animated.Value(0)).current;
  const ringOpacity2 = useRef(new Animated.Value(0)).current;
  const ringOpacity3 = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(30)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(20)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;
  const dot1Scale = useRef(new Animated.Value(0.5)).current;
  const dot2Scale = useRef(new Animated.Value(0.5)).current;
  const dot3Scale = useRef(new Animated.Value(0.5)).current;
  const backgroundShift = useRef(new Animated.Value(0)).current;

  // Particle animations
  const particles = useRef(
    Array.from({ length: 12 }, () => ({
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
      rotation: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    // Background gradient shift animation
    const bgAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(backgroundShift, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
        }),
        Animated.timing(backgroundShift, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: false,
        }),
      ])
    );
    bgAnimation.start();

    // Main entrance sequence
    const mainSequence = Animated.sequence([
      // Logo entrance with bounce
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),

      // Pulsing rings
      Animated.stagger(150, [
        Animated.parallel([
          Animated.spring(ringScale1, { toValue: 1.5, tension: 40, friction: 10, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(ringOpacity1, { toValue: 0.6, duration: 300, useNativeDriver: true }),
            Animated.timing(ringOpacity1, { toValue: 0, duration: 600, useNativeDriver: true }),
          ]),
        ]),
        Animated.parallel([
          Animated.spring(ringScale2, { toValue: 2, tension: 40, friction: 10, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(ringOpacity2, { toValue: 0.4, duration: 300, useNativeDriver: true }),
            Animated.timing(ringOpacity2, { toValue: 0, duration: 600, useNativeDriver: true }),
          ]),
        ]),
        Animated.parallel([
          Animated.spring(ringScale3, { toValue: 2.5, tension: 40, friction: 10, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(ringOpacity3, { toValue: 0.2, duration: 300, useNativeDriver: true }),
            Animated.timing(ringOpacity3, { toValue: 0, duration: 600, useNativeDriver: true }),
          ]),
        ]),
      ]),

      // Title entrance
      Animated.parallel([
        Animated.spring(titleTranslateY, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
        Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),

      // Subtitle entrance
      Animated.delay(100),
      Animated.parallel([
        Animated.spring(subtitleTranslateY, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
        Animated.timing(subtitleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),

      // Loading dots
      Animated.timing(dotsOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]);

    // Particle animations
    const particleAnimations = particles.map((particle, index) => {
      const angle = (index / particles.length) * Math.PI * 2;
      const radius = 80 + Math.random() * 60;
      const targetX = Math.cos(angle) * radius;
      const targetY = Math.sin(angle) * radius;

      return Animated.loop(
        Animated.sequence([
          Animated.delay(index * 100),
          Animated.parallel([
            Animated.timing(particle.opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
            Animated.spring(particle.scale, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(particle.translateX, { toValue: targetX, duration: 2000, useNativeDriver: true }),
            Animated.timing(particle.translateY, { toValue: targetY, duration: 2000, useNativeDriver: true }),
            Animated.timing(particle.rotation, { toValue: 1, duration: 2000, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(particle.opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
            Animated.timing(particle.scale, { toValue: 0, duration: 500, useNativeDriver: true }),
          ]),
          // Reset
          Animated.parallel([
            Animated.timing(particle.translateX, { toValue: 0, duration: 0, useNativeDriver: true }),
            Animated.timing(particle.translateY, { toValue: 0, duration: 0, useNativeDriver: true }),
            Animated.timing(particle.rotation, { toValue: 0, duration: 0, useNativeDriver: true }),
          ]),
        ])
      );
    });

    // Loading dots animation
    const dotsAnimation = Animated.loop(
      Animated.sequence([
        Animated.spring(dot1Scale, { toValue: 1.3, tension: 300, friction: 10, useNativeDriver: true }),
        Animated.spring(dot1Scale, { toValue: 1, tension: 300, friction: 10, useNativeDriver: true }),
        Animated.spring(dot2Scale, { toValue: 1.3, tension: 300, friction: 10, useNativeDriver: true }),
        Animated.spring(dot2Scale, { toValue: 1, tension: 300, friction: 10, useNativeDriver: true }),
        Animated.spring(dot3Scale, { toValue: 1.3, tension: 300, friction: 10, useNativeDriver: true }),
        Animated.spring(dot3Scale, { toValue: 1, tension: 300, friction: 10, useNativeDriver: true }),
      ])
    );

    // Logo pulse animation
    const logoPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(logoGlow, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(logoGlow, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    );

    // Start all animations
    mainSequence.start(() => {
      dotsAnimation.start();
      logoPulse.start();
      particleAnimations.forEach(anim => anim.start());

      // Complete after animations
      setTimeout(() => {
        onAnimationComplete();
      }, 1800);
    });

    return () => {
      bgAnimation.stop();
      dotsAnimation.stop();
      logoPulse.stop();
      particleAnimations.forEach(anim => anim.stop());
    };
  }, []);

  const renderParticles = () => {
    const icons = ["sparkles", "star", "diamond", "flash", "heart", "ribbon", "trophy", "medal", "rocket", "flame", "sunny", "moon"];
    const colors = ["#A78BFA", "#8B5CF6", "#06B6D4", "#10B981", "#F59E0B", "#F43F5E", "#EC4899", "#6366F1"];

    return particles.map((particle, index) => {
      const rotationValue = particle.rotation.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
      });

      return (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              transform: [
                { translateX: particle.translateX },
                { translateY: particle.translateY },
                { scale: particle.scale },
                { rotate: rotationValue },
              ],
              opacity: particle.opacity,
            },
          ]}
        >
          <Ionicons
            name={icons[index % icons.length] as any}
            size={12 + (index % 3) * 4}
            color={colors[index % colors.length]}
          />
        </Animated.View>
      );
    });
  };

  const glowOpacity = logoGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Animated gradient background */}
      <LinearGradient
        colors={["#0F0F1A", "#1a1a2e", "#16213e", "#0F0F1A"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative orbs */}
      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />
      <View style={[styles.orb, styles.orb3]} />

      {/* Particle effects */}
      <View style={styles.particleContainer}>
        {renderParticles()}
      </View>

      {/* Logo Section */}
      <View style={styles.logoSection}>
        {/* Pulsing rings */}
        <Animated.View
          style={[
            styles.ring,
            {
              transform: [{ scale: ringScale1 }],
              opacity: ringOpacity1,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.ring,
            {
              transform: [{ scale: ringScale2 }],
              opacity: ringOpacity2,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.ring,
            {
              transform: [{ scale: ringScale3 }],
              opacity: ringOpacity3,
            },
          ]}
        />

        {/* Logo glow */}
        <Animated.View
          style={[
            styles.logoGlow,
            { opacity: glowOpacity },
          ]}
        />

        {/* Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: logoScale }],
              opacity: logoOpacity,
            },
          ]}
        >
          <LinearGradient
            colors={["#8B5CF6", "#A78BFA", "#C4B5FD"]}
            style={styles.logoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.logoInner}>
              <Text style={styles.logoText}>H</Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>

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
        <LinearGradient
          colors={["#8B5CF6", "#06B6D4"]}
          style={styles.titleGradientContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.titleX}>X</Text>
        </LinearGradient>
      </Animated.View>

      {/* Subtitle */}
      <Animated.View
        style={[
          styles.subtitleContainer,
          {
            transform: [{ translateY: subtitleTranslateY }],
            opacity: subtitleOpacity,
          },
        ]}
      >
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
  orb: {
    position: "absolute",
    borderRadius: 999,
  },
  orb1: {
    width: 300,
    height: 300,
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    top: -50,
    left: -100,
  },
  orb2: {
    width: 250,
    height: 250,
    backgroundColor: "rgba(6, 182, 212, 0.12)",
    bottom: 100,
    right: -80,
  },
  orb3: {
    width: 180,
    height: 180,
    backgroundColor: "rgba(236, 72, 153, 0.1)",
    bottom: -40,
    left: -40,
  },
  particleContainer: {
    position: "absolute",
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  particle: {
    position: "absolute",
  },
  logoSection: {
    alignItems: "center",
    justifyContent: "center",
    width: 200,
    height: 200,
    marginBottom: 40,
  },
  ring: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "#8B5CF6",
  },
  logoGlow: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#8B5CF6",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
  },
  logoContainer: {
    ...getShadow("xl"),
  },
  logoGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  logoInner: {
    width: "100%",
    height: "100%",
    borderRadius: 56,
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 56,
    fontWeight: "800",
    color: "#A78BFA",
    letterSpacing: -2,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 42,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 6,
  },
  titleGradientContainer: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 4,
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

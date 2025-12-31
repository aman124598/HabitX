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
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotation = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(40)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(20)).current;
  const cardScale = useRef(new Animated.Value(0.8)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const backgroundScale = useRef(new Animated.Value(1.1)).current;

  // Floating elements
  const floatingElements = useRef(
    Array.from({ length: 5 }, () => ({
      translateY: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    // Background animation
    const backgroundAnimation = Animated.timing(backgroundScale, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    });

    // Main animation sequence
    const mainSequence = Animated.sequence([
      // Background entrance
      backgroundAnimation,

      // Card entrance
      Animated.parallel([
        Animated.spring(cardScale, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),

      // Delay
      Animated.delay(200),

      // Logo entrance
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),

      // Text animations
      Animated.delay(300),
      Animated.parallel([
        Animated.spring(titleTranslateY, {
          toValue: 0,
          tension: 100,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),

      // Subtitle
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(subtitleTranslateY, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),

      // Progress bar
      Animated.delay(300),
      Animated.timing(progressWidth, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: false,
      }),

      // Floating elements
      Animated.stagger(
        100,
        floatingElements.map((element) =>
          Animated.parallel([
            Animated.spring(element.scale, {
              toValue: 1,
              tension: 100,
              friction: 8,
              useNativeDriver: true,
            }),
            Animated.timing(element.opacity, {
              toValue: 0.6,
              duration: 500,
              useNativeDriver: true,
            }),
          ])
        )
      ),
    ]);

    // Continuous animations
    const logoFloat = Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    const floatingAnimations = floatingElements.map((element, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(element.translateY, {
            toValue: -20 + Math.sin(index) * 5,
            duration: 2000 + index * 300,
            useNativeDriver: true,
          }),
          Animated.timing(element.translateY, {
            toValue: 20 - Math.sin(index) * 5,
            duration: 2000 + index * 300,
            useNativeDriver: true,
          }),
        ])
      )
    );

    // Start main sequence
    mainSequence.start(() => {
      logoFloat.start();
      floatingAnimations.forEach((anim) => anim.start());

      // Complete splash
      setTimeout(() => {
        onAnimationComplete();
      }, 1500);
    });

    return () => {
      logoFloat.stop();
      floatingAnimations.forEach((anim) => anim.stop());
    };
  }, []);

  const renderFloatingElements = () => {
    const positions = [
      { top: height * 0.2, left: width * 0.1 },
      { top: height * 0.3, right: width * 0.1 },
      { top: height * 0.7, left: width * 0.15 },
      { top: height * 0.8, right: width * 0.15 },
      { top: height * 0.5, left: width * 0.05 },
    ];

    const icons = ["checkmark-circle", "trophy", "star", "flame", "heart"];

    return floatingElements.map((element, index) => (
      <Animated.View
        key={index}
        style={[
          styles.floatingElement,
          {
            position: "absolute",
            ...positions[index],
            transform: [
              { scale: element.scale },
              { translateY: element.translateY },
            ],
            opacity: element.opacity,
          },
        ]}
      >
        <Ionicons
          name={icons[index] as any}
          size={16}
          color={Theme.colors.brand.primary}
        />
      </Animated.View>
    ));
  };

  const logoRotationValue = logoRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const progressWidthValue = progressWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Background matching app theme */}
      <Animated.View
        style={[
          styles.backgroundContainer,
          {
            transform: [{ scale: backgroundScale }],
          },
        ]}
      >
        <LinearGradient
          colors={["#1a1a2e", "#16213e", "#0f3460"]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Floating elements */}
      {renderFloatingElements()}

      {/* Main content card */}
      <Animated.View
        style={[
          styles.mainCard,
          {
            transform: [{ scale: cardScale }],
            opacity: cardOpacity,
          },
        ]}
      >
        {/* Logo container */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: logoScale }, { rotate: logoRotationValue }],
              opacity: logoOpacity,
            },
          ]}
        >
          <LinearGradient
            colors={[Theme.colors.brand.primary, "#8B5CF6"]}
            style={styles.logoGradient}
          >
            <Ionicons name="checkmark-circle" size={60} color="#ffffff" />
          </LinearGradient>
        </Animated.View>

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
          <Text style={styles.title}>Habit X</Text>
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
          <Text style={styles.subtitle}>
            Transform your life, one habit at a time
          </Text>
        </Animated.View>

        {/* Progress bar */}
        <Animated.View
          style={[
            styles.progressContainer,
            {
              opacity: subtitleOpacity,
            },
          ]}
        >
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressWidthValue,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>Loading your journey...</Text>
        </Animated.View>
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
  backgroundContainer: {
    position: "absolute",
    left: -width * 0.1,
    right: -width * 0.1,
    top: -height * 0.1,
    bottom: -height * 0.1,
  },
  gradient: {
    flex: 1,
  },
  floatingElement: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.2)",
  },
  mainCard: {
    backgroundColor: "#1F2937",
    borderRadius: 24,
    padding: 40,
    alignItems: "center",
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: "#374151",
    ...getShadow("lg"),
    maxWidth: 340,
    width: "100%",
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    ...getShadow("lg"),
  },
  titleContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as any,
    color: "#F9FAFB",
    textAlign: "center",
    letterSpacing: 1,
  },
  subtitleContainer: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 16,
    color: "#D1D5DB",
    textAlign: "center",
    fontWeight: "400" as any,
    letterSpacing: 0.5,
    lineHeight: 22,
  },
  progressContainer: {
    alignItems: "center",
    width: "100%",
  },
  progressBar: {
    width: "100%",
    height: 4,
    backgroundColor: "#374151",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Theme.colors.brand.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "400" as any,
    letterSpacing: 0.5,
  },
});

export default SplashScreen;

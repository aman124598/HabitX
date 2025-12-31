import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Animated,
  Dimensions,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

interface SplashScreenManagerProps {
  onReady: () => void;
  children: React.ReactNode;
  showPremiumSplash?: boolean;
  splashDuration?: number;
}

export const SplashScreenManager: React.FC<SplashScreenManagerProps> = ({
  onReady,
  children,
  showPremiumSplash = true,
  splashDuration = 3500,
}) => {
  const [isAppReady, setIsAppReady] = useState(false);
  const [showCustomSplash, setShowCustomSplash] = useState(true);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Particle system
  const particleAnims = useRef(
    Array.from({ length: 12 }, () => ({
      x: new Animated.Value((Math.random() - 0.5) * width),
      y: new Animated.Value((Math.random() - 0.5) * height),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
      rotate: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    async function prepare() {
      try {
        // Simulate app loading (replace with actual initialization)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (e) {
        console.warn(e);
      } finally {
        setIsAppReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (isAppReady) {

      if (showPremiumSplash) {
        // Start custom splash animations
        startSplashAnimations();

        // Hide custom splash after duration
        const timer = setTimeout(() => {
          setShowCustomSplash(false);
          onReady();
        }, splashDuration);

        return () => clearTimeout(timer);
      } else {
        // Skip custom splash
        setShowCustomSplash(false);
        onReady();
      }
    }
  }, [isAppReady, showPremiumSplash, splashDuration, onReady]);

  const startSplashAnimations = () => {
    // Hide status bar for immersive experience
    if (Platform.OS === 'ios') {
      StatusBar.setHidden(true);
    }

    // Main animation sequence
    const mainSequence = Animated.sequence([
      // Phase 1: Logo entrance
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }),
      ]),

      // Phase 2: Glow and rotation
      Animated.parallel([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0.3,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          { iterations: 2 }
        ),
      ]),

      // Phase 3: Text slide in
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]);

    // Particle animations
    const particleAnimations = particleAnims.map((particle, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(index * 150),
          Animated.parallel([
            Animated.timing(particle.opacity, {
              toValue: 0.7,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(particle.scale, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(particle.rotate, {
              toValue: 1,
              duration: 3000,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
    });

    // Start all animations
    mainSequence.start();
    particleAnimations.forEach(anim => anim.start());
  };

  // Interpolated values
  const logoRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowIntensity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  // Show app content if splash is done or not enabled
  if (!showCustomSplash || !isAppReady) {
    return showCustomSplash && isAppReady ? (
      <View style={styles.splashContainer}>
        {/* Dynamic Gradient Background */}
        <LinearGradient
          colors={[
            '#667eea',
            '#764ba2',
            '#667eea',
            '#f093fb',
            '#f5576c',
            '#4facfe',
            '#00f2fe',
          ]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Floating Particles */}
        {particleAnims.map((particle, index) => {
          const particleRotation = particle.rotate.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg'],
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.particle,
                {
                  opacity: particle.opacity,
                  transform: [
                    { translateX: particle.x },
                    { translateY: particle.y },
                    { scale: particle.scale },
                    { rotate: particleRotation },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.3)']}
                style={styles.particleGradient}
              />
            </Animated.View>
          );
        })}

        {/* Main Content */}
        <BlurView intensity={15} style={styles.contentContainer}>
          {/* Logo Section */}
          <Animated.View
            style={[
              styles.logoSection,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Glow Effect */}
            <Animated.View
              style={[
                styles.logoGlow,
                {
                  opacity: glowIntensity,
                  transform: [{ rotate: logoRotation }],
                },
              ]}
            >
              <LinearGradient
                colors={[
                  'rgba(255,255,255,0.4)',
                  'rgba(255,255,255,0.1)',
                  'rgba(255,255,255,0.4)',
                ]}
                style={styles.glowGradient}
              />
            </Animated.View>

            {/* Logo */}
            <View style={styles.logo}>
              <LinearGradient
                colors={['#FFD700', '#FFA500', '#FF6347']}
                style={styles.logoInner}
              >
                <Text style={styles.logoText}>H</Text>
              </LinearGradient>
            </View>

            {/* Logo Border Effect */}
            <Animated.View
              style={[
                styles.logoBorder,
                {
                  opacity: glowIntensity,
                  transform: [{ rotate: logoRotation }],
                },
              ]}
            />
          </Animated.View>

          {/* Text Section */}
          <Animated.View
            style={[
              styles.textSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }],
              },
            ]}
          >
            <Text style={styles.appTitle}>HabitTracker</Text>
            <Text style={styles.appSubtitle}>Transform Your Life, One Habit at a Time</Text>
            
            {/* Loading Indicator */}
            <View style={styles.loadingContainer}>
              <Animated.View
                style={[
                  styles.loadingDot,
                  { opacity: glowIntensity },
                ]}
              />
              <Animated.View
                style={[
                  styles.loadingDot,
                  { opacity: glowIntensity },
                ]}
              />
              <Animated.View
                style={[
                  styles.loadingDot,
                  { opacity: glowIntensity },
                ]}
              />
            </View>
          </Animated.View>
        </BlurView>

        {/* Decorative Elements */}
        <View style={[styles.cornerDecoration, styles.topLeft]} />
        <View style={[styles.cornerDecoration, styles.topRight]} />
        <View style={[styles.cornerDecoration, styles.bottomLeft]} />
        <View style={[styles.cornerDecoration, styles.bottomRight]} />
      </View>
    ) : null;
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  particle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  particleGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  logoGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  glowGradient: {
    flex: 1,
    borderRadius: 70,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  logoInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  logoBorder: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  textSection: {
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 2,
    marginBottom: 10,
  },
  appSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '300',
    letterSpacing: 1,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginHorizontal: 4,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  cornerDecoration: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  topLeft: {
    top: 60,
    left: 30,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    top: 60,
    right: 30,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: 60,
    left: 30,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: 60,
    right: 30,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
});

export default SplashScreenManager;
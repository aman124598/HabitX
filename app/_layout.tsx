import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState, useEffect } from "react";
import Theme from "../lib/theme";
import { installGlobalErrorHandler } from '../lib/installGlobalErrorHandler';
import { patchNativeEventEmitter } from '../lib/patchNativeEventEmitter';
import { AuthProvider, useAuth } from "../lib/authContext";
import { ThemeProvider, useTheme } from "../lib/themeContext";
import AsyncStorage from '@react-native-async-storage/async-storage';
import FirstInstallLogo from "../components/FirstInstallLogo";
import { GamificationProvider } from "../lib/gamificationContext";
import { TutorialProvider, useTutorial } from "../lib/tutorialContext";
import { FriendsProvider } from "../lib/friendsContext";
import { GamificationOverlay } from "../components/GamificationOverlay";
import AuthScreen from "../components/auth/AuthScreen";
import LoadingScreen from "../components/auth/LoadingScreen";
import TutorialScreen from "../components/onboarding/TutorialScreen";
import SplashScreen from "../components/SplashScreen";
import { NotificationHandler } from "../components/NotificationHandler";
import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ToastProvider, ToastContainer } from "../components/toast";
import ToastServiceProvider from "../components/toast/ToastServiceProvider";
import { useNotifications } from "../hooks/useNotifications";

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors, isDark } = useTheme();
  const { hasSeenTutorial, setHasSeenTutorial, isLoading: tutorialLoading } = useTutorial();
  const [showSplash, setShowSplash] = useState(true);
  const [showFirstInstallLogo, setShowFirstInstallLogo] = useState<boolean | null>(null);
  
  // Initialize notifications when user is authenticated
  useNotifications();
  // Determine whether we should show the first-install logo (only once after install)
  // showFirstInstallLogo: null -> checking, true -> show logo, false -> skip
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const v = await AsyncStorage.getItem('hasShownInstallLogo');
        if (!mounted) return;
        if (v === 'true') {
          setShowFirstInstallLogo(false);
        } else {
          setShowFirstInstallLogo(true);
        }
      } catch (e) {
        if (mounted) setShowFirstInstallLogo(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // While checking AsyncStorage, render the LoadingScreen (avoid a blank app)
  if (showFirstInstallLogo === null) return <LoadingScreen />;

  // Show first-install logo when appropriate
  if (showFirstInstallLogo) {
    return (
      <FirstInstallLogo
        onFinish={async () => {
          try {
            await AsyncStorage.setItem('hasShownInstallLogo', 'true');
          } catch (e) {
            // ignore
          }
          setShowFirstInstallLogo(false);
        }}
      />
    );
  }

  // Show splash screen on app start
  if (showSplash) {
    return (
      <SplashScreen
        onAnimationComplete={() => setShowSplash(false)}
      />
    );
  }

  if (isLoading || tutorialLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // Show tutorial on first launch after authentication
  if (!hasSeenTutorial) {
    return (
      <TutorialScreen onComplete={() => setHasSeenTutorial(true)} />
    );
  }

  return (
    <NotificationHandler>
      <GamificationOverlay>
        <StatusBar style={isDark ? "light" : "dark"} backgroundColor={colors.brand.primary} />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.brand.primary,
            },
            headerTintColor: colors.text.inverse,
            headerTitleStyle: {
              fontWeight: Theme.fontWeight.bold as any,
              fontSize: Theme.fontSize.lg,
            },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="habit" 
            options={{ 
              headerShown: true, 
              title: "Habit Details",
              presentation: "modal",
            }} 
          />
          <Stack.Screen 
            name="ChallengeLeaderboard" 
            options={{ 
              headerShown: true, 
              title: "Leaderboard",
            }} 
          />
          <Stack.Screen 
            name="ChallengeDetails" 
            options={{ 
              headerShown: true, 
              title: "Challenge Details",
            }} 
          />
          <Stack.Screen 
            name="GlobalLeaderboard" 
            options={{ 
              headerShown: true, 
              title: "Global Leaderboard",
            }} 
          />
          <Stack.Screen 
            name="FriendSearch" 
            options={{ 
              headerShown: false,
              presentation: "modal",
            }} 
          />
          <Stack.Screen 
            name="FriendRequests" 
            options={{ 
              headerShown: false,
              presentation: "modal",
            }} 
          />
          <Stack.Screen 
            name="FriendNotificationSettings" 
            options={{ 
              headerShown: false,
              presentation: "modal",
            }} 
          />
          <Stack.Screen 
            name="UserProfile" 
            options={{ 
              headerShown: false,
              presentation: "modal",
            }} 
          />
        </Stack>
        <ToastContainer position="top" />
      </GamificationOverlay>
    </NotificationHandler>
  );
}

export default function RootLayout() {
  // Install global JS error handler as early as possible
  try {
    // First, try to harden NativeEventEmitter to avoid Hermes errors
    try {
      patchNativeEventEmitter();
    } catch (err) {
      // best-effort
    }
    installGlobalErrorHandler();
  } catch (e) {
    // ignore
  }
  return (
    <ThemeProvider>
      <AuthProvider>
        <TutorialProvider>
          <ToastProvider maxToasts={5}>
            <ToastServiceProvider>
              <GamificationProvider>
                <FriendsProvider>
                  <RootLayoutNav />
                </FriendsProvider>
              </GamificationProvider>
            </ToastServiceProvider>
          </ToastProvider>
        </TutorialProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import Theme from "../lib/theme";
import { installGlobalErrorHandler } from '../lib/installGlobalErrorHandler';
import { patchNativeEventEmitter } from '../lib/patchNativeEventEmitter';
import { AuthProvider, useAuth } from "../lib/authContext";
import { ThemeProvider, useTheme } from "../lib/themeContext";
import SplashScreen from "../components/SplashScreen";
import { TutorialProvider, useTutorial } from "../lib/tutorialContext";
import AuthScreen from "../components/auth/AuthScreen";
import LoadingScreen from "../components/auth/LoadingScreen";
import TutorialScreen from "../components/onboarding/TutorialScreen";
import { NotificationHandler } from "../components/NotificationHandler";
import { useNotifications } from "../hooks/useNotifications";

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors, isDark } = useTheme();
  const { hasSeenTutorial, setHasSeenTutorial, isLoading: tutorialLoading } = useTutorial();
  const [showSplash, setShowSplash] = useState(true);
  
  // Initialize notifications when user is authenticated
  useNotifications();

  // Show splash screen on app start
  if (showSplash) {
    return (
      <SplashScreen onFinish={() => setShowSplash(false)} />
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
      </Stack>
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
          <RootLayoutNav />
        </TutorialProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

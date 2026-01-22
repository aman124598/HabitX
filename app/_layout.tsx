import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import Theme from "../lib/theme";
import { installGlobalErrorHandler } from '../lib/installGlobalErrorHandler';
import { patchNativeEventEmitter } from '../lib/patchNativeEventEmitter';
import { AuthProvider, useAuth } from "../lib/authContext";
import { ThemeProvider, useTheme } from "../lib/themeContext";
import FirstInstallLogo from "../components/FirstInstallLogo";
import { TutorialProvider, useTutorial } from "../lib/tutorialContext";
import { FriendsProvider } from "../lib/friendsContext";
import AuthScreen from "../components/auth/AuthScreen";
import LoadingScreen from "../components/auth/LoadingScreen";
import TutorialScreen from "../components/onboarding/TutorialScreen";
import { NotificationHandler } from "../components/NotificationHandler";
import { ToastProvider, ToastContainer } from "../components/toast";
import ToastServiceProvider from "../components/toast/ToastServiceProvider";
import { useNotifications } from "../hooks/useNotifications";

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors, isDark } = useTheme();
  const { hasSeenTutorial, setHasSeenTutorial, isLoading: tutorialLoading } = useTutorial();
  const [showSplash, setShowSplash] = useState(true);
  
  // Initialize notifications when user is authenticated
  useNotifications();

  // While checking initial state, render the LoadingScreen (avoid a blank app)
  if (showSplash) {
    return (
      <FirstInstallLogo
        onFinish={() => setShowSplash(false)}
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
              <FriendsProvider>
                <RootLayoutNav />
              </FriendsProvider>
            </ToastServiceProvider>
          </ToastProvider>
        </TutorialProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

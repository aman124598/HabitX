import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Theme from "../lib/theme";
import { installGlobalErrorHandler } from '../lib/installGlobalErrorHandler';
import { patchNativeEventEmitter } from '../lib/patchNativeEventEmitter';
import { AuthProvider } from "../lib/authContext";
import { ThemeProvider, useTheme } from "../lib/themeContext";
import { TutorialProvider, useTutorial } from "../lib/tutorialContext";
import AuthScreen from "../components/auth/AuthScreen";
import LoadingScreen from "../components/auth/LoadingScreen";
import TutorialScreen from "../components/onboarding/TutorialScreen";
import { NotificationHandler } from "../components/NotificationHandler";
import { useNotifications } from "../hooks/useNotifications";
import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';

const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('SecureStore get item error: ', error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env'
  );
}

function RootLayoutNav() {
  const { isLoaded, isSignedIn } = useAuth();
  const { colors, isDark } = useTheme();
  const { hasSeenTutorial, setHasSeenTutorial, isLoading: tutorialLoading } = useTutorial();

  useNotifications();

  if (!isLoaded || tutorialLoading) {
    return <LoadingScreen />;
  }

  if (!isSignedIn) {
    return <AuthScreen />;
  }

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
          headerStyle: { backgroundColor: colors.brand.primary },
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
          options={{ headerShown: true, title: "Habit Details", presentation: "modal" }}
        />
      </Stack>
    </NotificationHandler>
  );
}

export default function RootLayout() {
  try {
    try { patchNativeEventEmitter(); } catch { /* best-effort */ }
    installGlobalErrorHandler();
  } catch { /* ignore */ }

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ClerkLoaded>
        <ThemeProvider>
          <AuthProvider>
            <TutorialProvider>
              <RootLayoutNav />
            </TutorialProvider>
          </AuthProvider>
        </ThemeProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

import { useEffect, useState } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';
import {
  useFonts,
  Sora_400Regular,
  Sora_500Medium,
  Sora_600SemiBold,
  Sora_700Bold,
} from '@expo-google-fonts/sora';
import { AuthProvider, useAuth } from './ctx';
import { Colors } from '@/constants/theme';
import { AnimatedSplash } from '@/components/AnimatedSplash';

SplashScreen.preventAutoHideAsync();

export const WELCOME_SEEN_KEY = 'uniconnect_has_seen_welcome';

function InitialLayout() {
  const { userToken, isLoading, userData } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null);
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
  });

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  // Read first-visit flag (never cleared on logout or session expiry)
  useEffect(() => {
    SecureStore.getItemAsync(WELCOME_SEEN_KEY)
      .then((value) => setHasSeenWelcome(value === 'true'))
      .catch(() => setHasSeenWelcome(false));
  }, []);

  // If a user is already logged in (e.g., existing install), ensure welcome is marked seen
  useEffect(() => {
    if (userToken && hasSeenWelcome === false) {
      setHasSeenWelcome(true);
      SecureStore.setItemAsync(WELCOME_SEEN_KEY, 'true').catch(() => {});
    }
  }, [userToken, hasSeenWelcome]);

  // Handle all 5 launch & session-expiry states
  useEffect(() => {
    if (!fontsLoaded || isLoading || hasSeenWelcome === null) return;

    const inAuthGroup = segments[0] === '(auth)' || segments[0] === 'login';
    const isOnboarded = Boolean(userData?.is_onboarded);
    const inSignupFlow = segments[0] === '(auth)' && segments[1] === 'signup';

    if (!userToken && !inAuthGroup) {
      if (hasSeenWelcome) {
        // Returning logged-out OR session expired
        router.replace('/(auth)/login' as any);
      } else {
        // First-time visitor
        router.replace('/(auth)/welcome' as any);
      }
    } else if (userToken && !isOnboarded && !inSignupFlow) {
      // Logged-in, incomplete onboarding
      router.replace('/(auth)/signup/onboard' as any);
    } else if (userToken && inAuthGroup && isOnboarded) {
      // Logged-in user
      router.replace('/(home)' as any);
    }

    setIsNavigationReady(true);
  }, [userToken, isLoading, fontsLoaded, hasSeenWelcome, segments, userData]);

  // Keep native static splash up until fonts & initial storage check finish
  if (!fontsLoaded || hasSeenWelcome === null) {
    return null;
  }

  return (
    <View style={[styles.outer, { backgroundColor: theme.background }]}>
      <View style={[styles.inner, { backgroundColor: theme.background }]}>
        <Slot />
      </View>

      {/* Branded animated splash overlay shown on cold launch across all states */}
      {!splashDone && (
        <AnimatedSplash
          isReady={!isLoading && isNavigationReady}
          onFinish={() => setSplashDone(true)}
        />
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    alignItems: 'center',
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: undefined,
  },
});

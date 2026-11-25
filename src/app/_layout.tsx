import { useEffect, useState } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import { Redirect, Slot, useSegments } from 'expo-router';
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
// Set to false later, true for now to inspect page
const ALWAYS_SHOW_WELCOME = true;

function InitialLayout() {
  const { userToken, isLoading, userData, justLoggedOut } = useAuth();
  const segments = useSegments();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null);
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

  useEffect(() => {
    SecureStore.getItemAsync(WELCOME_SEEN_KEY)
      .then((value) => setHasSeenWelcome(value === 'true'))
      .catch(() => setHasSeenWelcome(false));
  }, []);

  useEffect(() => {
    if (userToken && hasSeenWelcome === false) {
      setHasSeenWelcome(true);
      SecureStore.setItemAsync(WELCOME_SEEN_KEY, 'true').catch(() => {});
    }
  }, [userToken, hasSeenWelcome]);

  if (!fontsLoaded || hasSeenWelcome === null) {
    return null;
  }

  const inAuthGroup = segments[0] === '(auth)';
  const inHomeGroup = segments[0] === '(home)';
  const isOnboarded = Boolean(userData?.is_onboarded);
  const inSignupFlow = segments[0] === '(auth)' && segments[1] === 'signup';

  let redirectHref: string | null = null;

  if (!isLoading) {
    if (!userToken && !inAuthGroup) {
      if (justLoggedOut) {
        redirectHref = '/(auth)/signup';
      } else if (ALWAYS_SHOW_WELCOME || !hasSeenWelcome) {
        redirectHref = '/(auth)/welcome';
      } else {
        redirectHref = '/(auth)/login';
      }
    } else if (userToken && !isOnboarded && !inSignupFlow) {
      redirectHref = '/(auth)/signup/onboard';
    } else if (userToken && isOnboarded && !inHomeGroup) {
      redirectHref = '/';
    }
  }

  return (
    <View style={[styles.outer, { backgroundColor: theme.background }]}>
      <View style={[styles.inner, { backgroundColor: theme.background }]}>
        <Slot />
        {redirectHref && <Redirect href={redirectHref as any} />}
      </View>

      {!splashDone && (
        <AnimatedSplash
          isReady={!isLoading}
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
  },
});

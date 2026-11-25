import { useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from './ctx';

function InitialLayout() {
  const { userToken, isLoading, userData } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)' || segments[0] === 'login';
    const isOnboarded = Boolean(userData?.is_onboarded);
    const inOnboardRoute = segments[0] === '(auth)' && segments[1] === 'signup' && segments[2] === 'onboard';
    const inSignupFlow = segments[0] === '(auth)' && segments[1] === 'signup';

    if (!userToken && !inAuthGroup) {
      router.replace('/(auth)/login' as any);
    } 
    else if (userToken && !isOnboarded && !inSignupFlow) {
      router.replace('/(auth)/signup/onboard' as any);
    }
				else if (userToken && inAuthGroup && isOnboarded) {
      router.replace('/(home)' as any);
    }
  }, [userToken, isLoading, segments, userData]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4F5A" />
      </View>
    );
  }

  return (
    <View style={styles.outer}>
      <View style={styles.inner}>
         <Slot />
      </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  outer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: undefined,
    backgroundColor: '#000000',
  },
});
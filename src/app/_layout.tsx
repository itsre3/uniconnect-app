import { useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from './ctx';

function InitialLayout() {
  const { userToken, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)' || segments[0] === 'login';

    if (!userToken && !inAuthGroup) {
      router.replace('/(auth)/login' as any);
    } else if (userToken && inAuthGroup) {
      router.replace('/(tabs)' as any);
    }
  }, [userToken, isLoading, segments]);

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
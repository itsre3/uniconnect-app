import { useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function SignupLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="onboard" />
      <Stack.Screen name="student" />
      <Stack.Screen name="jambite" />
      <Stack.Screen name="company" />
    </Stack>
  );
}

import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AuthTabs from '@/components/login-tab';

export default function AuthLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'light' ? 'light' : 'dark'];

  return (
    <>
      <AnimatedSplashOverlay />
      <AuthTabs />
    </>
  );
}
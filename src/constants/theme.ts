import '@/global.css';

import { Platform } from 'react-native';

export const Brand = {
  primaryPurple: '#40239A',
  secondaryPurple: '#7557D9',
  accentLavender: '#A99AEF',
  lightBackground: '#F8F7FC',
  darkBackground: '#14121D',
} as const;

export const Colors = {
  light: {
    text: '#14121D',
    background: '#F8F7FC',
    backgroundElement: '#EFEDF8',
    backgroundSelected: '#E2DEF3',
    textSecondary: '#5E5B73',
    tint: '#40239A',
    primary: '#40239A',
    secondary: '#7557D9',
    accent: '#A99AEF',
    logoLeft: '#40239A',
    logoRight: '#A99AEF',
    border: '#E4E1F0',
  },
  dark: {
    text: '#F8F7FC',
    background: '#14121D',
    backgroundElement: '#1E1B2E',
    backgroundSelected: '#2A263D',
    textSecondary: '#A8A4BD',
    tint: '#A99AEF',
    primary: '#7557D9',
    secondary: '#40239A',
    accent: '#A99AEF',
    logoLeft: '#FFFFFF',
    logoRight: '#A99AEF',
    border: '#2B273E',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = {
  sans: 'Sora_400Regular',
  sansMedium: 'Sora_500Medium',
  sansSemiBold: 'Sora_600SemiBold',
  sansBold: 'Sora_700Bold',
  serif: Platform.OS === 'ios' ? 'ui-serif' : 'serif',
  rounded: Platform.OS === 'ios' ? 'ui-rounded' : 'sans-serif',
  mono: Platform.OS === 'ios' ? 'ui-monospace' : 'monospace',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

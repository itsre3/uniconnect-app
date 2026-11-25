import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { UniConnectLogo } from '@/components/UniConnectLogo';
import { WELCOME_SEEN_KEY } from '../_layout';

const SLIDES = [
  {
    title: 'Your campus.\nYour people.',
    subtitle:
      'Meet students, discover opportunities, share ideas and stay connected.',
  },
  {
    title: 'Verified campus\ncommunity.',
    subtitle:
      'Connect safely with fellow students across faculties, hostels, and study groups.',
  },
  {
    title: 'Never miss a\ncampus moment.',
    subtitle:
      'Stay updated on department announcements, events, and academic resources.',
  },
] as const;

function CampusIllustration({ isDark }: { isDark: boolean }) {
  const leftStudent = isDark ? '#7557D9' : '#40239A';
  const rightStudent = isDark ? '#A99AEF' : '#8E7CE6';
  const centerSkin = isDark ? '#DCD6F7' : '#C8BEF5';
  const centerHair = isDark ? '#F8F7FC' : '#14121D';
  const sparkColor = isDark ? '#A99AEF' : '#40239A';

  return (
    <Svg width={240} height={150} viewBox="0 0 240 150" fill="none">
      {/* Accent lines above center student */}
      <Path
        d="M120 14V26M105 19L111 29M135 19L129 29"
        stroke={sparkColor}
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Left Student (arms raised) */}
      <Circle cx="66" cy="58" r="13" fill={leftStudent} />
      <Path
        d="M28 48C33 65 44 76 54 78H78C88 76 99 65 104 48"
        stroke={leftStudent}
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M48 76H84L88 132H44L48 76Z" fill={leftStudent} />

      {/* Right Student (arms raised) */}
      <Circle cx="174" cy="58" r="13" fill={rightStudent} />
      <Path
        d="M136 48C141 65 152 76 162 78H186C196 76 207 65 212 48"
        stroke={rightStudent}
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M156 76H192L196 132H152L156 76Z" fill={rightStudent} />

      {/* Center Student (foreground) */}
      <Circle cx="120" cy="44" r="9" fill={centerHair} />
      <Circle cx="120" cy="64" r="15" fill={centerSkin} />
      <Path
        d="M105 61C105 52 112 47 120 47C128 47 135 52 135 61C130 57 110 57 105 61Z"
        fill={centerHair}
      />
      <Rect x="94" y="84" width="52" height="48" rx="22" fill={centerSkin} />
    </Svg>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  const [activeSlide, setActiveSlide] = useState(0);

  const completeWelcome = async (
    destination: '/(auth)/signup' | '/(auth)/login'
  ) => {
    try {
      await SecureStore.setItemAsync(WELCOME_SEEN_KEY, 'true');
    } catch {
      // Ignore storage write errors and still let user proceed
    }
    router.replace(destination as any);
  };

  const current = SLIDES[activeSlide];

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <View style={styles.container}>
        {/* Top Brand Symbol */}
        <View style={styles.header}>
          <UniConnectLogo
            size={60}
            leftColor={theme.logoLeft}
            rightColor={theme.logoRight}
          />
        </View>

        {/* Copy & Illustration */}
        <View style={styles.body}>
          <Text style={[styles.title, { color: theme.text }]}>
            {current.title}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {current.subtitle}
          </Text>

          <View style={styles.illustrationContainer}>
            <CampusIllustration isDark={isDark} />
          </View>

          {/* Interactive Slide Dots */}
          <View style={styles.dotsRow}>
            {SLIDES.map((_, index) => {
              const isActive = index === activeSlide;
              return (
                <Pressable
                  key={index}
                  hitSlop={10}
                  onPress={() => setActiveSlide(index)}
                  style={[
                    styles.dot,
                    {
                      width: isActive ? 18 : 6,
                      backgroundColor: isActive
                        ? theme.primary
                        : theme.backgroundSelected,
                    },
                  ]}
                />
              );
            })}
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={styles.footer}>
          <Pressable
            onPress={() => completeWelcome('/(auth)/signup')}
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: theme.primary,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Text style={styles.primaryButtonText}>Get Started  →</Text>
          </Pressable>

          <View style={styles.loginRow}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <Pressable
              hitSlop={8}
              onPress={() => completeWelcome('/(auth)/login')}
            >
              <Text style={[styles.loginLink, { color: theme.tint }]}>
                Log in
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.four + 4,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.five,
  },
  body: {
    alignItems: 'center',
    paddingHorizontal: Spacing.one,
  },
  title: {
    fontFamily: Fonts.sansBold,
    fontSize: 28,
    lineHeight: 35,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: 14.5,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: Spacing.three,
  },
  illustrationContainer: {
    marginTop: Spacing.five,
    marginBottom: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  footer: {
    paddingBottom: Spacing.four,
    alignItems: 'center',
  },
  primaryButton: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  footerText: {
    fontFamily: Fonts.sans,
    fontSize: 13.5,
  },
  loginLink: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13.5,
  },
});

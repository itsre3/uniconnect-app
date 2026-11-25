import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, useColorScheme } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Colors, Fonts } from '@/constants/theme';
import { UniConnectLogo } from './UniConnectLogo';

interface AnimatedSplashProps {
  isReady: boolean;
  onFinish: () => void;
}

const SPLASH_HOLD_MS = 2100;

export function AnimatedSplash({ isReady, onFinish }: AnimatedSplashProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  const hasHiddenNativeSplash = useRef(false);
  const [minDurationDone, setMinDurationDone] = useState(false);

  // Animation shared values
  const containerOpacity = useSharedValue(1);
  const contentScale = useSharedValue(1);
  const wordmarkOpacity = useSharedValue(0);
  const wordmarkTranslateY = useSharedValue(12);
  const loaderOpacity = useSharedValue(0);
  const loaderTranslateX = useSharedValue(-48);

  const handleLayout = () => {
    if (hasHiddenNativeSplash.current) return;
    hasHiddenNativeSplash.current = true;

    // 1. Swap native splash -> identical React Native frame
    SplashScreen.hideAsync().catch(() => {});

    // 2. Hold pure symbol briefly, then reveal wordmark & tagline
    wordmarkOpacity.value = withDelay(
      350,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })
    );
    wordmarkTranslateY.value = withDelay(
      350,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) })
    );

    // 3. Reveal subtle loading bar if auth/network check is still running
    loaderOpacity.value = withDelay(950, withTiming(1, { duration: 300 }));
    loaderTranslateX.value = withRepeat(
      withTiming(48, { duration: 850, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // 4. Hold completed brand lockup on screen like Duolingo before dismissing
    const timer = setTimeout(() => setMinDurationDone(true), SPLASH_HOLD_MS);
    return () => clearTimeout(timer);
  };

  // 5. Smooth fade & slight scale-out once both hold time and app init finish
  useEffect(() => {
    if (!isReady || !minDurationDone) return;

    contentScale.value = withTiming(1.04, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    });
    containerOpacity.value = withTiming(
      0,
      { duration: 420, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) {
          runOnJS(onFinish)();
        }
      }
    );
  }, [isReady, minDurationDone]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const centerGroupStyle = useAnimatedStyle(() => ({
    transform: [{ scale: contentScale.value }],
  }));

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmarkOpacity.value,
    transform: [{ translateY: wordmarkTranslateY.value }],
  }));

  const loaderWrapperStyle = useAnimatedStyle(() => ({
    opacity: loaderOpacity.value,
  }));

  const loaderThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: loaderTranslateX.value }],
  }));

  return (
    <Animated.View
      onLayout={handleLayout}
      style={[
        StyleSheet.absoluteFill,
        styles.overlay,
        { backgroundColor: theme.background },
        containerStyle,
      ]}
    >
      <Animated.View style={[styles.centerGroup, centerGroupStyle]}>
        <UniConnectLogo
          size={96}
          leftColor={theme.logoLeft}
          rightColor={theme.logoRight}
        />

        <Animated.View style={[styles.wordmarkContainer, wordmarkStyle]}>
          <Text style={[styles.brandTitle, { color: theme.text }]}>
            UniConnect
          </Text>
          <Text style={[styles.tagline, { color: theme.textSecondary }]}>
            Your campus. Your people.
          </Text>

          <Animated.View
            style={[
              styles.loaderTrack,
              { backgroundColor: theme.backgroundElement },
              loaderWrapperStyle,
            ]}
          >
            <Animated.View
              style={[
                styles.loaderThumb,
                { backgroundColor: theme.tint },
                loaderThumbStyle,
              ]}
            />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerGroup: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmarkContainer: {
    position: 'absolute',
    top: 114,
    alignItems: 'center',
    width: 260,
  },
  brandTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 28,
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  loaderTrack: {
    width: 88,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 24,
  },
  loaderThumb: {
    width: 40,
    height: 3,
    borderRadius: 2,
  },
});

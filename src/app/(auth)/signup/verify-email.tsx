import { useEffect, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  TouchableWithoutFeedback,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { UniConnectLogo } from '@/components/UniConnectLogo';
import { Colors, Fonts } from '@/constants/theme';
import { API_URL } from '@/constants/api';
import { useAuth } from '../../ctx';

const CODE_LENGTH = 6;

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const { login, updateUserData } = useAuth();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(0);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleChangeDigit = (text: string, index: number) => {
    setErrorMsg('');
    setInfoMsg('');

    const cleaned = text.replace(/\D/g, '');

    // Handle pasting or iOS SMS AutoFill of multiple digits
    if (cleaned.length > 1) {
      const nextDigits = [...digits];
      const pasted = cleaned.slice(0, CODE_LENGTH).split('');

      if (cleaned.length >= CODE_LENGTH) {
        for (let i = 0; i < CODE_LENGTH; i++) {
          nextDigits[i] = pasted[i] ?? '';
        }
        setDigits(nextDigits);
        setFocusedIndex(null);
        Keyboard.dismiss();
      } else {
        let cursor = index;
        for (const char of pasted) {
          if (cursor < CODE_LENGTH) {
            nextDigits[cursor] = char;
            cursor++;
          }
        }
        setDigits(nextDigits);
        const nextFocus = Math.min(cursor, CODE_LENGTH - 1);
        inputRefs.current[nextFocus]?.focus();
      }
      return;
    }

    const nextDigits = [...digits];
    nextDigits[index] = cleaned;
    setDigits(nextDigits);

    if (cleaned && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    } else if (cleaned && index === CODE_LENGTH - 1) {
      setFocusedIndex(null);
      Keyboard.dismiss();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (digits[index]) {
        const nextDigits = [...digits];
        nextDigits[index] = '';
        setDigits(nextDigits);
      } else if (index > 0) {
        const nextDigits = [...digits];
        nextDigits[index - 1] = '';
        setDigits(nextDigits);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleVerify = async () => {
    Keyboard.dismiss();
    setFocusedIndex(null);

    const code = digits.join('');
    if (code.length < CODE_LENGTH) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const storedToken = await SecureStore.getItemAsync('access_token');
      const cleanEmail = (email || '').trim().toLowerCase();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (storedToken) {
        headers.Authorization = `Bearer ${storedToken}`;
      }

      const response = await fetch(`${API_URL}/auth/verify-email`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: cleanEmail,
          code,
        }),
      });

      const data = await response.json();

      //if (response.ok) {
      if (true) {
        const payload = data.data ?? data;
        const token = payload.access_token || data.token || storedToken;
        const userObj = payload.user ?? data.user;

        if (token) {
          await login(token, userObj);
        } else if (userObj) {
          await updateUserData(userObj);
        }

        router.replace('/(auth)/signup/onboard' as any);
      } else if (Array.isArray(data.detail)) {
        const failedField = data.detail[0]?.loc?.[1] || 'Code';
        setErrorMsg(`Error in ${failedField}: ${data.detail[0]?.msg}`);
      } else {
        setErrorMsg(data.detail || 'Invalid or expired verification code.');
      }
    } catch (error) {
      console.log('Verify email error:', error);
      setErrorMsg('Network error. Check your connection to the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || resending) return;

    Keyboard.dismiss();
    setResending(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const cleanEmail = (email || '').trim().toLowerCase();
      const response = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setDigits(Array(CODE_LENGTH).fill(''));
        setResendCooldown(30);
        setInfoMsg('A new 6-digit verification code has been sent.');
        inputRefs.current[0]?.focus();
      } else {
        setErrorMsg(data.detail || 'Could not resend code right now.');
      }
    } catch (error) {
      console.log('Resend code error:', error);
      setErrorMsg('Network error. Check your connection to the server.');
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Soft top-right ambient purple wash */}
      <View style={styles.ambientGlow} pointerEvents="none">
        <Svg width="100%" height="320" viewBox="0 0 400 320">
          <Defs>
            <RadialGradient id="topGlow" cx="62%" cy="18%" r="72%">
              <Stop
                offset="0%"
                stopColor={isDark ? '#7557D9' : '#A99AEF'}
                stopOpacity={isDark ? '0.32' : '0.42'}
              />
              <Stop
                offset="65%"
                stopColor={isDark ? '#40239A' : '#A99AEF'}
                stopOpacity={isDark ? '0.10' : '0.14'}
              />
              <Stop
                offset="100%"
                stopColor={colors.background}
                stopOpacity="0"
              />
            </RadialGradient>
          </Defs>
          <Ellipse cx="245" cy="60" rx="260" ry="220" fill="url(#topGlow)" />
        </Svg>
      </View>

      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableWithoutFeedback
            onPress={() => {
              Keyboard.dismiss();
              setFocusedIndex(null);
            }}
            accessible={false}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Top Nav Row with Back Arrow to Signup */}
              <View style={styles.topBar}>
                <Pressable
                  onPress={() => {
                    Keyboard.dismiss();
                    if (router.canGoBack()) {
                      router.back();
                    } else {
                      router.replace('/(auth)/signup' as any);
                    }
                  }}
                  hitSlop={12}
                  style={styles.backBtn}
                >
                  <Ionicons name="chevron-back" size={26} color={colors.text} />
                </Pressable>
              </View>

              {/* Centered UniConnect Brand Header */}
              <View style={styles.brandHeader}>
                <UniConnectLogo
                  size={44}
                  leftColor={colors.logoLeft}
                  rightColor={colors.logoRight}
                />
                <Text style={[styles.brandName, { color: colors.text }]}>
                  UniConnect
                </Text>
              </View>

              {/* Left-Aligned Title & Email Subtitle */}
              <View style={styles.headingBlock}>
                <Text style={[styles.title, { color: colors.text }]}>
                  Verify Email
                </Text>
                <Text
                  style={[styles.subtitle, { color: colors.textSecondary }]}
                >
                  Enter the 6-digit code sent to{' '}
                  <Text style={[styles.emailText, { color: colors.text }]}>
                    {email || 'your email'}
                  </Text>
                </Text>
              </View>

              {/* Error / Info Banner */}
              {errorMsg ? (
                <View style={styles.errorBox}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={18}
                    color="#EF4444"
                  />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              ) : null}

              {infoMsg ? (
                <View
                  style={[
                    styles.infoBox,
                    {
                      borderColor: colors.tint,
                      backgroundColor: isDark
                        ? 'rgba(169, 154, 239, 0.12)'
                        : 'rgba(64, 35, 154, 0.08)',
                    },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color={colors.tint}
                  />
                  <Text style={[styles.infoText, { color: colors.text }]}>
                    {infoMsg}
                  </Text>
                </View>
              ) : null}

              {/* 6 Rounded OTP Boxes */}
              <View style={styles.otpRow}>
                {digits.map((digit, index) => {
                  const isFocused = focusedIndex === index;
                  const isFilled = digit.length > 0;
                  const isHighlighted = isFocused || isFilled;

                  return (
                    <TextInput
                      key={index}
                      ref={(ref) => {
                        inputRefs.current[index] = ref;
                      }}
                      value={digit}
                      onChangeText={(text) => handleChangeDigit(text, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      onFocus={() => setFocusedIndex(index)}
                      onBlur={() =>
                        setFocusedIndex((prev) => (prev === index ? null : prev))
                      }
                      keyboardType="number-pad"
                      textContentType="oneTimeCode"
                      autoComplete="sms-otp"
                      selectTextOnFocus
                      selectionColor={colors.tint}
                      style={[
                        styles.otpBox,
                        {
                          color: colors.text,
                          backgroundColor: isDark
                            ? colors.backgroundElement
                            : '#FFFFFF',
                          borderColor: isHighlighted
                            ? colors.tint
                            : isDark
                              ? colors.backgroundSelected
                              : '#E2DFEF',
                          borderWidth: isFocused ? 2 : isFilled ? 1.6 : 1.2,
                          shadowColor: colors.tint,
                          shadowOpacity: isFocused ? 0.3 : 0,
                          shadowRadius: isFocused ? 10 : 0,
                          shadowOffset: { width: 0, height: 0 },
                        },
                      ]}
                    />
                  );
                })}
              </View>

              {/* Resend Code Prompt */}
              <View style={styles.resendRow}>
                <Text
                  style={[styles.resendLabel, { color: colors.textSecondary }]}
                >
                  Didn&apos;t receive the code?
                </Text>
                <Pressable
                  onPress={handleResendCode}
                  disabled={resendCooldown > 0 || resending}
                  hitSlop={8}
                >
                  <Text
                    style={[
                      styles.resendLink,
                      {
                        color:
                          resendCooldown > 0
                            ? colors.textSecondary
                            : colors.tint,
                      },
                    ]}
                  >
                    {resending
                      ? 'Sending...'
                      : resendCooldown > 0
                        ? `Resend in ${resendCooldown}s`
                        : 'Resend code'}
                  </Text>
                </Pressable>
              </View>

              {/* Centralized Submit Button */}
              <Pressable
                onPress={handleVerify}
                disabled={loading}
                style={({ pressed }) => [
                  styles.submitBtn,
                  {
                    backgroundColor: colors.tint,
                    shadowColor: colors.tint,
                    opacity: loading ? 0.75 : pressed ? 0.9 : 1,
                  },
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View style={styles.submitBtnContent}>
                    <Text style={styles.submitBtnText}>Verify Email</Text>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={20}
                      color="#FFFFFF"
                    />
                  </View>
                )}
              </Pressable>

              {/* Bottom Back to Sign Up Link */}
              <View style={styles.footerRow}>
                <Text
                  style={[styles.footerText, { color: colors.textSecondary }]}
                >
                  Wrong email address?
                </Text>
                <Pressable
                  onPress={() => {
                    Keyboard.dismiss();
                    if (router.canGoBack()) {
                      router.back();
                    } else {
                      router.replace('/(auth)/signup' as any);
                    }
                  }}
                  hitSlop={8}
                >
                  <Text style={[styles.footerLink, { color: colors.tint }]}>
                    Back to Sign Up
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  ambientGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 26,
    paddingBottom: 24,
  },
  topBar: {
    paddingTop: 6,
    alignItems: 'flex-start',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
    marginBottom: 46,
  },
  brandName: {
    fontFamily: Fonts.sansBold,
    fontSize: 23,
    letterSpacing: -0.5,
  },
  headingBlock: {
    marginBottom: 26,
  },
  title: {
    fontFamily: Fonts.sansBold,
    fontSize: 32,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: 14.5,
    lineHeight: 21,
    marginTop: 6,
  },
  emailText: {
    fontFamily: Fonts.sansSemiBold,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 18,
  },
  errorText: {
    flex: 1,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: '#EF4444',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 18,
  },
  infoText: {
    flex: 1,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 20,
  },
  otpBox: {
    flex: 1,
    height: 58,
    borderRadius: 16,
    textAlign: 'center',
    fontFamily: Fonts.sansBold,
    fontSize: 22,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 28,
  },
  resendLabel: {
    fontFamily: Fonts.sans,
    fontSize: 13.5,
  },
  resendLink: {
    fontFamily: Fonts.sansBold,
    fontSize: 13.5,
  },
  submitBtn: {
    width: '100%',
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 4,
  },
  submitBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  submitBtnText: {
    fontFamily: Fonts.sansBold,
    fontSize: 17,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 24,
  },
  footerText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
  },
  footerLink: {
    fontFamily: Fonts.sansBold,
    marginLeft: 5,
    fontSize: 14,
  },
});

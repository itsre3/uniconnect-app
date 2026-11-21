import { useEffect, useRef, useState, ComponentRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput as RNTextInput,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { API_URL } from '@/constants/api';

const CODE_LENGTH = 6;

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [secondsLeft, setSecondsLeft] = useState(45);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  //const inputs = useRef<Array<RNTextInput | null>>([]);
  const inputs = useRef<Array<ComponentRef<typeof RNTextInput> | null>>([]);


  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const handleChange = (text: string, index: number) => {
    const clean = text.replace(/[^0-9]/g, '');

    // Handle paste or iOS Mail/SMS oneTimeCode AutoFill
    if (clean.length > 1) {
      const chars = clean.slice(0, CODE_LENGTH).split('');
      const next = [...code];
      chars.forEach((char, idx) => {
        next[idx] = char;
      });
      setCode(next);
      const nextFocus = Math.min(chars.length, CODE_LENGTH - 1);
      inputs.current[nextFocus]?.focus();
      return;
    }

    const next = [...code];
    next[index] = clean;
    setCode(next);

    if (clean && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length < CODE_LENGTH) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const response = await fetch(`${API_URL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email?.trim().toLowerCase(),
          code: fullCode,
        }),
      });

      const data = await response.json();

      //if (response.ok) {
      if (true) {
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

  const handleResend = async () => {
    if (!email || resending) return;

    setResending(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const response = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSecondsLeft(45);
        setInfoMsg('A new verification code has been sent.');
      } else {
        setErrorMsg(data.detail || 'Could not resend code.');
      }
    } catch (error) {
      console.log('Resend code error:', error);
      setErrorMsg('Network error. Check your connection to the server.');
    } finally {
      setResending(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Back Button */}
            <Pressable
              onPress={() => router.back()}
              style={[
                styles.backBtn,
                {
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.backgroundSelected,
                },
              ]}
              hitSlop={10}
            >
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>

            {/* Safe Card Box */}
            <View
              style={[
                styles.cardBox,
                {
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.backgroundSelected,
                },
              ]}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: colors.backgroundSelected },
                ]}
              >
                <Ionicons
                  name="mail-open-outline"
                  size={26}
                  color={colors.tint}
                />
              </View>

              <ThemedText type="title" style={styles.title}>
                Verify Email
              </ThemedText>

              <ThemedText
                style={[styles.subtitle, { color: colors.textSecondary }]}
              >
                Enter the 6-digit code sent to{'\n'}
                <ThemedText style={{ fontWeight: '700' }}>
                  {email || 'your email address'}
                </ThemedText>
              </ThemedText>

              {errorMsg ? (
                <View style={[styles.errorBox, { borderColor: colors.tint }]}>
                  <ThemedText style={[styles.errorText, { color: colors.tint }]}>
                    {errorMsg}
                  </ThemedText>
                </View>
              ) : null}

              {infoMsg ? (
                <View
                  style={[
                    styles.infoBox,
                    { borderColor: colors.backgroundSelected },
                  ]}
                >
                  <ThemedText style={styles.infoText}>{infoMsg}</ThemedText>
                </View>
              ) : null}

              {/* Safe OTP Input Box */}
              <View
                style={[
                  styles.otpSafeBox,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.backgroundSelected,
                  },
                ]}
              >
                <View style={styles.otpRow}>
                  {code.map((digit, index) => (
                    <RNTextInput
                      key={index}
                      ref={(ref) => {
                        inputs.current[index] = ref;
                      }}
                      value={digit}
                      onChangeText={(text) => handleChange(text, index)}
                      onKeyPress={({ nativeEvent }) =>
                        handleKeyPress(nativeEvent.key, index)
                      }
                      keyboardType="number-pad"
                      textContentType="oneTimeCode"
                      autoComplete="one-time-code"
                      maxLength={index === 0 ? CODE_LENGTH : 1}
                      selectTextOnFocus
                      style={[
                        styles.otpCell,
                        {
                          backgroundColor: colors.backgroundElement,
                          borderColor: digit
                            ? colors.tint
                            : colors.backgroundSelected,
                          color: colors.text,
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>

              <Button
                mode="contained"
                onPress={handleVerify}
                loading={loading}
                disabled={loading}
                buttonColor={colors.tint}
                textColor="#ffffff"
                style={styles.button}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                Verify Code
              </Button>

              <View style={styles.resendRow}>
                <ThemedText
                  style={[styles.resendText, { color: colors.textSecondary }]}
                >
                  Didn&apos;t receive the code?
                </ThemedText>
                {secondsLeft > 0 ? (
                  <ThemedText style={styles.timerText}>
                    Resend in {secondsLeft}s
                  </ThemedText>
                ) : (
                  <Pressable
                    hitSlop={8}
                    disabled={resending}
                    onPress={handleResend}
                  >
                    <ThemedText
                      style={[styles.resendLink, { color: colors.tint }]}
                    >
                      {resending ? 'Sending...' : 'Resend'}
                    </ThemedText>
                  </Pressable>
                )}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: Spacing.four,
  },
  backBtn: {
    position: 'absolute',
    top: 12,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBox: {
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 28,
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  errorBox: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    backgroundColor: 'rgba(255, 79, 90, 0.08)',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  infoBox: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  otpSafeBox: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 20,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  otpCell: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  button: {
    width: '100%',
    borderRadius: 999,
  },
  buttonContent: {
    height: 50,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  resendText: {
    fontSize: 13.5,
  },
  timerText: {
    fontSize: 13.5,
    fontWeight: '600',
    marginLeft: 5,
  },
  resendLink: {
    fontSize: 13.5,
    fontWeight: '700',
    marginLeft: 5,
  },
});

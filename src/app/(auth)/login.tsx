import { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { UniConnectLogo } from '@/components/UniConnectLogo';
import { Colors, Fonts } from '@/constants/theme';
import { API_URL } from '@/constants/api';
import { useAuth } from '../ctx';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(
    null
  );
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    Keyboard.dismiss();
    setFocusedField(null);

    if (!email.trim() || !password) {
      setErrorMsg('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const cleanEmail = email.trim().toLowerCase();
      const formData = new URLSearchParams();
      formData.append('username', cleanEmail);
      formData.append('password', password);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      const data = await response.json();

      if (response.ok) {
        const token = data.access_token || data.token;

        if (!token) {
          setErrorMsg('Login succeeded, but no access token was returned.');
          return;
        }

        await login(token, data.user);
      } else if (Array.isArray(data.detail)) {
        const failedField = data.detail[0]?.loc?.[1] || 'Field';
        setErrorMsg(`Error in ${failedField}: ${data.detail[0]?.msg}`);
      } else {
        setErrorMsg(data.detail || 'Invalid email or password.');
      }
    } catch (error) {
      console.log('Login error:', error);
      setErrorMsg('Network error. Check your connection to the server.');
    } finally {
      setLoading(false);
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
              setFocusedField(null);
            }}
            accessible={false}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Top Nav Row with Back Arrow */}
              <View style={styles.topBar}>
                <Pressable
                  onPress={() => {
                    Keyboard.dismiss();
                    if (router.canGoBack()) {
                      router.back();
                    } else {
                      router.replace('/(auth)/welcome' as any);
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

              {/* Left-Aligned Title & Welcome Subtitle */}
              <View style={styles.headingBlock}>
                <Text style={[styles.title, { color: colors.text }]}>
                  Login
                </Text>
                <Text
                  style={[styles.subtitle, { color: colors.textSecondary }]}
                >
                  Welcome back, sign in to continue
                </Text>
              </View>

              {/* Error Banner */}
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

              {/* Pill-Shaped Inputs with Focus Illumination */}
              <View style={styles.formGroup}>
                <View
                  style={[
                    styles.pillInputWrapper,
                    {
                      backgroundColor: isDark
                        ? colors.backgroundElement
                        : '#FFFFFF',
                      borderColor:
                        focusedField === 'email'
                          ? colors.tint
                          : isDark
                            ? colors.backgroundSelected
                            : '#E2DFEF',
                      borderWidth: focusedField === 'email' ? 1.8 : 1.2,
                      shadowColor: colors.tint,
                      shadowOpacity: focusedField === 'email' ? 0.28 : 0,
                      shadowRadius: focusedField === 'email' ? 10 : 0,
                      shadowOffset: { width: 0, height: 0 },
                    },
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={19}
                    color={
                      focusedField === 'email'
                        ? colors.tint
                        : colors.textSecondary
                    }
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() =>
                      setFocusedField((prev) =>
                        prev === 'email' ? null : prev
                      )
                    }
                    placeholder="Email address"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="emailAddress"
                    returnKeyType="next"
                    style={[styles.input, { color: colors.text }]}
                  />
                </View>

                <View
                  style={[
                    styles.pillInputWrapper,
                    {
                      backgroundColor: isDark
                        ? colors.backgroundElement
                        : '#FFFFFF',
                      borderColor:
                        focusedField === 'password'
                          ? colors.tint
                          : isDark
                            ? colors.backgroundSelected
                            : '#E2DFEF',
                      borderWidth: focusedField === 'password' ? 1.8 : 1.2,
                      shadowColor: colors.tint,
                      shadowOpacity: focusedField === 'password' ? 0.28 : 0,
                      shadowRadius: focusedField === 'password' ? 10 : 0,
                      shadowOffset: { width: 0, height: 0 },
                    },
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={19}
                    color={
                      focusedField === 'password'
                        ? colors.tint
                        : colors.textSecondary
                    }
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() =>
                      setFocusedField((prev) =>
                        prev === 'password' ? null : prev
                      )
                    }
                    placeholder="Password"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    textContentType="password"
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    style={[styles.input, { color: colors.text }]}
                  />
                  <Pressable
                    onPress={() => setShowPassword((prev) => !prev)}
                    hitSlop={8}
                    style={styles.eyeBtn}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={18}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                </View>

                {/* Remember Me & Forgot Password Row */}
                <View style={styles.optionsRow}>
                  <Pressable
                    onPress={() => setRememberMe((prev) => !prev)}
                    style={styles.rememberRow}
                    hitSlop={8}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        {
                          borderColor: rememberMe
                            ? colors.tint
                            : colors.textSecondary,
                          backgroundColor: rememberMe
                            ? colors.tint
                            : 'transparent',
                        },
                      ]}
                    >
                      {rememberMe && (
                        <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.optionText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Remember me
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      Keyboard.dismiss();
                      router.push('/(auth)/forgot-password' as any);
                    }}
                    hitSlop={8}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Forgot password?
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Large Centralized Sign In Button */}
              <Pressable
                onPress={handleLogin}
                disabled={loading}
                style={({ pressed }) => [
                  styles.loginBtn,
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
                  <View style={styles.loginBtnContent}>
                    <Text style={styles.loginBtnText}>Sign in</Text>
                    <Ionicons
                      name="log-in-outline"
                      size={21}
                      color="#FFFFFF"
                    />
                  </View>
                )}
              </Pressable>

              {/* Compact Auth Provider Circles Under Sign In Button */}
              <View style={styles.socialSection}>
                <Text
                  style={[styles.socialLabel, { color: colors.textSecondary }]}
                >
                  or continue with
                </Text>
                <View style={styles.socialRow}>
                  <Pressable
                    onPress={() => {
                      Keyboard.dismiss();
                      console.log('Apple Sign-In');
                    }}
                    style={({ pressed }) => [
                      styles.socialCircle,
                      {
                        backgroundColor: isDark ? '#FFFFFF' : '#17172B',
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                    accessibilityLabel="Login with Apple"
                  >
                    <Ionicons
                      name="logo-apple"
                      size={16}
                      color={isDark ? '#17172B' : '#FFFFFF'}
                    />
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      Keyboard.dismiss();
                      console.log('Google Sign-In');
                    }}
                    style={({ pressed }) => [
                      styles.socialCircle,
                      {
                        backgroundColor: isDark
                          ? colors.backgroundElement
                          : '#FFFFFF',
                        borderWidth: 1.2,
                        borderColor: isDark
                          ? colors.backgroundSelected
                          : '#E2DFEF',
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                    accessibilityLabel="Login with Google"
                  >
                    <Ionicons
                      name="logo-google"
                      size={15}
                      color={colors.text}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Register Link Pinned at Bottom */}
              <View style={styles.footerRow}>
                <Text
                  style={[styles.footerText, { color: colors.textSecondary }]}
                >
                  Don&apos;t have an account?
                </Text>
                <Pressable
                  onPress={() => {
                    Keyboard.dismiss();
                    router.push('/(auth)/signup' as any);
                  }}
                  hitSlop={8}
                >
                  <Text style={[styles.footerLink, { color: colors.tint }]}>
                    Register
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
    marginBottom: 48,
  },
  brandName: {
    fontFamily: Fonts.sansBold,
    fontSize: 23,
    letterSpacing: -0.5,
  },
  headingBlock: {
    marginBottom: 24,
  },
  title: {
    fontFamily: Fonts.sansBold,
    fontSize: 32,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: 14.5,
    marginTop: 6,
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
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: '#EF4444',
  },
  formGroup: {
    gap: 15,
    marginBottom: 24,
  },
  pillInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 999,
    paddingHorizontal: 18,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: Fonts.sans,
    fontSize: 15,
  },
  eyeBtn: {
    paddingLeft: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    marginTop: 2,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
  },
  loginBtn: {
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
  loginBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loginBtnText: {
    fontFamily: Fonts.sansBold,
    fontSize: 17,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  socialSection: {
    alignItems: 'center',
    marginTop: 24,
    gap: 12,
  },
  socialLabel: {
    fontFamily: Fonts.sans,
    fontSize: 12.5,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  socialCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
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

import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
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
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
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
        const userDetails = data.user ?? {
          email: cleanEmail,
          ...data,
        };

        if (!token) {
          setErrorMsg('Login succeeded, but no access token was returned.');
          return;
        }

        await SecureStore.setItemAsync('access_token', token);
        await SecureStore.setItemAsync('user', JSON.stringify(userDetails));
        await login(token, userDetails);

        //router.replace('/(home)' as any);
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
            <View
              style={[
                styles.cardBox,
                {
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.backgroundSelected,
                },
              ]}
            >
              <ThemedText type="title" style={styles.title}>
                Login
              </ThemedText>

              {errorMsg ? (
                <View style={[styles.errorBox, { borderColor: colors.tint }]}>
                  <ThemedText style={[styles.errorText, { color: colors.tint }]}>
                    {errorMsg}
                  </ThemedText>
                </View>
              ) : null}

              <TextInput
                mode="outlined"
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                style={[styles.input, { backgroundColor: colors.background }]}
                outlineStyle={styles.inputOutline}
                outlineColor={colors.backgroundSelected}
                activeOutlineColor={colors.tint}
                textColor={colors.text}
                left={<TextInput.Icon icon="email-outline" />}
              />

              <TextInput
                mode="outlined"
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                textContentType="password"
                style={[styles.input, { backgroundColor: colors.background }]}
                outlineStyle={styles.inputOutline}
                outlineColor={colors.backgroundSelected}
                activeOutlineColor={colors.tint}
                textColor={colors.text}
                left={<TextInput.Icon icon="lock-outline" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
              />

              <View style={styles.optionsRow}>
                <Pressable
                  onPress={() => setRememberMe(!rememberMe)}
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
                  <ThemedText
                    style={[styles.optionText, { color: colors.textSecondary }]}
                  >
                    Remember me
                  </ThemedText>
                </Pressable>

                <Pressable hitSlop={8}>
                  <ThemedText
                    style={[styles.optionText, { color: colors.textSecondary }]}
                  >
                    Forgot password?
                  </ThemedText>
                </Pressable>
              </View>

              <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                buttonColor={colors.tint}
                textColor="#ffffff"
                style={styles.button}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                Sign in
              </Button>

              <View style={styles.dividerRow}>
                <View
                  style={[
                    styles.dividerLine,
                    { backgroundColor: colors.backgroundSelected },
                  ]}
                />
                <ThemedText
                  style={[styles.dividerText, { color: colors.textSecondary }]}
                >
                  or continue with
                </ThemedText>
                <View
                  style={[
                    styles.dividerLine,
                    { backgroundColor: colors.backgroundSelected },
                  ]}
                />
              </View>

              <View style={styles.socialStack}>
                <Pressable
                  onPress={() => console.log('Apple Sign-In')}
                  style={({ pressed }) => [
                    styles.socialBtn,
                    {
                      backgroundColor: isDark ? '#FFFFFF' : '#000000',
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name="logo-apple"
                    size={20}
                    color={isDark ? '#000000' : '#FFFFFF'}
                  />
                  <ThemedText
                    style={[
                      styles.socialBtnText,
                      { color: isDark ? '#000000' : '#FFFFFF' },
                    ]}
                  >
                    Continue with Apple
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={() => console.log('Google Sign-In')}
                  style={({ pressed }) => [
                    styles.socialBtn,
                    {
                      backgroundColor: colors.background,
                      borderWidth: 1,
                      borderColor: colors.backgroundSelected,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Ionicons name="logo-google" size={18} color={colors.text} />
                  <ThemedText
                    style={[styles.socialBtnText, { color: colors.text }]}
                  >
                    Continue with Google
                  </ThemedText>
                </Pressable>
              </View>

              <View style={styles.footerRow}>
                <ThemedText
                  style={[styles.footerText, { color: colors.textSecondary }]}
                >
                  Don&apos;t have an account?
                </ThemedText>
                <Pressable
                  hitSlop={8}
                  onPress={() => router.push('/(auth)/signup' as any)}
                >
                  <ThemedText
                    style={[styles.footerLink, { color: colors.tint }]}
                  >
                    Register
                  </ThemedText>
                </Pressable>
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
  cardBox: {
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 28,
  },
  title: {
    marginBottom: 20,
  },
  errorBox: {
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
  },
  input: {
    marginBottom: 14,
  },
  inputOutline: {
    borderRadius: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: 20,
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
    fontSize: 13,
    fontWeight: '500',
  },
  button: {
    borderRadius: 999,
  },
  buttonContent: {
    height: 50,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  socialStack: {
    gap: 12,
  },
  socialBtn: {
    height: 50,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  socialBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontWeight: '700',
    marginLeft: 5,
    fontSize: 14,
  },
});

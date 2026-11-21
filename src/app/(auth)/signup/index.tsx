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
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { API_URL } from '@/constants/api';

export default function SignupScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignup = async () => {
    if (!email.trim() || !password || !confirmPassword) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push({
          pathname: '/(auth)/signup/verify-email',
          params: { email: email.trim().toLowerCase() },
        } as any);
      } else if (Array.isArray(data.detail)) {
        const failedField = data.detail[0]?.loc?.[1] || 'Field';
        setErrorMsg(`Error in ${failedField}: ${data.detail[0]?.msg}`);
      } else {
        setErrorMsg(data.detail || 'Registration failed.');
      }
    } catch (error) {
      console.log('Signup error:', error);
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
                Register
              </ThemedText>
              <ThemedText
                style={[styles.subtitle, { color: colors.textSecondary }]}
              >
                Create your account to get started
              </ThemedText>

              {errorMsg ? (
                <View style={[styles.errorBox, { borderColor: colors.tint }]}>
                  <ThemedText style={[styles.errorText, { color: colors.tint }]}>
                    {errorMsg}
                  </ThemedText>
                </View>
              ) : null}

              {/* Safe Registration Fields Box */}
              <View
                style={[
                  styles.fieldsSafeBox,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.backgroundSelected,
                  },
                ]}
              >
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
                  textContentType="newPassword"
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

                <TextInput
                  mode="outlined"
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  textContentType="newPassword"
                  style={[
                    styles.input,
                    { marginBottom: 0, backgroundColor: colors.background },
                  ]}
                  outlineStyle={styles.inputOutline}
                  outlineColor={colors.backgroundSelected}
                  activeOutlineColor={colors.tint}
                  textColor={colors.text}
                  left={<TextInput.Icon icon="lock-check-outline" />}
                  right={
                    <TextInput.Icon
                      icon={
                        showConfirmPassword ? 'eye-off-outline' : 'eye-outline'
                      }
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    />
                  }
                />
              </View>

              <Button
                mode="contained"
                onPress={handleSignup}
                loading={loading}
                disabled={loading}
                buttonColor={colors.tint}
                textColor="#ffffff"
                style={styles.button}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                Let&apos;s Get Started
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
                  onPress={() => console.log('Apple Sign-Up')}
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
                  onPress={() => console.log('Google Sign-Up')}
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
                  Already have an account?
                </ThemedText>
                <Pressable
                  hitSlop={8}
                  onPress={() => router.push('/(auth)/login' as any)}
                >
                  <ThemedText
                    style={[styles.footerLink, { color: colors.tint }]}
                  >
                    Login
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
    paddingHorizontal: 20,
    paddingVertical: 26,
  },
  title: {
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
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
  fieldsSafeBox: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 18,
  },
  input: {
    marginBottom: 12,
  },
  inputOutline: {
    borderRadius: 12,
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

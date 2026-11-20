import { useState } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable, View } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';
import { API_URL } from '@/constants/api';
import { useRouter } from 'expo-router';

export default function SignupScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'light' ? 'light' : 'dark'];

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignup = async () => {
    if (!firstName || !email || !phoneNumber || !password) {
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
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone_number: phoneNumber,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Account created! Please log in.');
        router.push('/(auth)/login' as any);
      } else {
        if (Array.isArray(data.detail)) {
          const failedField = data.detail[0].loc[1] || 'Field';
          setErrorMsg(`Error in ${failedField}: ${data.detail[0].msg}`);
        } else {
          setErrorMsg(data.detail || 'Registration failed.');
        }
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
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText type="title" style={styles.title}>
            Create Account
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Join and start earning
          </ThemedText>

          {errorMsg ? <ThemedText style={styles.errorText}>{errorMsg}</ThemedText> : null}

          <TextInput
            mode="outlined"
            label="First Name"
            value={firstName}
            onChangeText={setFirstName}
            style={styles.input}
            outlineColor={colors.backgroundElement}
            activeOutlineColor={colors.tint}
            textColor={colors.text}
            left={<TextInput.Icon icon="account" />}
          />

          <TextInput
            mode="outlined"
            label="Last Name (Optional)"
            value={lastName}
            onChangeText={setLastName}
            style={styles.input}
            outlineColor={colors.backgroundElement}
            activeOutlineColor={colors.tint}
            textColor={colors.text}
            left={<TextInput.Icon icon="account-outline" />}
          />

          <TextInput
            mode="outlined"
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            outlineColor={colors.backgroundElement}
            activeOutlineColor={colors.tint}
            textColor={colors.text}
            left={<TextInput.Icon icon="email" />}
          />

          <TextInput
            mode="outlined"
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            style={styles.input}
            outlineColor={colors.backgroundElement}
            activeOutlineColor={colors.tint}
            textColor={colors.text}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />

          <TextInput
            mode="outlined"
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
            style={styles.input}
            outlineColor={colors.backgroundElement}
            activeOutlineColor={colors.tint}
            textColor={colors.text}
            left={<TextInput.Icon icon="lock-check" />}
          />

          <Button
            mode="contained"
            onPress={handleSignup}
            loading={loading}
            disabled={loading}
            buttonColor={colors.tint}
            textColor="#ffffff"
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Sign Up
          </Button>
        </ScrollView>
        <View style={styles.loginStyle}>
          <ThemedText style={styles.loginText}>
            Already hav an account?
          </ThemedText>
          <Pressable onPress={() => router.push('/(auth)/login' as any)}>
            <ThemedText style={styles.loginButton}>Log In</ThemedText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 120,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    marginBottom: 28,
    textAlign: 'center',
  },
  input: {
    marginBottom: 14,
    backgroundColor: 'transparent',
  },
  button: {
    marginTop: 10,
    borderRadius: 10,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  loginText: {
    fontSize: 14,
  },
  loginStyle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24
  },
  loginButton: {
    color: 'blue',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  errorText: {
    color: '#CF6679',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
});
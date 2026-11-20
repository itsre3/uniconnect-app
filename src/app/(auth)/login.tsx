import { useState } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { TextInput, Button } from 'react-native-paper';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';
import useAuth from '../ctx';
import { API_URL } from '@/constants/api';


export default function LoginScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === null ? 'light' : (scheme ?? 'light')];
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      const data = await response.json();

      if (response.ok) {
        // Passes both token and user profile data to ctx for offline caching
        await login(data.access_token, data.data || null);
      } else {
        setErrorMsg(data.detail || 'Invalid email or password.');
      }
    } catch (error) {
      console.log('Login error:', error);
      setErrorMsg('Network error. Check server connection.');
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
        <View style={styles.formContainer}>
          <ThemedText type="title" style={styles.title}>Welcome Back</ThemedText>
          <ThemedText style={styles.subtitle}>Log in to continue earning</ThemedText>

          {errorMsg ? <ThemedText style={styles.errorText}>{errorMsg}</ThemedText> : null}

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

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            buttonColor={colors.tint}
            textColor="#ffffff"
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Login
          </Button>
          <View style={styles.signupContainer}>
            <ThemedText>Don't have an account?</ThemedText>
            <Pressable onPress={() => router.push('/(auth)/signup' as any)}>
              <ThemedText style={styles.signupLink}>Sign up</ThemedText>
            </Pressable>
          </View>

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
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 80,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  button: {
    marginTop: 8,
    borderRadius: 10,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  signupText: {
    fontSize: 14,
  },
  signupLink: {
    color: '#2196F3',
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
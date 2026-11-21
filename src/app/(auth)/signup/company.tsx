import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { API_URL } from '@/constants/api';

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken';

export default function CompanyOnboardingScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [companyName, setCompanyName] = useState('');
  const [username, setUsername] = useState('');
  const [address, setAddress] = useState('');

  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const clean = username.trim().toLowerCase();
    if (clean.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/v1/onboarding/check-username?username=${encodeURIComponent(clean)}`
        );
        if (res.ok) {
          const data = await res.json();
          setUsernameStatus(data.available ? 'available' : 'taken');
        } else {
          setUsernameStatus('idle');
        }
      } catch {
        setUsernameStatus('idle');
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = async () => {
    if (!companyName.trim() || !username.trim() || !address.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    if (usernameStatus === 'taken') {
      setErrorMsg('That username is already taken.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const response = await fetch(`${API_URL}/api/v1/onboarding/company`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'company',
          email: email?.trim().toLowerCase(),
          company_name: companyName.trim(),
          username: username.trim().toLowerCase(),
          address: address.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.replace('/(tabs)' as any);
      } else if (Array.isArray(data.detail)) {
        const failedField = data.detail[0]?.loc?.[1] || 'Field';
        setErrorMsg(`Error in ${failedField}: ${data.detail[0]?.msg}`);
      } else {
        setErrorMsg(data.detail || 'Could not complete company profile.');
      }
    } catch {
      setErrorMsg('Network error. Check your connection to the server.');
    } finally {
      setSubmitting(false);
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
                Company Profile
              </ThemedText>
              <ThemedText
                style={[styles.subtitle, { color: colors.textSecondary }]}
              >
                Set up your organization details to post opportunities
              </ThemedText>

              {errorMsg ? (
                <View style={[styles.errorBox, { borderColor: colors.tint }]}>
                  <ThemedText style={[styles.errorText, { color: colors.tint }]}>
                    {errorMsg}
                  </ThemedText>
                </View>
              ) : null}

              <View
                style={[
                  styles.sectionSafeBox,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.backgroundSelected,
                  },
                ]}
              >
                <TextInput
                  mode="outlined"
                  label="Company Name"
                  value={companyName}
                  onChangeText={setCompanyName}
                  textContentType="organizationName"
                  style={[styles.input, { backgroundColor: colors.background }]}
                  outlineStyle={styles.inputOutline}
                  outlineColor={colors.backgroundSelected}
                  activeOutlineColor={colors.tint}
                  textColor={colors.text}
                  left={<TextInput.Icon icon="domain" />}
                />

                <TextInput
                  mode="outlined"
                  label="Username"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="username"
                  style={[styles.input, { backgroundColor: colors.background }]}
                  outlineStyle={styles.inputOutline}
                  outlineColor={
                    usernameStatus === 'taken'
                      ? colors.tint
                      : colors.backgroundSelected
                  }
                  activeOutlineColor={colors.tint}
                  textColor={colors.text}
                  left={<TextInput.Icon icon="at" />}
                  right={
                    usernameStatus === 'checking' ? (
                      <TextInput.Icon
                        icon={() => (
                          <ActivityIndicator size="small" color={colors.tint} />
                        )}
                      />
                    ) : usernameStatus === 'available' ? (
                      <TextInput.Icon icon="check-circle" color="#22C55E" />
                    ) : usernameStatus === 'taken' ? (
                      <TextInput.Icon icon="close-circle" color={colors.tint} />
                    ) : undefined
                  }
                />

                {usernameStatus === 'taken' ? (
                  <ThemedText
                    style={[styles.usernameHint, { color: colors.tint }]}
                  >
                    Username is already taken
                  </ThemedText>
                ) : usernameStatus === 'available' ? (
                  <ThemedText
                    style={[styles.usernameHint, { color: '#22C55E' }]}
                  >
                    Username is available
                  </ThemedText>
                ) : null}

                <TextInput
                  mode="outlined"
                  label="Company Address"
                  value={address}
                  onChangeText={setAddress}
                  multiline
                  numberOfLines={2}
                  textContentType="fullStreetAddress"
                  style={[
                    styles.input,
                    { marginBottom: 0, backgroundColor: colors.background },
                  ]}
                  outlineStyle={styles.inputOutline}
                  outlineColor={colors.backgroundSelected}
                  activeOutlineColor={colors.tint}
                  textColor={colors.text}
                  left={<TextInput.Icon icon="map-marker-outline" />}
                />
              </View>

              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={submitting}
                disabled={submitting || usernameStatus === 'checking'}
                buttonColor={colors.tint}
                textColor="#ffffff"
                style={styles.button}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                Complete Setup
              </Button>
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
    paddingTop: 12,
    paddingBottom: Spacing.five,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  cardBox: {
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  title: {
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 18,
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
  sectionSafeBox: {
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
  usernameHint: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: -6,
    marginBottom: 12,
    marginLeft: 4,
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
});

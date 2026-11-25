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
import * as SecureStore from 'expo-secure-store';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { API_URL } from '@/constants/api';
import { useAuth } from '../../ctx';

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken';

export default function CompanyOnboardingScreen() {
  const router = useRouter();
  const { userToken, login } = useAuth();
  const { token: paramToken } = useLocalSearchParams<{
    email?: string;
    token?: string;
  }>();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const [companyName, setCompanyName] = useState('');
  const [username, setUsername] = useState('');
  const [industry, setIndustry] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const getToken = async () => {
    return (
      userToken ||
      paramToken ||
      (await SecureStore.getItemAsync('access_token')) ||
      (await SecureStore.getItemAsync('userToken'))
    );
  };

  useEffect(() => {
    const clean = username.trim().toLowerCase();
    if (clean.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    let isCancelled = false;
    setUsernameStatus('checking');

    const timer = setTimeout(async () => {
      try {
        const activeToken = await getToken();
        const res = await fetch(
          `${API_URL}/auth/username?username=${encodeURIComponent(clean)}`,
          {
            headers: {
              ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
            },
          }
        );

        if (isCancelled) return;

        if (res.ok) {
          const data = await res.json();
          setUsernameStatus(data.available ? 'available' : 'taken');
        } else {
          setUsernameStatus('idle');
        }
      } catch {
        if (!isCancelled) setUsernameStatus('idle');
      }
    }, 450);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [username, userToken, paramToken]);

  const handleSubmit = async () => {
    if (
      !companyName.trim() ||
      !username.trim() ||
      !industry.trim() ||
      !description.trim()
    ) {
      setErrorMsg(
        'Please enter your company name, username, industry, and description.'
      );
      return;
    }

    if (usernameStatus === 'taken') {
      setErrorMsg('That username is already taken.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const activeToken = await getToken();
      const response = await fetch(`${API_URL}/onboarding/company`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
        },
        body: JSON.stringify({
          company_name: companyName.trim(),
          username: username.trim().toLowerCase(),
          description: description.trim(),
          industry: industry.trim(),
          website: website.trim() || null,
          logo_url: logoUrl.trim() || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (activeToken) {
          await login(activeToken, data.user ?? data);
        }
        router.replace('/(home)' as any);
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

  const surfaceFill = isDark ? '#121214' : '#F7F7F9';
  const strokeColor = isDark ? '#26262A' : '#E4E4E8';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Minimal Top Bar */}
          <View style={styles.topBar}>
            <Pressable
              onPress={() => router.back()}
              style={[
                styles.backBtn,
                {
                  backgroundColor: surfaceFill,
                  borderColor: strokeColor,
                },
              ]}
              hitSlop={10}
            >
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </Pressable>

            <View
              style={[
                styles.rolePill,
                { backgroundColor: surfaceFill, borderColor: strokeColor },
              ]}
            >
              <Ionicons name="business-outline" size={14} color={colors.tint} />
              <ThemedText
                style={[styles.rolePillText, { color: colors.textSecondary }]}
              >
                Organization
              </ThemedText>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.headerBlock}>
              <ThemedText type="title" style={styles.title}>
                Set up your company
              </ThemedText>
              <ThemedText
                style={[styles.subtitle, { color: colors.textSecondary }]}
              >
                Create your organization identity to connect with students and
                post opportunities.
              </ThemedText>
            </View>

            {errorMsg ? (
              <View style={[styles.errorBanner, { borderColor: colors.tint }]}>
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color={colors.tint}
                />
                <ThemedText style={[styles.errorText, { color: colors.tint }]}>
                  {errorMsg}
                </ThemedText>
              </View>
            ) : null}

            {/* Identity */}
            <ThemedText
              style={[styles.sectionEyebrow, { color: colors.textSecondary }]}
            >
              IDENTITY
            </ThemedText>

            <TextInput
              mode="outlined"
              label="Company Name"
              value={companyName}
              onChangeText={setCompanyName}
              textContentType="organizationName"
              style={[styles.input, { backgroundColor: surfaceFill }]}
              outlineStyle={styles.inputOutline}
              outlineColor={strokeColor}
              activeOutlineColor={colors.tint}
              textColor={colors.text}
              left={<TextInput.Icon icon="domain" />}
            />

            <TextInput
              mode="outlined"
              label="Handle / Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
              style={[styles.input, { backgroundColor: surfaceFill }]}
              outlineStyle={styles.inputOutline}
              outlineColor={
                usernameStatus === 'taken' ? colors.tint : strokeColor
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
              <ThemedText style={[styles.statusHint, { color: colors.tint }]}>
                That handle is already taken
              </ThemedText>
            ) : usernameStatus === 'available' ? (
              <ThemedText style={[styles.statusHint, { color: '#22C55E' }]}>
                Handle is available
              </ThemedText>
            ) : null}

            <TextInput
              mode="outlined"
              label="Industry (e.g. FinTech, EdTech, Energy)"
              value={industry}
              onChangeText={setIndustry}
              style={[styles.input, { backgroundColor: surfaceFill }]}
              outlineStyle={styles.inputOutline}
              outlineColor={strokeColor}
              activeOutlineColor={colors.tint}
              textColor={colors.text}
              left={<TextInput.Icon icon="briefcase-outline" />}
            />

            <TextInput
              mode="outlined"
              label="About / Description"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: surfaceFill },
              ]}
              outlineStyle={styles.inputOutline}
              outlineColor={strokeColor}
              activeOutlineColor={colors.tint}
              textColor={colors.text}
            />

            {/* Online Presence */}
            <ThemedText
              style={[
                styles.sectionEyebrow,
                { color: colors.textSecondary, marginTop: 8 },
              ]}
            >
              LINKS & BRANDING (OPTIONAL)
            </ThemedText>

            <TextInput
              mode="outlined"
              label="Website URL"
              placeholder="https://yourcompany.com"
              value={website}
              onChangeText={setWebsite}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="URL"
              style={[styles.input, { backgroundColor: surfaceFill }]}
              outlineStyle={styles.inputOutline}
              outlineColor={strokeColor}
              activeOutlineColor={colors.tint}
              textColor={colors.text}
              left={<TextInput.Icon icon="web" />}
            />

            <TextInput
              mode="outlined"
              label="Logo URL"
              placeholder="https://.../logo.png"
              value={logoUrl}
              onChangeText={setLogoUrl}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="URL"
              style={[
                styles.input,
                { marginBottom: 24, backgroundColor: surfaceFill },
              ]}
              outlineStyle={styles.inputOutline}
              outlineColor={strokeColor}
              activeOutlineColor={colors.tint}
              textColor={colors.text}
              left={<TextInput.Icon icon="image-outline" />}
            />

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={submitting}
              disabled={submitting || usernameStatus === 'checking'}
              buttonColor={colors.tint}
              textColor="#FFFFFF"
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              Continue
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 6,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: Spacing.five,
  },
  headerBlock: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 18,
    backgroundColor: 'rgba(255, 79, 90, 0.08)',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
  },
  input: {
    marginBottom: 14,
  },
  textArea: {
    minHeight: 88,
  },
  inputOutline: {
    borderRadius: 14,
  },
  statusHint: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: -8,
    marginBottom: 14,
    marginLeft: 4,
  },
  button: {
    borderRadius: 999,
  },
  buttonContent: {
    height: 52,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

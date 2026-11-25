import { useEffect, useState } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { UniConnectLogo } from '@/components/UniConnectLogo';
import { Colors, Fonts } from '@/constants/theme';
import { API_URL } from '@/constants/api';
import { useAuth } from '../../ctx';

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken';
type FocusedInput =
  | 'companyName'
  | 'username'
  | 'industry'
  | 'description'
  | 'website'
  | 'logoUrl'
  | null;

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
  const [focusedField, setFocusedField] = useState<FocusedInput>(null);

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
    Keyboard.dismiss();
    setFocusedField(null);

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

  const getFieldStyle = (field: FocusedInput, hasError = false) => {
    const isFocused = focusedField === field;
    return {
      backgroundColor: isDark ? colors.backgroundElement : '#FFFFFF',
      borderColor: hasError
        ? '#EF4444'
        : isFocused
          ? colors.tint
          : isDark
            ? colors.backgroundSelected
            : '#E2DFEF',
      borderWidth: isFocused || hasError ? 1.8 : 1.2,
      shadowColor: hasError ? '#EF4444' : colors.tint,
      shadowOpacity: isFocused ? 0.28 : 0,
      shadowRadius: isFocused ? 10 : 0,
      shadowOffset: { width: 0, height: 0 },
    };
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
              {/* Top Nav Row with Back Arrow & Organization Pill */}
              <View style={styles.topBar}>
                <Pressable
                  onPress={() => {
                    Keyboard.dismiss();
                    if (router.canGoBack()) {
                      router.back();
                    } else {
                      router.replace('/(auth)/signup/onboard' as any);
                    }
                  }}
                  hitSlop={12}
                  style={styles.backBtn}
                >
                  <Ionicons name="chevron-back" size={26} color={colors.text} />
                </Pressable>

                <View
                  style={[
                    styles.rolePill,
                    {
                      backgroundColor: isDark
                        ? colors.backgroundElement
                        : '#FFFFFF',
                      borderColor: isDark
                        ? colors.backgroundSelected
                        : '#E2DFEF',
                    },
                  ]}
                >
                  <Ionicons
                    name="business-outline"
                    size={14}
                    color={colors.tint}
                  />
                  <Text
                    style={[
                      styles.rolePillText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Organization
                  </Text>
                </View>
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

              {/* Left-Aligned Title & Subtitle */}
              <View style={styles.headingBlock}>
                <Text style={[styles.title, { color: colors.text }]}>
                  Set up your company
                </Text>
                <Text
                  style={[styles.subtitle, { color: colors.textSecondary }]}
                >
                  Create your organization identity to connect with students and
                  post opportunities
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

              {/* Identity Section */}
              <Text
                style={[styles.sectionLabel, { color: colors.textSecondary }]}
              >
                IDENTITY
              </Text>
              <View style={styles.formGroup}>
                <View
                  style={[
                    styles.pillInputWrapper,
                    getFieldStyle('companyName'),
                  ]}
                >
                  <Ionicons
                    name="business-outline"
                    size={19}
                    color={
                      focusedField === 'companyName'
                        ? colors.tint
                        : colors.textSecondary
                    }
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={companyName}
                    onChangeText={setCompanyName}
                    onFocus={() => setFocusedField('companyName')}
                    onBlur={() =>
                      setFocusedField((prev) =>
                        prev === 'companyName' ? null : prev
                      )
                    }
                    placeholder="Company name"
                    placeholderTextColor={colors.textSecondary}
                    textContentType="organizationName"
                    returnKeyType="next"
                    style={[styles.input, { color: colors.text }]}
                  />
                </View>

                <View>
                  <View
                    style={[
                      styles.pillInputWrapper,
                      getFieldStyle('username', usernameStatus === 'taken'),
                    ]}
                  >
                    <Ionicons
                      name="at-outline"
                      size={19}
                      color={
                        usernameStatus === 'taken'
                          ? '#EF4444'
                          : focusedField === 'username'
                            ? colors.tint
                            : colors.textSecondary
                      }
                      style={styles.inputIcon}
                    />
                    <TextInput
                      value={username}
                      onChangeText={setUsername}
                      onFocus={() => setFocusedField('username')}
                      onBlur={() =>
                        setFocusedField((prev) =>
                          prev === 'username' ? null : prev
                        )
                      }
                      placeholder="Handle / username"
                      placeholderTextColor={colors.textSecondary}
                      autoCapitalize="none"
                      autoCorrect={false}
                      textContentType="username"
                      returnKeyType="next"
                      style={[styles.input, { color: colors.text }]}
                    />
                    {usernameStatus === 'checking' ? (
                      <ActivityIndicator size="small" color={colors.tint} />
                    ) : usernameStatus === 'available' ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#22C55E"
                      />
                    ) : usernameStatus === 'taken' ? (
                      <Ionicons
                        name="close-circle"
                        size={20}
                        color="#EF4444"
                      />
                    ) : null}
                  </View>

                  {usernameStatus === 'taken' ? (
                    <Text style={[styles.statusHint, { color: '#EF4444' }]}>
                      That handle is already taken
                    </Text>
                  ) : usernameStatus === 'available' ? (
                    <Text style={[styles.statusHint, { color: '#22C55E' }]}>
                      Handle is available
                    </Text>
                  ) : null}
                </View>

                <View
                  style={[styles.pillInputWrapper, getFieldStyle('industry')]}
                >
                  <Ionicons
                    name="briefcase-outline"
                    size={19}
                    color={
                      focusedField === 'industry'
                        ? colors.tint
                        : colors.textSecondary
                    }
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={industry}
                    onChangeText={setIndustry}
                    onFocus={() => setFocusedField('industry')}
                    onBlur={() =>
                      setFocusedField((prev) =>
                        prev === 'industry' ? null : prev
                      )
                    }
                    placeholder="Industry (e.g. FinTech, EdTech, Energy)"
                    placeholderTextColor={colors.textSecondary}
                    returnKeyType="next"
                    style={[styles.input, { color: colors.text }]}
                  />
                </View>

                <View
                  style={[
                    styles.textAreaWrapper,
                    getFieldStyle('description'),
                  ]}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={19}
                    color={
                      focusedField === 'description'
                        ? colors.tint
                        : colors.textSecondary
                    }
                    style={styles.textAreaIcon}
                  />
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    onFocus={() => setFocusedField('description')}
                    onBlur={() =>
                      setFocusedField((prev) =>
                        prev === 'description' ? null : prev
                      )
                    }
                    placeholder="About / company description"
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    style={[styles.textAreaInput, { color: colors.text }]}
                  />
                </View>
              </View>

              {/* Links & Branding Section */}
              <Text
                style={[styles.sectionLabel, { color: colors.textSecondary }]}
              >
                LINKS &amp; BRANDING (OPTIONAL)
              </Text>
              <View style={styles.formGroup}>
                <View
                  style={[styles.pillInputWrapper, getFieldStyle('website')]}
                >
                  <Ionicons
                    name="globe-outline"
                    size={19}
                    color={
                      focusedField === 'website'
                        ? colors.tint
                        : colors.textSecondary
                    }
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={website}
                    onChangeText={setWebsite}
                    onFocus={() => setFocusedField('website')}
                    onBlur={() =>
                      setFocusedField((prev) =>
                        prev === 'website' ? null : prev
                      )
                    }
                    placeholder="Website URL (https://...)"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="url"
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="URL"
                    returnKeyType="next"
                    style={[styles.input, { color: colors.text }]}
                  />
                </View>

                <View
                  style={[styles.pillInputWrapper, getFieldStyle('logoUrl')]}
                >
                  <Ionicons
                    name="image-outline"
                    size={19}
                    color={
                      focusedField === 'logoUrl'
                        ? colors.tint
                        : colors.textSecondary
                    }
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={logoUrl}
                    onChangeText={setLogoUrl}
                    onFocus={() => setFocusedField('logoUrl')}
                    onBlur={() =>
                      setFocusedField((prev) =>
                        prev === 'logoUrl' ? null : prev
                      )
                    }
                    placeholder="Logo URL (https://.../logo.png)"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="url"
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="URL"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                    style={[styles.input, { color: colors.text }]}
                  />
                </View>
              </View>

              {/* Centralized Submit Button */}
              <Pressable
                onPress={handleSubmit}
                disabled={submitting || usernameStatus === 'checking'}
                style={({ pressed }) => [
                  styles.submitBtn,
                  {
                    backgroundColor: colors.tint,
                    shadowColor: colors.tint,
                    opacity:
                      submitting || usernameStatus === 'checking'
                        ? 0.65
                        : pressed
                          ? 0.9
                          : 1,
                  },
                ]}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View style={styles.submitBtnContent}>
                    <Text style={styles.submitBtnText}>Continue</Text>
                    <Ionicons
                      name="arrow-forward-outline"
                      size={20}
                      color="#FFFFFF"
                    />
                  </View>
                )}
              </Pressable>
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
    paddingBottom: 36,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.2,
  },
  rolePillText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4,
    marginBottom: 30,
  },
  brandName: {
    fontFamily: Fonts.sansBold,
    fontSize: 23,
    letterSpacing: -0.5,
  },
  headingBlock: {
    marginBottom: 22,
  },
  title: {
    fontFamily: Fonts.sansBold,
    fontSize: 29,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: 14.5,
    lineHeight: 21,
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
    marginBottom: 18,
  },
  errorText: {
    flex: 1,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: '#EF4444',
  },
  sectionLabel: {
    fontFamily: Fonts.sansBold,
    fontSize: 11.5,
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 6,
  },
  formGroup: {
    gap: 14,
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
  statusHint: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12.5,
    marginTop: 6,
    marginLeft: 16,
  },
  textAreaWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 104,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  textAreaIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  textAreaInput: {
    flex: 1,
    minHeight: 74,
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 21,
  },
  submitBtn: {
    width: '100%',
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
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
});

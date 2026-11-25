import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
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

interface SelectOption {
  id: string;
  name: string;
  code?: string;
}

type PickerTarget = 'university' | 'faculty' | 'department' | null;
type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken';
type FocusedInput = 'firstName' | 'lastName' | 'username' | 'level' | null;

export default function UniversityOnboardingScreen() {
  const router = useRouter();
  const { userToken, login } = useAuth();
  const { token: paramToken } = useLocalSearchParams<{
    email?: string;
    token?: string;
  }>();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [level, setLevel] = useState('');
  const [focusedField, setFocusedField] = useState<FocusedInput>(null);

  // Academic dropdown state
  const [universities, setUniversities] = useState<SelectOption[]>([]);
  const [faculties, setFaculties] = useState<SelectOption[]>([]);
  const [departments, setDepartments] = useState<SelectOption[]>([]);

  const [selectedUniversity, setSelectedUniversity] =
    useState<SelectOption | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<SelectOption | null>(
    null
  );
  const [selectedDepartment, setSelectedDepartment] =
    useState<SelectOption | null>(null);

  // Loading & UI state
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [loadingUniversities, setLoadingUniversities] = useState(false);
  const [loadingAcademic, setLoadingAcademic] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Searchable modal state
  const [activePicker, setActivePicker] = useState<PickerTarget>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const getToken = async () => {
    return (
      userToken ||
      paramToken ||
      (await SecureStore.getItemAsync('access_token')) ||
      (await SecureStore.getItemAsync('userToken'))
    );
  };

  // Live debounced username availability check
  useEffect(() => {
    const clean = username.trim();
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
          if (typeof data.available === 'boolean') {
            setUsernameStatus(data.available ? 'available' : 'taken');
          } else {
            setUsernameStatus(data.available);
          }
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

  // 1. Fetch universities on mount
  useEffect(() => {
    let isMounted = true;
    setLoadingUniversities(true);

    (async () => {
      try {
        const activeToken = await getToken();
        const res = await fetch(`${API_URL}/onboarding/universities`, {
          headers: {
            ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
          },
        });
        const data = await res.json();
        if (isMounted) {
          setUniversities(
            Array.isArray(data) ? data : data.universities ?? []
          );
        }
      } catch (err) {
        console.log('Fetch universities error:', err);
      } finally {
        if (isMounted) setLoadingUniversities(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [userToken, paramToken]);

  // 2. GET faculties & departments when a university is selected
  const handleSelectUniversity = async (uni: SelectOption) => {
    setSelectedUniversity(uni);
    setSelectedFaculty(null);
    setSelectedDepartment(null);
    setFaculties([]);
    setDepartments([]);
    setActivePicker(null);
    setSearchQuery('');

    setLoadingAcademic(true);
    try {
      const activeToken = await getToken();
      const authHeaders = {
        ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
      };

      const [facRes, deptRes] = await Promise.all([
        fetch(`${API_URL}/onboarding/faculties?institution_id=${uni.id}`, {
          headers: authHeaders,
        }),
        fetch(`${API_URL}/onboarding/departments?institution_id=${uni.id}`, {
          headers: authHeaders,
        }),
      ]);

      if (facRes.ok) {
        const facData = await facRes.json();
        setFaculties(
          Array.isArray(facData) ? facData : facData.faculties ?? []
        );
      }

      if (deptRes.ok) {
        const deptData = await deptRes.json();
        setDepartments(
          Array.isArray(deptData) ? deptData : deptData.departments ?? []
        );
      }
    } catch (err) {
      console.log('Fetch university faculties/departments error:', err);
    } finally {
      setLoadingAcademic(false);
    }
  };

  // 3. Refine departments when a faculty is selected
  const handleSelectFaculty = async (faculty: SelectOption) => {
    setSelectedFaculty(faculty);
    setSelectedDepartment(null);
    setActivePicker(null);
    setSearchQuery('');

    if (!selectedUniversity) return;

    setLoadingAcademic(true);
    try {
      const activeToken = await getToken();
      const res = await fetch(
        `${API_URL}/onboarding/departments?faculty_id=${faculty.id}`,
        {
          headers: {
            ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
          },
        }
      );
      if (res.ok) {
        const deptData = await res.json();
        setDepartments(
          Array.isArray(deptData) ? deptData : deptData.departments ?? []
        );
      }
    } catch (err) {
      console.log('Fetch faculty departments error:', err);
    } finally {
      setLoadingAcademic(false);
    }
  };

  const filteredOptions = useMemo(() => {
    const source =
      activePicker === 'university'
        ? universities
        : activePicker === 'faculty'
          ? faculties
          : departments;

    const q = searchQuery.trim().toLowerCase();
    if (!q) return source;

    return source.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.code && item.code.toLowerCase().includes(q))
    );
  }, [activePicker, universities, faculties, departments, searchQuery]);

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setFocusedField(null);

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !username.trim() ||
      !selectedUniversity ||
      !selectedDepartment ||
      !level.trim()
    ) {
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
      const activeToken = await getToken();
      const response = await fetch(`${API_URL}/onboarding/student`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
        },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          username: username.trim(),
          dob: null,
          institution_id: selectedUniversity.id,
          faculty_id: selectedFaculty?.id ?? null,
          department_id: selectedDepartment.id,
          level: Number(level.trim()),
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
        setErrorMsg(data.detail || 'Could not complete profile.');
      }
    } catch (err) {
      console.log('University onboarding error:', err);
      setErrorMsg('Network error. Check your connection to the server.');
    } finally {
      setSubmitting(false);
    }
  };

  const getPillStyle = (field: FocusedInput, hasError = false) => {
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
              {/* Top Nav Row with Back Arrow */}
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
                  Complete Your Profile
                </Text>
                <Text
                  style={[styles.subtitle, { color: colors.textSecondary }]}
                >
                  Set up your university student details
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

              {/* Personal Identity Section */}
              <Text
                style={[styles.sectionLabel, { color: colors.textSecondary }]}
              >
                PERSONAL DETAILS
              </Text>
              <View style={styles.formGroup}>
                <View
                  style={[
                    styles.pillInputWrapper,
                    getPillStyle('firstName'),
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={19}
                    color={
                      focusedField === 'firstName'
                        ? colors.tint
                        : colors.textSecondary
                    }
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={firstName}
                    onChangeText={setFirstName}
                    onFocus={() => setFocusedField('firstName')}
                    onBlur={() =>
                      setFocusedField((prev) =>
                        prev === 'firstName' ? null : prev
                      )
                    }
                    placeholder="First name"
                    placeholderTextColor={colors.textSecondary}
                    textContentType="givenName"
                    returnKeyType="next"
                    style={[styles.input, { color: colors.text }]}
                  />
                </View>

                <View
                  style={[styles.pillInputWrapper, getPillStyle('lastName')]}
                >
                  <Ionicons
                    name="person-outline"
                    size={19}
                    color={
                      focusedField === 'lastName'
                        ? colors.tint
                        : colors.textSecondary
                    }
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={lastName}
                    onChangeText={setLastName}
                    onFocus={() => setFocusedField('lastName')}
                    onBlur={() =>
                      setFocusedField((prev) =>
                        prev === 'lastName' ? null : prev
                      )
                    }
                    placeholder="Last name"
                    placeholderTextColor={colors.textSecondary}
                    textContentType="familyName"
                    returnKeyType="next"
                    style={[styles.input, { color: colors.text }]}
                  />
                </View>

                <View>
                  <View
                    style={[
                      styles.pillInputWrapper,
                      getPillStyle('username', usernameStatus === 'taken'),
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
                      placeholder="Username"
                      placeholderTextColor={colors.textSecondary}
                      autoCapitalize="none"
                      autoCorrect={false}
                      textContentType="username"
                      returnKeyType="done"
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
                    <Text style={[styles.usernameHint, { color: '#EF4444' }]}>
                      Username is already taken
                    </Text>
                  ) : usernameStatus === 'available' ? (
                    <Text style={[styles.usernameHint, { color: '#22C55E' }]}>
                      Username is available
                    </Text>
                  ) : null}
                </View>
              </View>

              {/* Academic Details Section */}
              <Text
                style={[styles.sectionLabel, { color: colors.textSecondary }]}
              >
                ACADEMIC DETAILS
              </Text>
              <View style={styles.formGroup}>
                {/* University */}
                <Pressable
                  onPress={() => {
                    Keyboard.dismiss();
                    setFocusedField(null);
                    setActivePicker('university');
                  }}
                  style={[
                    styles.selectTrigger,
                    {
                      backgroundColor: isDark
                        ? colors.backgroundElement
                        : '#FFFFFF',
                      borderColor: selectedUniversity
                        ? colors.tint
                        : isDark
                          ? colors.backgroundSelected
                          : '#E2DFEF',
                      borderWidth: selectedUniversity ? 1.5 : 1.2,
                    },
                  ]}
                >
                  <Ionicons
                    name="school-outline"
                    size={19}
                    color={
                      selectedUniversity ? colors.tint : colors.textSecondary
                    }
                    style={styles.inputIcon}
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.selectText,
                      {
                        color: selectedUniversity
                          ? colors.text
                          : colors.textSecondary,
                      },
                    ]}
                  >
                    {selectedUniversity
                      ? `${selectedUniversity.name}${selectedUniversity.code ? ` (${selectedUniversity.code})` : ''}`
                      : 'Choose a university...'}
                  </Text>
                  {loadingUniversities ? (
                    <ActivityIndicator size="small" color={colors.tint} />
                  ) : (
                    <Ionicons
                      name="chevron-down"
                      size={18}
                      color={colors.textSecondary}
                    />
                  )}
                </Pressable>

                {/* Faculty */}
                <Pressable
                  disabled={!selectedUniversity}
                  onPress={() => {
                    Keyboard.dismiss();
                    setFocusedField(null);
                    setActivePicker('faculty');
                  }}
                  style={[
                    styles.selectTrigger,
                    {
                      backgroundColor: isDark
                        ? colors.backgroundElement
                        : '#FFFFFF',
                      borderColor: selectedFaculty
                        ? colors.tint
                        : isDark
                          ? colors.backgroundSelected
                          : '#E2DFEF',
                      borderWidth: selectedFaculty ? 1.5 : 1.2,
                      opacity: selectedUniversity ? 1 : 0.55,
                    },
                  ]}
                >
                  <Ionicons
                    name="library-outline"
                    size={19}
                    color={
                      selectedFaculty ? colors.tint : colors.textSecondary
                    }
                    style={styles.inputIcon}
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.selectText,
                      {
                        color: selectedFaculty
                          ? colors.text
                          : colors.textSecondary,
                      },
                    ]}
                  >
                    {selectedFaculty
                      ? selectedFaculty.name
                      : selectedUniversity
                        ? 'Choose a faculty...'
                        : 'Select a university first...'}
                  </Text>
                  {loadingAcademic ? (
                    <ActivityIndicator size="small" color={colors.tint} />
                  ) : (
                    <Ionicons
                      name="chevron-down"
                      size={18}
                      color={colors.textSecondary}
                    />
                  )}
                </Pressable>

                {/* Department */}
                <Pressable
                  disabled={!selectedUniversity}
                  onPress={() => {
                    Keyboard.dismiss();
                    setFocusedField(null);
                    setActivePicker('department');
                  }}
                  style={[
                    styles.selectTrigger,
                    {
                      backgroundColor: isDark
                        ? colors.backgroundElement
                        : '#FFFFFF',
                      borderColor: selectedDepartment
                        ? colors.tint
                        : isDark
                          ? colors.backgroundSelected
                          : '#E2DFEF',
                      borderWidth: selectedDepartment ? 1.5 : 1.2,
                      opacity: selectedUniversity ? 1 : 0.55,
                    },
                  ]}
                >
                  <Ionicons
                    name="book-outline"
                    size={19}
                    color={
                      selectedDepartment ? colors.tint : colors.textSecondary
                    }
                    style={styles.inputIcon}
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.selectText,
                      {
                        color: selectedDepartment
                          ? colors.text
                          : colors.textSecondary,
                      },
                    ]}
                  >
                    {selectedDepartment
                      ? `${selectedDepartment.name}${selectedDepartment.code ? ` (${selectedDepartment.code})` : ''}`
                      : selectedUniversity
                        ? 'Choose a department...'
                        : 'Select a university first...'}
                  </Text>
                  {loadingAcademic ? (
                    <ActivityIndicator size="small" color={colors.tint} />
                  ) : (
                    <Ionicons
                      name="chevron-down"
                      size={18}
                      color={colors.textSecondary}
                    />
                  )}
                </Pressable>

                {/* Current Level */}
                <View style={[styles.pillInputWrapper, getPillStyle('level')]}>
                  <Ionicons
                    name="layers-outline"
                    size={19}
                    color={
                      focusedField === 'level'
                        ? colors.tint
                        : colors.textSecondary
                    }
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={level}
                    onChangeText={setLevel}
                    onFocus={() => setFocusedField('level')}
                    onBlur={() =>
                      setFocusedField((prev) =>
                        prev === 'level' ? null : prev
                      )
                    }
                    placeholder="Current level (e.g. 200)"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                    maxLength={3}
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
                    <Text style={styles.submitBtnText}>Complete Setup</Text>
                    <Ionicons
                      name="checkmark-circle-outline"
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

      {/* Searchable iOS Bottom-Sheet Modal */}
      <Modal
        visible={activePicker !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setActivePicker(null);
          setSearchQuery('');
        }}
      >
        <SafeAreaView
          style={[styles.modalSafe, { backgroundColor: colors.background }]}
        >
          <View
            style={[
              styles.modalHeader,
              {
                borderBottomColor: isDark
                  ? colors.backgroundSelected
                  : '#E2DFEF',
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {activePicker === 'university'
                ? 'Select University'
                : activePicker === 'faculty'
                  ? 'Select Faculty'
                  : 'Select Department'}
            </Text>
            <Pressable
              onPress={() => {
                setActivePicker(null);
                setSearchQuery('');
              }}
              hitSlop={10}
            >
              <Text style={[styles.modalDoneText, { color: colors.tint }]}>
                Done
              </Text>
            </Pressable>
          </View>

          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: isDark ? colors.backgroundElement : '#FFFFFF',
                borderColor: isDark ? colors.backgroundSelected : '#E2DFEF',
              },
            ]}
          >
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={
                activePicker === 'university'
                  ? 'Search universities...'
                  : activePicker === 'faculty'
                    ? 'Search faculties...'
                    : 'Search departments...'
              }
              placeholderTextColor={colors.textSecondary}
              autoFocus
              style={[styles.searchInput, { color: colors.text }]}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={colors.textSecondary}
                />
              </Pressable>
            )}
          </View>

          <FlatList
            data={filteredOptions}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No matching results found
              </Text>
            }
            renderItem={({ item }) => {
              const isSelected =
                (activePicker === 'university' &&
                  selectedUniversity?.id === item.id) ||
                (activePicker === 'faculty' &&
                  selectedFaculty?.id === item.id) ||
                (activePicker === 'department' &&
                  selectedDepartment?.id === item.id);

              return (
                <Pressable
                  onPress={() => {
                    if (activePicker === 'university') {
                      handleSelectUniversity(item);
                    } else if (activePicker === 'faculty') {
                      handleSelectFaculty(item);
                    } else {
                      setSelectedDepartment(item);
                      setActivePicker(null);
                      setSearchQuery('');
                    }
                  }}
                  style={[
                    styles.optionRow,
                    isSelected && {
                      backgroundColor: isDark
                        ? colors.backgroundElement
                        : 'rgba(64, 35, 154, 0.08)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: isSelected ? colors.tint : colors.text,
                        fontFamily: isSelected
                          ? Fonts.sansSemiBold
                          : Fonts.sans,
                      },
                    ]}
                  >
                    {item.code ? `${item.name} (${item.code})` : item.name}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={18} color={colors.tint} />
                  )}
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
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
    marginTop: 5,
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
  usernameHint: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12.5,
    marginTop: 6,
    marginLeft: 16,
  },
  selectTrigger: {
    height: 56,
    borderRadius: 999,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectText: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 15,
    marginRight: 8,
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
  modalSafe: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 17,
  },
  modalDoneText: {
    fontFamily: Fonts.sansBold,
    fontSize: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 16,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 999,
    borderWidth: 1.2,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 15,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 4,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    marginRight: 8,
  },
  emptyText: {
    fontFamily: Fonts.sans,
    textAlign: 'center',
    marginTop: 32,
    fontSize: 14,
  },
});

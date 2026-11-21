import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput as RNTextInput,
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
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../../ctx';

interface SelectOption {
  id: string;
  name: string;
  code?: string;
}

type PickerTarget = 'university' | 'faculty' | 'department' | null;

export default function UniversityOnboardingScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [level, setLevel] = useState('');

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
  const [loadingUniversities, setLoadingUniversities] = useState(false);
  const [loadingAcademic, setLoadingAcademic] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Searchable modal state
  const [activePicker, setActivePicker] = useState<PickerTarget>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch universities on mount
  useEffect(() => {
    setLoadingUniversities(true);
    fetch(`${API_URL}/onboarding/universities`)
      .then((res) => res.json())
      .then((data) => {
        setUniversities(Array.isArray(data) ? data : data.universities ?? []);
      })
      .catch((err) => console.log('Fetch universities error:', err))
      .finally(() => setLoadingUniversities(false));
  }, []);

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
      const [facRes, deptRes] = await Promise.all([
      fetch(`${API_URL}/onboarding/faculties?institution_id=${uni.id}`),
        fetch(`${API_URL}/onboarding/departments?institution_id=${uni.id}`),
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
      const res = await fetch(
        `${API_URL}/onboarding/departments?faculty_id=${faculty.id}`
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

    setSubmitting(true);
    setErrorMsg('');

    try {
      const response = await fetch(`${API_URL}/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          //role: 'university_student',
          email: email?.trim().toLowerCase(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          username: username.trim(),
          university_id: selectedUniversity.id,
          faculty_id: selectedFaculty?.id ?? null,
          department_id: selectedDepartment.id,
          level: Number(level.trim()),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.replace('/(tabs)' as any);
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

            {/* Outer Safe Card */}
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
                Complete Your Profile
              </ThemedText>
              <ThemedText
                style={[styles.subtitle, { color: colors.textSecondary }]}
              >
                Set up your university student details
              </ThemedText>

              {errorMsg ? (
                <View style={[styles.errorBox, { borderColor: colors.tint }]}>
                  <ThemedText style={[styles.errorText, { color: colors.tint }]}>
                    {errorMsg}
                  </ThemedText>
                </View>
              ) : null}

              {/* Safe Box 1: Personal Identity */}
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
                  label="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                  textContentType="givenName"
                  style={[styles.input, { backgroundColor: colors.background }]}
                  outlineStyle={styles.inputOutline}
                  outlineColor={colors.backgroundSelected}
                  activeOutlineColor={colors.tint}
                  textColor={colors.text}
                />

                <TextInput
                  mode="outlined"
                  label="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                  textContentType="familyName"
                  style={[styles.input, { backgroundColor: colors.background }]}
                  outlineStyle={styles.inputOutline}
                  outlineColor={colors.backgroundSelected}
                  activeOutlineColor={colors.tint}
                  textColor={colors.text}
                />

                <TextInput
                  mode="outlined"
                  label="Username"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="username"
                  style={[
                    styles.input,
                    { marginBottom: 0, backgroundColor: colors.background },
                  ]}
                  outlineStyle={styles.inputOutline}
                  outlineColor={colors.backgroundSelected}
                  activeOutlineColor={colors.tint}
                  textColor={colors.text}
                />
              </View>

              {/* Safe Box 2: Academic Details */}
              <View
                style={[
                  styles.sectionSafeBox,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.backgroundSelected,
                  },
                ]}
              >
                {/* University */}
                <ThemedText style={styles.fieldLabel}>University</ThemedText>
                <Pressable
                  onPress={() => setActivePicker('university')}
                  style={[
                    styles.selectTrigger,
                    {
                      backgroundColor: colors.backgroundElement,
                      borderColor: colors.backgroundSelected,
                    },
                  ]}
                >
                  <ThemedText
                    numberOfLines={1}
                    style={{
                      flex: 1,
                      color: selectedUniversity
                        ? colors.text
                        : colors.textSecondary,
                    }}
                  >
                    {selectedUniversity
                      ? `${selectedUniversity.name}${selectedUniversity.code ? ` (${selectedUniversity.code})` : ''}`
                      : 'Choose a university...'}
                  </ThemedText>
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
                <ThemedText style={styles.fieldLabel}>Faculty</ThemedText>
                <Pressable
                  disabled={!selectedUniversity}
                  onPress={() => setActivePicker('faculty')}
                  style={[
                    styles.selectTrigger,
                    {
                      backgroundColor: colors.backgroundElement,
                      borderColor: colors.backgroundSelected,
                      opacity: selectedUniversity ? 1 : 0.5,
                    },
                  ]}
                >
                  <ThemedText
                    numberOfLines={1}
                    style={{
                      flex: 1,
                      color: selectedFaculty
                        ? colors.text
                        : colors.textSecondary,
                    }}
                  >
                    {selectedFaculty
                      ? selectedFaculty.name
                      : selectedUniversity
                        ? 'Choose a faculty...'
                        : 'Select a university first...'}
                  </ThemedText>
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
                <ThemedText style={styles.fieldLabel}>Department</ThemedText>
                <Pressable
                  disabled={!selectedUniversity}
                  onPress={() => setActivePicker('department')}
                  style={[
                    styles.selectTrigger,
                    {
                      backgroundColor: colors.backgroundElement,
                      borderColor: colors.backgroundSelected,
                      opacity: selectedUniversity ? 1 : 0.5,
                    },
                  ]}
                >
                  <ThemedText
                    numberOfLines={1}
                    style={{
                      flex: 1,
                      color: selectedDepartment
                        ? colors.text
                        : colors.textSecondary,
                    }}
                  >
                    {selectedDepartment
                      ? `${selectedDepartment.name}${selectedDepartment.code ? ` (${selectedDepartment.code})` : ''}`
                      : selectedUniversity
                        ? 'Choose a department...'
                        : 'Select a university first...'}
                  </ThemedText>
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
                <TextInput
                  mode="outlined"
                  label="Current Level (e.g. 200)"
                  value={level}
                  onChangeText={setLevel}
                  keyboardType="number-pad"
                  maxLength={3}
                  style={[
                    styles.input,
                    {
                      marginTop: 4,
                      marginBottom: 0,
                      backgroundColor: colors.background,
                    },
                  ]}
                  outlineStyle={styles.inputOutline}
                  outlineColor={colors.backgroundSelected}
                  activeOutlineColor={colors.tint}
                  textColor={colors.text}
                />
              </View>

              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={submitting}
                disabled={submitting}
                buttonColor={colors.tint}
                textColor="#ffffff"
                style={styles.button}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                Submit
              </Button>
            </View>
          </ScrollView>
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
              { borderBottomColor: colors.backgroundSelected },
            ]}
          >
            <ThemedText style={styles.modalTitle}>
              {activePicker === 'university'
                ? 'Select University'
                : activePicker === 'faculty'
                  ? 'Select Faculty'
                  : 'Select Department'}
            </ThemedText>
            <Pressable
              onPress={() => {
                setActivePicker(null);
                setSearchQuery('');
              }}
              hitSlop={10}
            >
              <ThemedText style={{ color: colors.tint, fontWeight: '700' }}>
                Done
              </ThemedText>
            </Pressable>
          </View>

          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: colors.backgroundElement,
                borderColor: colors.backgroundSelected,
              },
            ]}
          >
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <RNTextInput
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
              <ThemedText
                style={[styles.emptyText, { color: colors.textSecondary }]}
              >
                No matching results found
              </ThemedText>
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
                      backgroundColor: colors.backgroundElement,
                    },
                  ]}
                >
                  <ThemedText style={styles.optionText}>
                    {item.code ? `${item.name} (${item.code})` : item.name}
                  </ThemedText>
                  {isSelected && (
                    <Ionicons name="checkmark" size={18} color={colors.tint} />
                  )}
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
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
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    marginBottom: 12,
  },
  inputOutline: {
    borderRadius: 12,
  },
  selectTrigger: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  button: {
    marginTop: 4,
    borderRadius: 999,
  },
  buttonContent: {
    height: 50,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalSafe: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 16,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
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
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 4,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 14,
  },
});

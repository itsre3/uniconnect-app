import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';

export type AccountRole = 'university_student' | 'jamb_student' | 'company';

interface RoleOption {
  id: AccountRole;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'university_student',
    title: 'University Student',
    description: 'Connect with your school, faculty, and department peers',
    icon: 'school-outline',
  },
  {
    id: 'jamb_student',
    title: 'JAMB Student',
    description: 'Prepare for UTME, explore courses, and ask current students',
    icon: 'book-outline',
  },
  {
    id: 'company',
    title: 'Company',
    description: 'Share internships, graduate roles, and campus opportunities',
    icon: 'business-outline',
  },
];

export default function SelectRoleScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const [selectedRole, setSelectedRole] = useState<AccountRole | null>(null);
  const ROUTE_MAP: Record<AccountRole, string> = {
    university_student: '/(auth)/signup/student',
    jamb_student: '/(auth)/signup/jambite',
    company: '/(auth)/signup/company',
  };

  const handleContinue = () => {
    if (!selectedRole) return;
    router.push({
      pathname: ROUTE_MAP[selectedRole],
      params: email ? { email } : {},
    } as any);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
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
              Who are you signing up as?
            </ThemedText>
            <ThemedText
              style={[styles.subtitle, { color: colors.textSecondary }]}
            >
              Choose your account type so we can tailor your campus experience
            </ThemedText>

            <View style={styles.optionsStack}>
              {ROLE_OPTIONS.map((option) => {
                const isSelected = selectedRole === option.id;

                return (
                  <Pressable
                    key={option.id}
                    onPress={() => setSelectedRole(option.id)}
                    style={({ pressed }) => [
                      styles.roleBox,
                      {
                        backgroundColor: colors.background,
                        borderColor: isSelected
                          ? colors.tint
                          : colors.backgroundSelected,
                        opacity: pressed ? 0.88 : 1,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.iconWrap,
                        {
                          backgroundColor: isSelected
                            ? 'rgba(255, 79, 90, 0.14)'
                            : colors.backgroundElement,
                        },
                      ]}
                    >
                      <Ionicons
                        name={option.icon}
                        size={22}
                        color={isSelected ? colors.tint : colors.text}
                      />
                    </View>

                    <View style={styles.roleTextCol}>
                      <ThemedText style={styles.roleTitle}>
                        {option.title}
                      </ThemedText>
                      <ThemedText
                        style={[
                          styles.roleDescription,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {option.description}
                      </ThemedText>
                    </View>

                    <Ionicons
                      name={
                        isSelected ? 'checkmark-circle' : 'ellipse-outline'
                      }
                      size={22}
                      color={
                        isSelected ? colors.tint : colors.backgroundSelected
                      }
                    />
                  </Pressable>
                );
              })}
            </View>

            <Button
              mode="contained"
              onPress={handleContinue}
              disabled={!selectedRole}
              buttonColor={colors.tint}
              textColor="#ffffff"
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              Continue
            </Button>
          </View>
        </ScrollView>
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
    paddingVertical: 28,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 22,
  },
  optionsStack: {
    gap: 12,
    marginBottom: 24,
  },
  roleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 16,
    gap: 14,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTextCol: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 3,
  },
  roleDescription: {
    fontSize: 13,
    lineHeight: 18,
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

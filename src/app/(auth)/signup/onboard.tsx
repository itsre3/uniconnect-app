import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { UniConnectLogo } from '@/components/UniConnectLogo';
import { Colors, Fonts } from '@/constants/theme';
import { useAuth } from '../../ctx';

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

const ROUTE_MAP: Record<AccountRole, string> = {
  university_student: '/(auth)/signup/student',
  jamb_student: '/(auth)/signup/jambite',
  company: '/(auth)/signup/company',
};

export default function SelectRoleScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const [selectedRole, setSelectedRole] = useState<AccountRole | null>(null);

  const { email, token } = useLocalSearchParams<{
    email?: string;
    token?: string;
  }>();

  const handleContinue = () => {
    if (!selectedRole) return;
    router.push({
      pathname: ROUTE_MAP[selectedRole],
      params: {
        ...(email ? { email } : {}),
        ...(token ? { token } : {}),
      },
    } as any);
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
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
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
              Who are you signing up as?
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Choose your account type so we can tailor your campus experience
            </Text>
          </View>

          {/* Role Selection Cards */}
          <View style={styles.optionsStack}>
            {ROLE_OPTIONS.map((option) => {
              const isSelected = selectedRole === option.id;

              return (
                <Pressable
                  key={option.id}
                  onPress={() => setSelectedRole(option.id)}
                  style={({ pressed }) => [
                    styles.roleCard,
                    {
                      backgroundColor: isDark
                        ? colors.backgroundElement
                        : '#FFFFFF',
                      borderColor: isSelected
                        ? colors.tint
                        : isDark
                          ? colors.backgroundSelected
                          : '#E2DFEF',
                      borderWidth: isSelected ? 1.8 : 1.2,
                      shadowColor: colors.tint,
                      shadowOpacity: isSelected ? 0.22 : 0,
                      shadowRadius: isSelected ? 12 : 0,
                      shadowOffset: { width: 0, height: 4 },
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.iconWrap,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? 'rgba(169, 154, 239, 0.18)'
                            : 'rgba(64, 35, 154, 0.1)'
                          : isDark
                            ? colors.background
                            : '#F4F2FA',
                      },
                    ]}
                  >
                    <Ionicons
                      name={option.icon}
                      size={22}
                      color={isSelected ? colors.tint : colors.textSecondary}
                    />
                  </View>

                  <View style={styles.roleTextCol}>
                    <Text style={[styles.roleTitle, { color: colors.text }]}>
                      {option.title}
                    </Text>
                    <Text
                      style={[
                        styles.roleDescription,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {option.description}
                    </Text>
                  </View>

                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={
                      isSelected
                        ? colors.tint
                        : isDark
                          ? colors.backgroundSelected
                          : '#CFCBE2'
                    }
                  />
                </Pressable>
              );
            })}
          </View>

          {/* Large Centralized Continue Button & Account Switch Link */}
          <View style={styles.footerBlock}>
            <Pressable
              onPress={handleContinue}
              disabled={!selectedRole}
              style={({ pressed }) => [
                styles.continueBtn,
                {
                  backgroundColor: colors.tint,
                  shadowColor: colors.tint,
                  opacity: !selectedRole ? 0.45 : pressed ? 0.9 : 1,
                },
              ]}
            >
              <View style={styles.continueBtnContent}>
                <Text style={styles.continueBtnText}>Continue</Text>
                <Ionicons
                  name="arrow-forward-outline"
                  size={20}
                  color="#FFFFFF"
                />
              </View>
            </Pressable>

            <View style={styles.switchAccountRow}>
              <Text
                style={[styles.switchLabel, { color: colors.textSecondary }]}
              >
                Wrong email?
              </Text>
              <Pressable onPress={() => logout()} hitSlop={8}>
                <Text style={[styles.switchLink, { color: colors.tint }]}>
                  Use another account
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
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
    paddingBottom: 28,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 28,
    marginBottom: 42,
  },
  brandName: {
    fontFamily: Fonts.sansBold,
    fontSize: 23,
    letterSpacing: -0.5,
  },
  headingBlock: {
    marginBottom: 24,
  },
  title: {
    fontFamily: Fonts.sansBold,
    fontSize: 29,
    letterSpacing: -0.6,
    lineHeight: 35,
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: 14.5,
    lineHeight: 21,
    marginTop: 6,
  },
  optionsStack: {
    gap: 14,
    marginBottom: 28,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTextCol: {
    flex: 1,
  },
  roleTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    marginBottom: 3,
  },
  roleDescription: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  footerBlock: {
    marginTop: 'auto',
    paddingTop: 8,
  },
  continueBtn: {
    width: '100%',
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 4,
  },
  continueBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  continueBtnText: {
    fontFamily: Fonts.sansBold,
    fontSize: 17,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  switchAccountRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  switchLabel: {
    fontFamily: Fonts.sans,
    fontSize: 13.5,
  },
  switchLink: {
    fontFamily: Fonts.sansBold,
    fontSize: 13.5,
    marginLeft: 5,
  },
});

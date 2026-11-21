import { useColorScheme, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

export default function ResetPassword() {
    const scheme = useColorScheme();
    const colors = Colors[scheme === 'light' ? 'light' : 'dark'];
    const router = useRouter();

    return (
        <ThemedView>
            <Pressable onPress={() => router.push('/(auth)/signup/student')}>
                <ThemedText>Continue as a student</ThemedText>
            </Pressable>
            
        </ThemedView>
    )
}
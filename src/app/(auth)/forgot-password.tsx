import { useColorScheme, Pressable, TextInput } from 'react-native';
import { Colors } from '@/comstants/theme';
import { ThemedView } from '@/components/themed-view';
import { ThemeText } from '@/components/themed-text';

export default function ResetPassword() {
    const scheme = useColorScheme();
    const colors = Colors[scheme === 'light' ? 'light' : 'dark'];

    return (
        <ThemedView>
            <Pressable onPress={() => router.push('/(auth)/signup/student')}>
                <ThemedText>Continue as a student</ThemedText>
            </Pressable>
            
        </ThemedView>
    )
}
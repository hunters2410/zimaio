import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import Colors from '@/constants/Colors';

export default function SignupScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = Colors[theme];

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Security & Compliance
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [captchaChallenge, setCaptchaChallenge] = useState({ q: '2 + 2 = ?', a: 4 });
    const [captchaAnswer, setCaptchaAnswer] = useState('');

    useState(() => {
        generateCaptcha();
    });

    function generateCaptcha() {
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        setCaptchaChallenge({ q: `${num1} + ${num2} = ?`, a: num1 + num2 });
        setCaptchaAnswer('');
    }

    const handleSignup = async () => {
        if (!email || !password || !fullName) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (!termsAccepted) {
            Alert.alert('Error', 'You must accept the Terms and Conditions and Privacy Policy to continue.');
            return;
        }

        if (parseInt(captchaAnswer) !== captchaChallenge.a) {
            Alert.alert('Security Check Failed', 'Incorrect answer to the math question. Please try again.');
            generateCaptcha();
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });

        if (error) {
            Alert.alert('Signup Failed', error.message);
        } else {
            Alert.alert('Success', 'Check your email for the confirmation link!');
            router.replace('/login');
        }
        setLoading(false);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Join ZimAIo today</Text>
                </View>

                <View style={styles.form}>
                    <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                        <FontAwesome name="user" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Full Name"
                            placeholderTextColor={colors.textSecondary}
                            value={fullName}
                            onChangeText={setFullName}
                        />
                    </View>

                    <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                        <FontAwesome name="envelope" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Email Address"
                            placeholderTextColor={colors.textSecondary}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                        <FontAwesome name="lock" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Password"
                            placeholderTextColor={colors.textSecondary}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    {/* Security Puzzle */}
                    <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                        <FontAwesome name="shield" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder={`Security Check: ${captchaChallenge.q}`}
                            placeholderTextColor={colors.textSecondary}
                            value={captchaAnswer}
                            onChangeText={setCaptchaAnswer}
                            keyboardType="numeric"
                        />
                    </View>

                    {/* Terms & Conditions Checkbox */}
                    <View style={styles.termsContainer}>
                        <TouchableOpacity
                            style={styles.checkbox}
                            onPress={() => setTermsAccepted(!termsAccepted)}
                        >
                            <FontAwesome
                                name={termsAccepted ? "check-square-o" : "square-o"}
                                size={24}
                                color={termsAccepted ? colors.primary : colors.textSecondary}
                            />
                        </TouchableOpacity>
                        <View style={styles.termsTextContainer}>
                            <Text style={[styles.termsText, { color: colors.textSecondary }]}>I accept the </Text>
                            <TouchableOpacity onPress={() => router.push('/profile/terms')}>
                                <Text style={[styles.termsLink, { color: colors.primary }]}>Terms & Conditions</Text>
                            </TouchableOpacity>
                            <Text style={[styles.termsText, { color: colors.textSecondary }]}> and </Text>
                            <TouchableOpacity onPress={() => router.push('/profile/privacy')}>
                                <Text style={[styles.termsLink, { color: colors.primary }]}>Privacy Policy</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.signupButton, { backgroundColor: colors.primary, opacity: (termsAccepted && captchaAnswer) ? 1 : 0.6 }]}
                        onPress={handleSignup}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.signupButtonText}>Sign Up</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: colors.textSecondary }]}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => router.push('/login')}>
                            <Text style={[styles.loginText, { color: colors.primary }]}>Sign In</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        marginBottom: 32,
        alignItems: 'center',
        marginTop: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        paddingHorizontal: 16,
        marginBottom: 16,
        height: 48,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    inputIcon: {
        marginRight: 10,
        width: 20,
        textAlign: 'center',
    },
    input: {
        flex: 1,
        fontSize: 14,
        height: '100%',
    },
    signupButton: {
        height: 48,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 24,
        marginTop: 10,
    },
    signupButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
    },
    loginText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    checkbox: {
        marginRight: 10,
    },
    termsTextContainer: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    termsText: {
        fontSize: 14,
    },
    termsLink: {
        fontSize: 14,
        fontWeight: 'bold',
    },
});

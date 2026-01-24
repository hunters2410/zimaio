import { StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import Colors from '@/constants/Colors';

export default function PrivacyScreen() {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const [content, setContent] = useState<string | null>(null);
    const [title, setTitle] = useState('Privacy Policy');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPrivacy();
    }, []);

    const fetchPrivacy = async () => {
        try {
            const { data, error } = await supabase
                .from('documentation_sections')
                .select('title, content')
                .eq('slug', 'privacy-policy')
                .eq('is_published', true)
                .single();

            if (error) throw error;

            if (data) {
                setTitle(data.title);
                setContent(data.content);
            }
        } catch (error) {
            console.log('Error fetching privacy policy:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
            <View style={[styles.section, { backgroundColor: colors.card }]}>
                <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Last updated: {new Date().toLocaleDateString()}</Text>

                {content ? (
                    <Text style={[styles.paragraph, { color: colors.text }]}>{content}</Text>
                ) : (
                    <>
                        <Text style={[styles.heading, { color: colors.primary }]}>1. Information We Collect</Text>
                        <Text style={[styles.paragraph, { color: colors.text }]}>
                            We collect information that you provide directly to us, including when you create an account,
                            make a purchase, or communicate with us. This may include your name, email address, phone number,
                            shipping address, and payment information.
                        </Text>

                        <Text style={[styles.heading, { color: colors.primary }]}>2. How We Use Your Information</Text>
                        <Text style={[styles.paragraph, { color: colors.text }]}>
                            We use the information we collect to:
                        </Text>
                        <View style={styles.list}>
                            <Text style={[styles.listItem, { color: colors.text }]}>• Process and fulfill your orders</Text>
                            <Text style={[styles.listItem, { color: colors.text }]}>• Communicate with you about your account and orders</Text>
                            <Text style={[styles.listItem, { color: colors.text }]}>• Provide customer support</Text>
                            <Text style={[styles.listItem, { color: colors.text }]}>• Send you marketing communications (with your consent)</Text>
                            <Text style={[styles.listItem, { color: colors.text }]}>• Improve our services and platform</Text>
                            <Text style={[styles.listItem, { color: colors.text }]}>• Detect and prevent fraud</Text>
                        </View>

                        <Text style={[styles.heading, { color: colors.primary }]}>3. Information Sharing</Text>
                        <Text style={[styles.paragraph, { color: colors.text }]}>
                            We share your information with vendors when you make a purchase, with service providers who help
                            us operate our platform, and when required by law. We do not sell your personal information to
                            third parties.
                        </Text>

                        <Text style={[styles.heading, { color: colors.primary }]}>4. Data Security</Text>
                        <Text style={[styles.paragraph, { color: colors.text }]}>
                            We implement appropriate technical and organizational measures to protect your personal information
                            against unauthorized or unlawful processing, accidental loss, destruction, or damage.
                        </Text>

                        <Text style={[styles.heading, { color: colors.primary }]}>5. Your Rights</Text>
                        <Text style={[styles.paragraph, { color: colors.text }]}>
                            You have the right to access, correct, or delete your personal information. You can also object
                            to or restrict certain processing of your data. To exercise these rights, please contact us.
                        </Text>

                        <Text style={[styles.heading, { color: colors.primary }]}>6. Contact Us</Text>
                        <Text style={[styles.paragraph, { color: colors.text }]}>
                            If you have any questions about this Privacy Policy, please contact us at privacy@zimaio.com
                            or through our contact page.
                        </Text>
                    </>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    content: {
        padding: 20,
    },
    section: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#1e293b',
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 24,
    },
    heading: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#16a34a',
        marginTop: 16,
        marginBottom: 8,
    },
    paragraph: {
        fontSize: 15,
        lineHeight: 24,
        color: '#475569',
        marginBottom: 12,
    },
    list: {
        marginLeft: 8,
        marginBottom: 12,
    },
    listItem: {
        fontSize: 15,
        lineHeight: 24,
        color: '#475569',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

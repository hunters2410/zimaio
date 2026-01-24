import { StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import Colors from '@/constants/Colors';

export default function TermsScreen() {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const [content, setContent] = useState<string | null>(null);
    const [title, setTitle] = useState('Terms & Conditions');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTerms();
    }, []);

    const fetchTerms = async () => {
        try {
            // Updated to match the "create_documentation_system" migration table structure
            const { data, error } = await supabase
                .from('documentation_sections')
                .select('title, content')
                .eq('slug', 'terms-and-conditions')
                .eq('is_published', true)
                .single();

            if (error) throw error;

            if (data) {
                setTitle(data.title);
                setContent(data.content);
            }
        } catch (error) {
            console.log('Error fetching terms:', error);
            // Fallback is default static content below if content state remains null
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
                        <Text style={[styles.heading, { color: colors.primary }]}>1. Acceptance of Terms</Text>
                        <Text style={[styles.paragraph, { color: colors.text }]}>
                            By accessing and using ZimAIO, you accept and agree to be bound by the terms and provisions
                            of this agreement. If you do not agree to these terms, please do not use our services.
                        </Text>

                        <Text style={[styles.heading, { color: colors.primary }]}>2. User Accounts</Text>
                        <Text style={[styles.paragraph, { color: colors.text }]}>
                            To use certain features of the platform, you must register for an account. You are responsible
                            for maintaining the confidentiality of your account credentials and for all activities that
                            occur under your account.
                        </Text>

                        <Text style={[styles.heading, { color: colors.primary }]}>3. Vendor Obligations</Text>
                        <Text style={[styles.paragraph, { color: colors.text }]}>
                            Vendors agree to provide accurate product descriptions and pricing, fulfill orders in a timely manner,
                            comply with all applicable laws, and not engage in fraudulent or misleading practices.
                        </Text>

                        <Text style={[styles.heading, { color: colors.primary }]}>4. Customer Obligations</Text>
                        <Text style={[styles.paragraph, { color: colors.text }]}>
                            Customers agree to provide accurate information for orders, make timely payments, and
                            not engage in fraudulent activities or abuse of the platform.
                        </Text>

                        <Text style={[styles.heading, { color: colors.primary }]}>5. Payments and Refunds</Text>
                        <Text style={[styles.paragraph, { color: colors.text }]}>
                            All payments are processed securely through our payment providers. Refund policies are
                            determined by individual vendors and must comply with applicable consumer protection laws.
                        </Text>

                        <Text style={[styles.heading, { color: colors.primary }]}>6. Intellectual Property</Text>
                        <Text style={[styles.paragraph, { color: colors.text }]}>
                            The ZimAIO platform and its content are protected by copyright and other intellectual
                            property rights. You may not use our content without permission.
                        </Text>

                        <Text style={[styles.heading, { color: colors.primary }]}>7. Limitation of Liability</Text>
                        <Text style={[styles.paragraph, { color: colors.text }]}>
                            ZimAIO acts as a marketplace platform connecting vendors and customers. We are not responsible
                            for the quality, safety, or legality of products listed by vendors.
                        </Text>

                        <Text style={[styles.heading, { color: colors.primary }]}>8. Contact Information</Text>
                        <Text style={[styles.paragraph, { color: colors.text }]}>
                            For questions about these terms, please contact us at legal@zimaio.com or through our
                            contact page.
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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

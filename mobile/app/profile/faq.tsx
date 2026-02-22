import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useState, useEffect } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { supabase } from '@/lib/supabase';

export default function FAQScreen() {
    const [faqs, setFaqs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    useEffect(() => {
        fetchFaqs();
    }, []);

    const fetchFaqs = async () => {
        try {
            const { data, error } = await supabase
                .from('faqs')
                .select('*')
                .eq('is_published', true)
                .order('order_index', { ascending: true });

            if (error) throw error;
            setFaqs(data || []);
        } catch (err) {
            console.error('Error fetching faqs:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (index: number) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#16a34a" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.header}>Frequently Asked Questions</Text>

            {faqs.map((faq, index) => (
                <View key={index} style={styles.item}>
                    <TouchableOpacity
                        style={styles.questionContainer}
                        onPress={() => toggleExpand(index)}
                    >
                        <Text style={styles.question}>{faq.question}</Text>
                        <FontAwesome
                            name={expandedIndex === index ? "angle-up" : "angle-down"}
                            size={16}
                            color="#9da4b0"
                        />
                    </TouchableOpacity>
                    {expandedIndex === index && (
                        <View style={styles.answerContainer}>
                            <Text style={styles.answer}>{faq.answer}</Text>
                        </View>
                    )}
                </View>
            ))}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    header: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 20,
    },
    item: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    questionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    question: {
        fontSize: 16,
        fontWeight: '600',
        color: '#334155',
        flex: 1,
        marginRight: 10,
    },
    answerContainer: {
        padding: 16,
        paddingTop: 0,
        backgroundColor: '#f8fafc',
    },
    answer: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
    },
});

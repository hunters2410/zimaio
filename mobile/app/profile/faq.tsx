import { StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function FAQScreen() {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const faqs = [
        {
            question: "How do I place an order?",
            answer: "Simply browse our products, add the items you love to your cart, and proceed to checkout. You can pay securely using various payment methods."
        },
        {
            question: "What payment methods do you accept?",
            answer: "We accept Visa, Mastercard, EcoCash, and other local payment methods."
        },
        {
            question: "How can I track my order?",
            answer: "Once your order is shipped, you will receive a tracking number via email/SMS. You can track your order status in the 'My Orders' section."
        },
        {
            question: "Do you offer international shipping?",
            answer: "Currently, we only ship within Zimbabwe. We are working on expanding our shipping options soon."
        },
        {
            question: "What is your return policy?",
            answer: "You can return items within 7 days of delivery if they are damaged or incorrect. Please visit our Return Policy page for more details."
        },
    ];

    const toggleExpand = (index: number) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

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

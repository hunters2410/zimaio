import { StyleSheet, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';

export default function ReturnScreen() {
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.section}>
                <Text style={styles.title}>Return Policy</Text>

                <Text style={styles.heading}>Return Eligibility</Text>
                <Text style={styles.paragraph}>
                    Items may be returned within 7 days of delivery if they are damaged, defective, or incorrect. To be eligible for a return, your item must be unused and in the same condition that you received it. It must also be in the original packaging.
                </Text>

                <Text style={styles.heading}>Non-Returnable Items</Text>
                <Text style={styles.paragraph}>
                    Certain types of items cannot be returned, like perishable goods (such as food, flowers, or plants), custom products (such as special orders or personalized items), and personal care goods (such as beauty products).
                </Text>

                <Text style={styles.heading}>Refund Process</Text>
                <Text style={styles.paragraph}>
                    Once your return is received and inspected, we will send you an email to notify you that we have received your returned item. We will also notify you of the approval or rejection of your refund. If you are approved, then your refund will be processed, and a credit will automatically be applied to your credit card or original method of payment, within a certain amount of days.
                </Text>

                <Text style={styles.heading}>Exchanges</Text>
                <Text style={styles.paragraph}>
                    We only replace items if they are defective or damaged. If you need to exchange it for the same item, send us an email at support@zimaio.com.
                </Text>
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
        marginBottom: 16,
        color: '#1e293b',
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
});

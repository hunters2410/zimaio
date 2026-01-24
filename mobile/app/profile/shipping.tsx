import { StyleSheet, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';

export default function ShippingScreen() {
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.section}>
                <Text style={styles.title}>Shipping Policy</Text>

                <Text style={styles.heading}>Shipping Methods</Text>
                <Text style={styles.paragraph}>
                    We offer various shipping methods to suit your needs. Shipping costs and delivery times may vary depending on the shipping method selected and your location.
                </Text>

                <Text style={styles.heading}>Delivery Times</Text>
                <Text style={styles.paragraph}>
                    Standard delivery typically takes 3-5 business days. Express delivery options are available for faster shipping. Please note that delivery times are estimates and may be subject to delays.
                </Text>

                <Text style={styles.heading}>Tracking Your Order</Text>
                <Text style={styles.paragraph}>
                    Once your order is shipped, you will receive a tracking number to monitor the status of your delivery. You can track your order through our website or mobile app.
                </Text>

                <Text style={styles.heading}>Shipping Rates</Text>
                <Text style={styles.paragraph}>
                    Shipping rates are calculated based on the weight and dimensions of your order, as well as the destination. You can view the shipping cost at checkout before completing your purchase.
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

import { StyleSheet, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';

export default function AboutScreen() {
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.section}>
                <Text style={styles.title}>About ZimAIo</Text>
                <Text style={styles.paragraph}>
                    Welcome to ZimAIo, your premier destination for quality products and exceptional service.
                    We connect you with the best vendors and provide a seamless shopping experience tailored to your needs.
                </Text>
                <Text style={styles.paragraph}>
                    Our mission is to empower local businesses and provide customers with access to a wide range of goods
                    at competitive prices. Whether you are looking for electronics, fashion, or home essentials,
                    ZimAIo has you covered.
                </Text>
                <Text style={styles.paragraph}>
                    Thank you for choosing ZimAIo. We are committed to excellence and innovation in everything we do.
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
        color: '#16a34a',
    },
    paragraph: {
        fontSize: 16,
        lineHeight: 24,
        color: '#475569',
        marginBottom: 12,
    },
});

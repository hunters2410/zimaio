import { StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Text, View } from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function ContactScreen() {
    const contacts = [
        { icon: 'phone', label: 'Call Us', value: '+263 77 123 4567', action: () => Linking.openURL('tel:+263771234567') },
        { icon: 'envelope', label: 'Email Us', value: 'support@zimaio.com', action: () => Linking.openURL('mailto:support@zimaio.com') },
        { icon: 'whatsapp', label: 'WhatsApp', value: '+263 77 123 4567', action: () => Linking.openURL('https://wa.me/263771234567') },
        { icon: 'map-marker', label: 'Visit Us', value: '123 Main Street, Harare, Zimbabwe', action: () => { } },
    ];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.title}>Get in Touch</Text>
                <Text style={styles.subtitle}>We are here to help you</Text>
            </View>

            <View style={styles.list}>
                {contacts.map((item, index) => (
                    <TouchableOpacity key={index} style={styles.item} onPress={item.action}>
                        <View style={styles.iconContainer}>
                            <FontAwesome name={item.icon as any} size={20} color="#16a34a" />
                        </View>
                        <View style={styles.info}>
                            <Text style={styles.label}>{item.label}</Text>
                            <Text style={styles.value}>{item.value}</Text>
                        </View>
                        <FontAwesome name="angle-right" size={16} color="#cbd5e1" />
                    </TouchableOpacity>
                ))}
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
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
    },
    list: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0fdf4',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    info: {
        flex: 1,
    },
    label: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 2,
    },
    value: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
    },
});

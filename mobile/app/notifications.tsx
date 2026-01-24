import { StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';

// Mock notifications if DB table not ready
const MOCK_NOTIFICATIONS = [
    { id: '1', title: 'Order Shipped', message: 'Your order #12345 has been shipped!', date: '2025-01-20', read: false },
    { id: '2', title: 'New Product Arrival', message: 'Check out the new iPhone 16 in stock now.', date: '2025-01-18', read: true },
    { id: '3', title: 'Flash Sale', message: '50% off on all electronics this weekend!', date: '2025-01-15', read: true },
];

export default function NotificationsScreen() {
    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.item, !item.read && styles.unreadItem]}
            onPress={() => markAsRead(item.id)}
        >
            <View style={styles.iconContainer}>
                <FontAwesome name="bell" size={20} color={item.read ? '#9ca3af' : '#16a34a'} />
            </View>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={[styles.title, !item.read && styles.unreadTitle]}>{item.title}</Text>
                    <Text style={styles.date}>{item.date}</Text>
                </View>
                <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
            </View>
            {!item.read && <View style={styles.dot} />}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <FontAwesome name="bell-slash" size={40} color="#cbd5e1" />
                        <Text style={styles.emptyText}>No notifications yet</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    list: {
        padding: 16,
    },
    item: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    unreadItem: {
        backgroundColor: '#f0fdf4',
        borderLeftWidth: 4,
        borderLeftColor: '#16a34a',
    },
    iconContainer: {
        marginRight: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
    },
    unreadTitle: {
        color: '#16a34a',
        fontWeight: '700',
    },
    date: {
        fontSize: 12,
        color: '#94a3b8',
    },
    message: {
        fontSize: 14,
        color: '#64748b',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#16a34a',
        marginLeft: 8,
    },
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 16,
        color: '#94a3b8',
        fontSize: 16,
    },
});

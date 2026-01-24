import { useEffect, useState } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { supabase } from '@/lib/supabase';
import { Stack, useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function OrdersScreen() {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('customer_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return '#10b981'; // green
            case 'pending': return '#f59e0b'; // amber
            case 'processing': return '#3b82f6'; // blue
            case 'cancelled': return '#ef4444'; // red
            default: return colors.textSecondary;
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push(`/orders/${item.id}`)}
        >
            <View style={styles.cardHeader}>
                <Text style={[styles.orderId, { color: colors.text }]}>Order #{item.id.slice(0, 8)}</Text>
                <Text style={[styles.status, { color: getStatusColor(item.status) }]}>{item.status.toUpperCase()}</Text>
            </View>
            <View style={styles.cardBody}>
                <Text style={[styles.date, { color: colors.textSecondary }]}>
                    {new Date(item.created_at).toLocaleDateString()}
                </Text>
                <Text style={[styles.total, { color: colors.primary }]}>
                    ${item.total.toFixed(2)}
                </Text>
            </View>
            <View style={styles.cardFooter}>
                <Text style={{ color: colors.textSecondary }}>
                    {item.payment_status === 'paid' ? 'Paid' : 'Payment Pending'}
                </Text>
                <FontAwesome name="chevron-right" size={14} color={colors.textSecondary} />
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ title: 'My Orders' }} />

            {orders.length === 0 ? (
                <View style={styles.center}>
                    <Text style={{ color: colors.textSecondary, fontSize: 16 }}>No orders found.</Text>
                    <TouchableOpacity
                        style={[styles.shopBtn, { backgroundColor: colors.primary }]}
                        onPress={() => router.push('/(tabs)/explore')}
                    >
                        <Text style={styles.shopBtnText}>Start Shopping</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
    },
    card: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    orderId: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    status: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    cardBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    date: {
        fontSize: 14,
    },
    total: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#eee', // Consider dynamic color for dark mode border
    },
    shopBtn: {
        marginTop: 20,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 24,
    },
    shopBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

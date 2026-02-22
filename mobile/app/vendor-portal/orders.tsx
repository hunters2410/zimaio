import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Colors from '@/constants/Colors';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function VendorOrdersScreen() {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<any[]>([]);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: vendor } = await supabase
                .from('vendor_profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!vendor) return;

            // 1. Get all products associated with this vendor
            const { data: productIds } = await supabase
                .from('products')
                .select('id')
                .eq('vendor_id', vendor.id);

            const ids = productIds?.map(p => p.id) || [];

            if (ids.length === 0) {
                setLoading(false);
                return;
            }

            // 2. Fetch order items for these products, including order details and product details
            const { data: orderItems } = await supabase
                .from('order_items')
                .select(`
                    *,
                    order:orders (*),
                    product:products (name, images)
                `)
                .in('product_id', ids)
                .order('created_at', { ascending: false });

            // Group by Order or just show list of items to fulfill?
            // Usually vendors want to see "Orders". Since an order might contain items from multiple vendors,
            // we should probably group by Order ID but only show relevant items.

            // For simplicity in this MVP, let's list the distinct "Order Items" as "Sales" 
            // because shipping might be per-item or handled by the platform.
            // If we want to group:

            const grouped = new Map();
            orderItems?.forEach((item: any) => {
                if (!grouped.has(item.order_id)) {
                    grouped.set(item.order_id, {
                        ...item.order,
                        items: []
                    });
                }
                grouped.get(item.order_id).items.push(item);
            });

            setOrders(Array.from(grouped.values()));

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchOrders();
        setRefreshing(false);
    };

    const renderOrder = ({ item }: { item: any }) => {
        const vendorTotal = item.items.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);

        return (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.header}>
                    <Text style={[styles.orderId, { color: colors.text }]}>Order #{item.id.slice(0, 8)}</Text>
                    <Text style={[styles.date, { color: colors.textSecondary }]}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
                <View style={styles.statusRow}>
                    <View style={[styles.statusBadge, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.statusItem, { color: colors.primary }]}>{item.status}</Text>
                    </View>
                    <Text style={[styles.total, { color: colors.text }]}>Earned: ${vendorTotal.toFixed(2)}</Text>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {item.items.map((orderItem: any, idx: number) => (
                    <View key={idx} style={styles.itemRow}>
                        <Text style={[styles.itemName, { color: colors.text }]}>
                            {orderItem.quantity}x {orderItem.product?.name}
                        </Text>
                        <Text style={[styles.itemPrice, { color: colors.textSecondary }]}>
                            ${(orderItem.price * orderItem.quantity).toFixed(2)}
                        </Text>
                    </View>
                ))}
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderOrder}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: 16 }}
                    onRefresh={onRefresh}
                    refreshing={refreshing}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: colors.textSecondary }}>No orders yet.</Text>}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    card: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    orderId: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    date: {
        fontSize: 14,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    statusItem: {
        fontWeight: '600',
        textTransform: 'uppercase',
        fontSize: 12,
    },
    total: {
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        marginVertical: 8,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    itemName: {
        flex: 1,
        fontSize: 14,
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: '500',
    },
});

import { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, Image } from 'react-native';
import { Text, View } from '@/components/Themed';
import { supabase } from '@/lib/supabase';
import { Stack, useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function OrderDetailsScreen() {
    const { id } = useLocalSearchParams();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const [order, setOrder] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchOrderDetails();
    }, [id]);

    const fetchOrderDetails = async () => {
        try {
            // Fetch Order
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select('*, shipping_methods(*)')
                .eq('id', id)
                .single();

            if (orderError) throw orderError;

            // Fetch Items
            const { data: itemsData, error: itemsError } = await supabase
                .from('order_items')
                .select('*, product:product_id(*)')
                .eq('order_id', id);

            if (itemsError) throw itemsError;

            setOrder(orderData);
            setItems(itemsData || []);

        } catch (error) {
            console.error('Error fetching order details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!order) return <View style={styles.center}><Text>Order not found</Text></View>;

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ title: `Order #${order.id.slice(0, 8)}` }} />

            {/* Order Info */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
                <Text style={[styles.header, { color: colors.text }]}>Order Information</Text>
                <View style={styles.row}>
                    <Text style={{ color: colors.textSecondary }}>Date</Text>
                    <Text style={{ color: colors.text }}>{new Date(order.created_at).toLocaleString()}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={{ color: colors.textSecondary }}>Status</Text>
                    <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{order.status.toUpperCase()}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={{ color: colors.textSecondary }}>Payment Status</Text>
                    <Text style={{ color: order.payment_status === 'paid' ? '#10b981' : '#f59e0b' }}>
                        {order.payment_status.toUpperCase()}
                    </Text>
                </View>
            </View>

            {/* Shipping Info */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
                <Text style={[styles.header, { color: colors.text }]}>Shipping Details</Text>
                {order.shipping_address?.street ? (
                    <>
                        <Text style={{ color: colors.text }}>{order.shipping_address.street}</Text>
                        <Text style={{ color: colors.text }}>{order.shipping_address.city}, {order.shipping_address.state}</Text>
                    </>
                ) : (
                    <Text style={{ color: colors.text }}>Store Pickup</Text>
                )}
            </View>

            {/* Items */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
                <Text style={[styles.header, { color: colors.text }]}>Items</Text>
                {items.map((item) => (
                    <View key={item.id} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
                        <Image
                            source={{ uri: item.product?.image_url || 'https://via.placeholder.com/60' }}
                            style={styles.itemImage}
                        />
                        <View style={styles.itemInfo}>
                            <Text style={[styles.itemName, { color: colors.text }]}>{item.product?.title || 'Unknown Product'}</Text>
                            <Text style={{ color: colors.textSecondary }}>Qty: {item.quantity}</Text>
                        </View>
                        <Text style={[styles.itemPrice, { color: colors.text }]}>${item.unit_price.toFixed(2)}</Text>
                    </View>
                ))}
            </View>

            {/* Price Summary */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
                <View style={styles.row}>
                    <Text style={{ color: colors.textSecondary }}>Subtotal</Text>
                    <Text style={{ color: colors.text }}>${order.subtotal.toFixed(2)}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={{ color: colors.textSecondary }}>Tax</Text>
                    <Text style={{ color: colors.text }}>${order.tax_total.toFixed(2)}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={{ color: colors.textSecondary }}>Shipping</Text>
                    <Text style={{ color: colors.text }}>${order.shipping_total.toFixed(2)}</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.row}>
                    <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
                    <Text style={[styles.totalAmount, { color: colors.primary }]}>${order.total.toFixed(2)}</Text>
                </View>
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    header: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    itemRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        borderBottomWidth: 1,
        alignItems: 'center',
    },
    itemImage: {
        width: 50,
        height: 50,
        borderRadius: 8,
        marginRight: 12,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontWeight: '600',
        marginBottom: 4,
    },
    itemPrice: {
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        marginVertical: 12,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: '900',
    },
});

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Colors from '@/constants/Colors';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function VendorWalletScreen() {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState({ totalContext: 0, pending: 0, available: 0 });

    useEffect(() => {
        fetchWallet();
    }, []);

    const fetchWallet = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: vendor } = await supabase.from('vendor_profiles').select('id').eq('user_id', user.id).single();
            if (!vendor) return;

            // Get all products
            const { data: products } = await supabase.from('products').select('id').eq('vendor_id', vendor.id);
            const productIds = products?.map(p => p.id) || [];

            if (productIds.length > 0) {
                // Get all sales
                const { data: sales } = await supabase
                    .from('order_items')
                    .select('quantity, price') // assuming order_status is on item or joined
                    .in('product_id', productIds);

                // If status is not on item, we might need to join orders.
                // For MVP let's assume all sales are "Pending" if we can't easily check status, 
                // or just sum everything as "Lifetime Sales".

                let total = 0;
                let pending = 0;

                sales?.forEach((sale: any) => {
                    total += (sale.price * sale.quantity);
                    // Mock logic for pending vs available
                    // pending += ...
                });

                setBalance({
                    totalContext: total,
                    pending: total * 0.3, // Mock 30% pending
                    available: total * 0.7 // Mock 70% available
                });
            }

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 20 }}>
            <View style={[styles.card, { backgroundColor: colors.primary }]}>
                <Text style={styles.cardLabel}>Available Balance</Text>
                <Text style={styles.cardValue}>${balance.available.toFixed(2)}</Text>
                <Text style={styles.cardSub}>Lifetime Sales: ${balance.totalContext.toFixed(2)}</Text>
            </View>

            <View style={styles.row}>
                <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>${balance.pending.toFixed(2)}</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Withdrawn</Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>$0.00</Text>
                </View>
            </View>

            <TouchableOpacity style={[styles.withdrawBtn, { backgroundColor: colors.success }]}>
                <FontAwesome name="bank" size={20} color="#fff" style={{ marginRight: 10 }} />
                <Text style={styles.btnText}>Request Payout</Text>
            </TouchableOpacity>

            <Text style={[styles.historyTitle, { color: colors.text }]}>Recent Transactions</Text>
            <View style={{ alignItems: 'center', marginTop: 20 }}>
                <Text style={{ color: colors.textSecondary }}>No transactions yet.</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    card: {
        padding: 24,
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: 24,
        elevation: 4,
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    cardLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 16,
        marginBottom: 8,
        fontWeight: '600',
    },
    cardValue: {
        color: '#fff',
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    cardSub: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
    },
    row: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 14,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    withdrawBtn: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    btnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    historyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
});

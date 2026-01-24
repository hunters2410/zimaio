import { useState, useEffect } from 'react';
import { StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { Text, View } from '@/components/Themed';
import { supabase } from '@/lib/supabase';
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import Colors from '@/constants/Colors';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface WalletData {
    id: string;
    balance_usd: number;
    balance_zig: number;
    total_earned: number;
    total_withdrawn: number;
}

interface Transaction {
    id: string;
    transaction_type: string;
    amount: number;
    currency: string;
    description: string;
    created_at: string;
    status: string;
}

export default function WalletScreen() {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const [wallet, setWallet] = useState<WalletData | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchWalletData();
    }, []);

    const fetchWalletData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get or create wallet
            let { data: walletData, error: walletError } = await supabase
                .from('wallets')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (walletError && walletError.code === 'PGRST116') {
                const { data: newWallet, error: createError } = await supabase
                    .from('wallets')
                    .insert([{ user_id: user.id, balance_usd: 0, balance_zig: 0 }])
                    .select()
                    .single();
                if (createError) throw createError;
                walletData = newWallet;
            } else if (walletError) {
                throw walletError;
            }

            setWallet({
                id: walletData.id,
                balance_usd: Number(walletData.balance_usd) || 0,
                balance_zig: Number(walletData.balance_zig) || 0,
                total_earned: Number(walletData.total_earned) || 0,
                total_withdrawn: Number(walletData.total_withdrawn) || 0
            });

            // Fetch transactions
            // Note: Check if 'wallet_transactions_detailed' view exists or use 'wallet_transactions'
            // The web app uses 'wallet_transactions_detailed', so we try that.
            const { data: transData, error: transError } = await supabase
                .from('wallet_transactions_detailed')
                .select('*')
                .eq('wallet_id', walletData.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (!transError) {
                setTransactions(transData || []);
            } else {
                // Fallback to base table if view access issue
                const { data: baseTrans, error: baseError } = await supabase
                    .from('wallet_transactions')
                    .select('*')
                    .eq('wallet_id', walletData.id)
                    .order('created_at', { ascending: false })
                    .limit(20);
                if (!baseError) setTransactions(baseTrans || []);
            }

        } catch (error) {
            console.log('Error fetching wallet:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchWalletData();
    };

    if (loading && !wallet) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
            <Stack.Screen options={{ title: 'My Wallet' }} />

            {/* Balance Cards */}
            <View style={styles.grid}>
                {/* USD Card */}
                <View style={[styles.card, { backgroundColor: '#1e293b' }]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                            <FontAwesome name="dollar" size={16} color="#22d3ee" />
                        </View>
                        <Text style={[styles.cardTitle, { color: '#22d3ee' }]}>USD BALANCE</Text>
                    </View>
                    <Text style={[styles.balance, { color: '#fff' }]}>
                        ${wallet?.balance_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Text>
                </View>

                {/* ZIG Card */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(8, 145, 178, 0.1)' }]}>
                            <FontAwesome name="refresh" size={16} color={colors.primary} />
                        </View>
                        <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>ZIG TREASURY</Text>
                    </View>
                    <Text style={[styles.balance, { color: colors.text }]}>
                        {wallet?.balance_zig.toLocaleString()} <Text style={{ fontSize: 14 }}>ZIG</Text>
                    </Text>
                </View>
            </View>

            {/* Transactions */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>

                {transactions.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={{ color: colors.textSecondary }}>No transactions yet.</Text>
                    </View>
                ) : (
                    transactions.map((tx) => (
                        <View key={tx.id} style={[styles.txItem, { borderBottomColor: colors.border }]}>
                            <View style={styles.txLeft}>
                                <View style={[
                                    styles.txIcon,
                                    { backgroundColor: tx.amount > 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)' }
                                ]}>
                                    <FontAwesome
                                        name={tx.amount > 0 ? "arrow-down" : "arrow-up"}
                                        size={14}
                                        color={tx.amount > 0 ? "#16a34a" : "#ef4444"}
                                    />
                                </View>
                                <View>
                                    <Text style={[styles.txDesc, { color: colors.text }]}>{tx.description || tx.transaction_type}</Text>
                                    <Text style={[styles.txDate, { color: colors.textSecondary }]}>
                                        {new Date(tx.created_at).toLocaleDateString()}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.txRight}>
                                <Text style={[
                                    styles.txAmount,
                                    { color: tx.amount > 0 ? "#16a34a" : colors.text }
                                ]}>
                                    {tx.amount > 0 ? '+' : ''}{tx.amount} {tx.currency}
                                </Text>
                                <Text style={[styles.txStatus, { color: colors.textSecondary }]}>{tx.status}</Text>
                            </View>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
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
    content: {
        padding: 16,
        paddingBottom: 40,
    },
    grid: {
        marginBottom: 24,
        gap: 16,
    },
    card: {
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    cardTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    balance: {
        fontSize: 32,
        fontWeight: '900',
    },
    section: {
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    emptyState: {
        padding: 20,
        alignItems: 'center',
    },
    txItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    txLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    txIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    txDesc: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    txDate: {
        fontSize: 11,
    },
    txRight: {
        alignItems: 'flex-end',
    },
    txAmount: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    txStatus: {
        fontSize: 10,
        textTransform: 'uppercase',
    },
});

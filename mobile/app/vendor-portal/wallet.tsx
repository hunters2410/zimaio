import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Modal, TextInput, Alert
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Colors from '@/constants/Colors';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface WalletData {
    balance_usd: number;
    balance_zig: number;
    total_earned: number;
    total_withdrawn: number;
}

interface WithdrawalRequest {
    id: string;
    amount: number;
    currency: string;
    status: 'pending' | 'approved' | 'completed' | 'rejected';
    net_amount: number;
    withdrawal_charges: number;
    requested_at: string;
    rejection_reason: string | null;
}

export default function VendorWalletScreen() {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const [loading, setLoading] = useState(true);
    const [wallet, setWallet] = useState<WalletData>({
        balance_usd: 0,
        balance_zig: 0,
        total_earned: 0,
        total_withdrawn: 0,
    });
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    // Payout form state
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [accountDetails, setAccountDetails] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            setUserId(user.id);

            // Fetch real wallet balance from the wallets table
            const { data: walletData } = await supabase
                .from('wallets')
                .select('balance_usd, balance_zig, total_earned, total_withdrawn')
                .eq('user_id', user.id)
                .single();

            if (walletData) {
                setWallet({
                    balance_usd: Number(walletData.balance_usd) || 0,
                    balance_zig: Number(walletData.balance_zig) || 0,
                    total_earned: Number(walletData.total_earned) || 0,
                    total_withdrawn: Number(walletData.total_withdrawn) || 0,
                });
            }

            // Fetch real withdrawal history from withdrawal_requests table
            const { data: withdrawalData } = await supabase
                .from('withdrawal_requests')
                .select('id, amount, currency, status, net_amount, withdrawal_charges, requested_at, rejection_reason')
                .eq('vendor_id', user.id)
                .order('requested_at', { ascending: false })
                .limit(20);

            setWithdrawals(withdrawalData || []);
        } catch (error) {
            console.error('Error loading wallet:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateCharges = (val: number) => parseFloat((val * 0.02).toFixed(2));

    const handleRequestPayout = async () => {
        const numAmount = parseFloat(amount);

        if (!amount || isNaN(numAmount)) {
            Alert.alert('Invalid Amount', 'Please enter a valid withdrawal amount.');
            return;
        }
        if (numAmount < 10) {
            Alert.alert('Minimum Amount', 'The minimum withdrawal amount is $10.');
            return;
        }
        if (numAmount > wallet.balance_usd) {
            Alert.alert('Insufficient Balance', `You only have $${wallet.balance_usd.toFixed(2)} available.`);
            return;
        }
        if (!paymentMethod.trim()) {
            Alert.alert('Payment Method Required', 'Please provide your payment method (e.g. EcoCash, Bank Transfer).');
            return;
        }
        if (!accountDetails.trim()) {
            Alert.alert('Account Details Required', 'Please enter your account details so we can process the payment.');
            return;
        }

        setSubmitting(true);
        try {
            const charges = calculateCharges(numAmount);
            const netAmount = numAmount - charges;

            const { error } = await supabase
                .from('withdrawal_requests')
                .insert({
                    vendor_id: userId,
                    amount: numAmount,
                    currency: 'USD',
                    withdrawal_charges: charges,
                    net_amount: netAmount,
                    payment_method: paymentMethod,
                    account_details: { details: accountDetails },
                    status: 'pending',
                });

            if (error) throw error;

            // Reset form and close modal
            setAmount('');
            setPaymentMethod('');
            setAccountDetails('');
            setShowModal(false);

            // Refresh wallet data so balance and history update
            await loadData();

            Alert.alert(
                'Request Submitted ✓',
                'Your payout request has been submitted and is awaiting admin approval. Processing takes 1–3 business days.'
            );
        } catch (error: any) {
            Alert.alert('Submission Failed', error.message || 'Failed to submit payout request. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return '#16a34a';
            case 'approved': return '#2563eb';
            case 'rejected': return '#dc2626';
            default: return '#d97706'; // pending
        }
    };

    const numAmount = parseFloat(amount) || 0;
    const charges = calculateCharges(numAmount);
    const netReceive = numAmount - charges;

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        >
            {/* Main Balance Card */}
            <View style={[styles.card, { backgroundColor: colors.primary }]}>
                <Text style={styles.cardLabel}>Available Balance (USD)</Text>
                <Text style={styles.cardValue}>${wallet.balance_usd.toFixed(2)}</Text>
                <Text style={styles.cardSub}>Total Withdrawn: ${wallet.total_withdrawn.toFixed(2)}</Text>
            </View>

            {/* Secondary Stats */}
            <View style={styles.row}>
                <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>ZIG Balance</Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>{wallet.balance_zig.toFixed(2)}</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Earned</Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>${wallet.total_earned.toFixed(2)}</Text>
                </View>
            </View>

            {/* Request Payout Button — now has onPress */}
            <TouchableOpacity
                style={[styles.withdrawBtn, { backgroundColor: colors.success }]}
                onPress={() => setShowModal(true)}
                activeOpacity={0.85}
            >
                <FontAwesome name="bank" size={20} color="#fff" style={{ marginRight: 10 }} />
                <Text style={styles.btnText}>Request Payout</Text>
            </TouchableOpacity>

            {/* Fee Info */}
            <View style={[styles.infoBox, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}>
                <FontAwesome name="info-circle" size={14} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.infoText, { color: colors.primary }]}>
                    Min payout: $10  •  2% processing fee  •  1–3 business days
                </Text>
            </View>

            {/* Withdrawal History */}
            <Text style={[styles.historyTitle, { color: colors.text }]}>Withdrawal History</Text>

            {withdrawals.length === 0 ? (
                <View style={styles.emptyState}>
                    <FontAwesome name="history" size={32} color={colors.textSecondary} style={{ marginBottom: 8 }} />
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No payout requests yet.</Text>
                </View>
            ) : (
                withdrawals.map((item) => (
                    <View
                        key={item.id}
                        style={[styles.historyItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                        <View style={styles.historyRow}>
                            <Text style={[styles.historyAmount, { color: colors.text }]}>
                                ${item.amount.toFixed(2)} {item.currency}
                            </Text>
                            <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                                <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>
                                    {item.status.toUpperCase()}
                                </Text>
                            </View>
                        </View>
                        <Text style={[styles.historyMeta, { color: colors.textSecondary }]}>
                            Net: ${item.net_amount.toFixed(2)}  •  Fee: ${item.withdrawal_charges.toFixed(2)}
                        </Text>
                        <Text style={[styles.historyMeta, { color: colors.textSecondary }]}>
                            {new Date(item.requested_at).toLocaleDateString()}
                        </Text>
                        {item.rejection_reason ? (
                            <Text style={[styles.historyMeta, { color: '#dc2626', marginTop: 4 }]}>
                                Reason: {item.rejection_reason}
                            </Text>
                        ) : null}
                    </View>
                ))
            )}

            {/* ─── Payout Request Modal ─── */}
            <Modal
                visible={showModal}
                animationType="slide"
                transparent
                presentationStyle="overFullScreen"
                onRequestClose={() => setShowModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>

                        {/* Modal Header */}
                        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                            <View>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>Request Payout</Text>
                                <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
                                    Available: ${wallet.balance_usd.toFixed(2)} USD
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeBtn}>
                                <FontAwesome name="times" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={styles.modalBody}>

                            {/* Amount Field */}
                            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                                WITHDRAWAL AMOUNT (USD) *
                            </Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                placeholder="Enter amount (min $10)"
                                placeholderTextColor={colors.textSecondary}
                                keyboardType="decimal-pad"
                                value={amount}
                                onChangeText={setAmount}
                            />

                            {/* Live Fee Breakdown */}
                            {numAmount >= 10 && (
                                <View style={[styles.calcBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                    <View style={styles.calcRow}>
                                        <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>Withdrawal Amount</Text>
                                        <Text style={[styles.calcValue, { color: colors.text }]}>${numAmount.toFixed(2)}</Text>
                                    </View>
                                    <View style={styles.calcRow}>
                                        <Text style={[styles.calcLabel, { color: '#dc2626' }]}>Processing Fee (2%)</Text>
                                        <Text style={[styles.calcValue, { color: '#dc2626' }]}>-${charges.toFixed(2)}</Text>
                                    </View>
                                    <View style={[styles.calcRow, styles.calcTotal, { borderTopColor: colors.border }]}>
                                        <Text style={[styles.calcLabel, { color: colors.primary, fontWeight: 'bold' }]}>You Will Receive</Text>
                                        <Text style={[styles.calcValue, { color: colors.primary, fontWeight: 'bold' }]}>${netReceive.toFixed(2)}</Text>
                                    </View>
                                </View>
                            )}

                            {/* Payment Method Field */}
                            <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 16 }]}>
                                PAYMENT METHOD *
                            </Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                placeholder="e.g. EcoCash, Bank Transfer, PayPal"
                                placeholderTextColor={colors.textSecondary}
                                value={paymentMethod}
                                onChangeText={setPaymentMethod}
                            />

                            {/* Account Details Field */}
                            <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 16 }]}>
                                ACCOUNT DETAILS *
                            </Text>
                            <TextInput
                                style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                placeholder="Account number, name, phone number, etc."
                                placeholderTextColor={colors.textSecondary}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                                value={accountDetails}
                                onChangeText={setAccountDetails}
                            />

                            {/* Warning Note */}
                            <View style={styles.warningBox}>
                                <Text style={styles.warningText}>
                                    Your request will be reviewed by an admin. You'll be notified once processed (1–3 business days).
                                </Text>
                            </View>
                        </ScrollView>

                        {/* Modal Footer Buttons */}
                        <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                            <TouchableOpacity
                                style={[styles.footerBtn, { backgroundColor: colors.background }]}
                                onPress={() => setShowModal(false)}
                                disabled={submitting}
                            >
                                <Text style={{ color: colors.textSecondary, fontWeight: 'bold', fontSize: 14 }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.footerBtn, styles.submitBtn, { backgroundColor: colors.success, opacity: submitting ? 0.6 : 1 }]}
                                onPress={handleRequestPayout}
                                disabled={submitting}
                                activeOpacity={0.85}
                            >
                                {submitting ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Submit Request</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                    </View>
                </View>
            </Modal>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: {
        padding: 24,
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: 16,
        elevation: 4,
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    cardLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 6, fontWeight: '600' },
    cardValue: { color: '#fff', fontSize: 36, fontWeight: 'bold', marginBottom: 6 },
    cardSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
    row: { flexDirection: 'row', gap: 16, marginBottom: 16 },
    statCard: { flex: 1, padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
    statLabel: { fontSize: 12, marginBottom: 4 },
    statValue: { fontSize: 18, fontWeight: 'bold' },
    withdrawBtn: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        elevation: 3,
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 24,
    },
    infoText: { fontSize: 12, flex: 1, lineHeight: 18 },
    historyTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
    emptyState: { alignItems: 'center', marginTop: 20, padding: 24 },
    historyItem: {
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 12,
    },
    historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    historyAmount: { fontSize: 16, fontWeight: 'bold' },
    historyMeta: { fontSize: 12, marginTop: 2 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    badgeText: { fontSize: 10, fontWeight: 'bold' },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    modalSub: { fontSize: 12, marginTop: 2 },
    closeBtn: { padding: 6 },
    modalBody: { padding: 20, paddingBottom: 8 },
    fieldLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 6 },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        marginBottom: 4,
    },
    textArea: { minHeight: 80 },
    calcBox: { borderWidth: 1, borderRadius: 12, padding: 12, marginVertical: 8 },
    calcRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    calcTotal: { borderTopWidth: 1, paddingTop: 8, marginTop: 4, marginBottom: 0 },
    calcLabel: { fontSize: 12 },
    calcValue: { fontSize: 12 },
    warningBox: { borderWidth: 1, borderColor: '#fde68a', borderRadius: 12, padding: 12, marginTop: 16, backgroundColor: '#fef3c7' },
    warningText: { color: '#92400e', fontSize: 11, lineHeight: 16 },
    modalFooter: {
        flexDirection: 'row',
        gap: 12,
        padding: 16,
        borderTopWidth: 1,
    },
    footerBtn: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitBtn: { flex: 2 },
});

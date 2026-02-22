import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import Colors from '@/constants/Colors';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function VendorDashboard() {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();
    const [vendor, setVendor] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({ products: 0, orders: 0, sales: 0 });

    useEffect(() => {
        fetchVendorData();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchVendorData();
        setRefreshing(false);
    };

    const fetchVendorData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.replace('/login');
                return;
            }

            const { data: vendorProfile, error } = await supabase
                .from('vendor_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error || !vendorProfile) {
                router.replace('/vendor-portal/register');
                return;
            }

            setVendor(vendorProfile);

            // 1. Get Products Count & IDs
            const { data: products, count: productCount } = await supabase
                .from('products')
                .select('id', { count: 'exact' })
                .eq('vendor_id', vendorProfile.id);

            const productIds = products?.map(p => p.id) || [];

            let ordersCount = 0;
            let salesTotal = 0;

            if (productIds.length > 0) {
                // 2. Get Order Items for these products JOINED with orders to check status
                const { data: orderItems } = await supabase
                    .from('order_items')
                    .select(`
                        price, 
                        quantity, 
                        order_id,
                        order:orders (status)
                    `)
                    .in('product_id', productIds);

                if (orderItems) {
                    // Filter out cancelled orders for accurate stats
                    const validItems = orderItems.filter((item: any) =>
                        item.order && item.order.status !== 'cancelled'
                    );

                    // Count unique orders
                    const uniqueOrders = new Set(validItems.map(item => item.order_id));
                    ordersCount = uniqueOrders.size;

                    // Sum sales
                    salesTotal = validItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                }
            }

            setStats({
                products: productCount || 0,
                orders: ordersCount,
                sales: parseFloat(salesTotal.toFixed(2))
            });

        } catch (error) {
            console.error(error);
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

    const sections = [
        { title: 'Add Product', icon: 'plus-circle', route: '/vendor-portal/products/add', color: '#16a34a' },
        { title: 'My Products', icon: 'list', route: '/vendor-portal/products', color: '#2563eb' },
        { title: 'Orders', icon: 'shopping-bag', route: '/vendor-portal/orders', color: '#f59e0b' },
        { title: 'KYC & ID', icon: 'vcard', route: '/vendor-portal/kyc', color: '#6366f1' },
        { title: 'Wallet', icon: 'money', route: '/vendor-portal/wallet', color: '#9333ea' },
        { title: 'Shop Settings', icon: 'cog', route: '/vendor-portal/setup', color: '#64748b' },
    ];

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
            }
        >
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header Card */}
            <View style={[styles.headerCard, { backgroundColor: colors.card }]}>
                <View style={styles.profileRow}>
                    <Image
                        source={{ uri: vendor?.shop_logo_url || 'https://via.placeholder.com/100' }}
                        style={styles.logo}
                    />
                    <View style={styles.profileInfo}>
                        <Text style={[styles.shopName, { color: colors.text }]}>{vendor?.shop_name}</Text>
                        <Text style={[styles.subText, { color: colors.textSecondary }]}>Vendor Portal</Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/vendor-portal/setup')}>
                        <FontAwesome name="edit" size={20} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* KYC Progress Banner */}
                {vendor?.kyc_status !== 'approved' && (
                    <TouchableOpacity
                        style={[styles.kycBanner, { backgroundColor: vendor?.kyc_status === 'pending' ? '#e0f2fe' : '#fef3c7' }]}
                        onPress={() => router.push('/vendor-portal/kyc')}
                    >
                        <FontAwesome
                            name={vendor?.kyc_status === 'pending' ? 'clock-o' : 'warning'}
                            size={16}
                            color={vendor?.kyc_status === 'pending' ? '#0369a1' : '#b45309'}
                        />
                        <Text style={[styles.kycText, { color: vendor?.kyc_status === 'pending' ? '#0369a1' : '#b45309' }]}>
                            {vendor?.kyc_status === 'pending'
                                ? 'KYC Verification in Progress'
                                : 'KYC Verification Required - Complete to enable payouts'}
                        </Text>
                        <FontAwesome name="angle-right" size={16} color={vendor?.kyc_status === 'pending' ? '#0369a1' : '#b45309'} />
                    </TouchableOpacity>
                )}

                <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.text }]}>{stats.products}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Products</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.text }]}>{stats.orders}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Orders</Text>
                    </View>
                    <View style={[styles.statItem, styles.salesStat]}>
                        <Text style={[styles.statValue, { color: '#16a34a', fontSize: 20 }]}>${stats.sales.toLocaleString()}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary, fontWeight: 'bold' }]}>Total Sales</Text>
                    </View>
                </View>
            </View>

            {/* Incomplete Setup Warning */}
            {(!vendor?.business_phone || !vendor?.shop_description) && (
                <View style={[styles.warningBanner, { backgroundColor: colors.danger + '10', borderColor: colors.danger + '30' }]}>
                    <FontAwesome name="exclamation-triangle" size={16} color={colors.danger} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={{ color: colors.danger, fontWeight: 'bold', fontSize: 13 }}>Shop Setup Incomplete</Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Please provide business phone and description.</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => router.push('/vendor-portal/setup')}
                        style={{ backgroundColor: colors.danger, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}
                    >
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>FIX NOW</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Grid Menu */}
            <View style={styles.grid}>
                {sections.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[styles.gridItem, { backgroundColor: colors.card, shadowColor: colors.text }]}
                        onPress={() => router.push(item.route as any)}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                            <FontAwesome name={item.icon as any} size={24} color={item.color} />
                        </View>
                        <Text style={[styles.gridLabel, { color: colors.text }]}>{item.title}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Quick Tips */}
            <View style={[styles.tipCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
                <FontAwesome name="info-circle" size={20} color={colors.primary} />
                <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.primary, fontWeight: 'bold', marginBottom: 4 }}>Tip for Sellers</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                        Ensure your product images are high quality to increase sales engagement.
                    </Text>
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
    headerCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    logo: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 16,
        backgroundColor: '#eee',
    },
    profileInfo: {
        flex: 1,
    },
    shopName: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    subText: {
        fontSize: 14,
    },
    kycBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
    },
    kycText: {
        flex: 1,
        fontSize: 12,
        fontWeight: 'bold',
        marginHorizontal: 8,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 16,
        borderTopWidth: 1,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
    },
    salesStat: {
        borderLeftWidth: 1,
        borderLeftColor: '#eee',
        paddingLeft: 10,
    },
    warningBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 16,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 20,
    },
    gridItem: {
        width: '47%',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        aspectRatio: 1.1,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    gridLabel: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    tipCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
        alignItems: 'flex-start',
        marginBottom: 40,
    },
});

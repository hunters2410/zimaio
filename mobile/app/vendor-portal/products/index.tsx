import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import Colors from '@/constants/Colors';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function VendorProductsScreen() {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get Vendor ID
            const { data: vendor } = await supabase
                .from('vendor_profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!vendor) return;

            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('vendor_id', vendor.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchProducts();
        setRefreshing(false);
    };

    const handleDelete = (id: string) => {
        Alert.alert('Delete Product', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    const { error } = await supabase.from('products').delete().eq('id', id);
                    if (!error) {
                        setProducts(prev => prev.filter(p => p.id !== id));
                    } else {
                        Alert.alert('Error', error.message);
                    }
                }
            }
        ]);
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Image
                source={{ uri: item.images?.[0] || 'https://via.placeholder.com/100' }}
                style={styles.image}
            />
            <View style={styles.details}>
                <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={[styles.price, { color: colors.primary }]}>${item.base_price}</Text>
                    <View style={[styles.stockBadge, { backgroundColor: item.stock_quantity > 0 ? '#dcfce7' : '#fee2e2' }]}>
                        <Text style={[styles.stockText, { color: item.stock_quantity > 0 ? '#166534' : '#991b1b' }]}>
                            {item.stock_quantity} in stock
                        </Text>
                    </View>
                </View>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity
                    onPress={() => router.push({ pathname: '/vendor-portal/products/add', params: { id: item.id } })}
                    style={[styles.actionBtn, { backgroundColor: colors.primary + '10' }]}
                >
                    <FontAwesome name="edit" size={16} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => handleDelete(item.id)}
                    style={[styles.actionBtn, { backgroundColor: '#fee2e2' }]}
                >
                    <FontAwesome name="trash" size={16} color="#ef4444" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <FlatList
                data={products}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 16 }}
                onRefresh={onRefresh}
                refreshing={refreshing}
                ListEmptyComponent={!loading ? <Text style={{ textAlign: 'center', marginTop: 20, color: colors.textSecondary }}>No products found</Text> : null}
            />
            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            )}

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/vendor-portal/products/add')}
            >
                <FontAwesome name="plus" size={24} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    card: {
        flexDirection: 'row',
        padding: 12,
        marginBottom: 12,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    image: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 12,
        backgroundColor: '#eee',
    },
    details: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    price: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 2,
    },
    stock: {
        fontSize: 12,
        marginTop: 2,
    },
    deleteBtn: {
        padding: 8,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        padding: 8,
        borderRadius: 8,
    },
    stockBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    stockText: {
        fontSize: 10,
        fontWeight: 'bold',
    }
});

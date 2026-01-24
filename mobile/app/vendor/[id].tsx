import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { StyleSheet, Image, FlatList, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import Colors from '@/constants/Colors';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFavorites } from '@/contexts/FavoritesContext';

interface Product {
    id: string;
    name: string;
    base_price: number;
    images: string[];
}

interface VendorProfile {
    id: string;
    shop_name: string;
    shop_logo_url: string;
    shop_description?: string;
}

export default function VendorDetailsScreen() {
    const { id } = useLocalSearchParams();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const { addFavorite, removeFavorite, isFavorite } = useFavorites();
    const router = useRouter();

    const [vendor, setVendor] = useState<VendorProfile | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchVendorDetails();
        }
    }, [id]);

    const fetchVendorDetails = async () => {
        setLoading(true);
        try {
            // Fetch Vendor Profile
            const { data: vendorData, error: vendorError } = await supabase
                .from('vendor_profiles')
                .select('id, shop_name, shop_logo_url, shop_description')
                .eq('id', id)
                .single();

            if (vendorError) throw vendorError;
            setVendor(vendorData);

            // Fetch Vendor Products
            const { data: productsData, error: productsError } = await supabase
                .from('products')
                .select('id, name, base_price, images')
                .eq('vendor_id', id)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (productsError) throw productsError;
            setProducts(productsData || []);

        } catch (error) {
            console.error('Error fetching vendor details:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleFavorite = (item: Product) => {
        if (isFavorite(item.id)) {
            removeFavorite(item.id);
        } else {
            addFavorite({
                id: item.id,
                name: item.name,
                base_price: item.base_price,
                images: item.images,
            });
        }
    };

    const renderProductItem = ({ item }: { item: Product }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.text }]}
            onPress={() => router.push(`/product/${item.id}`)}
            activeOpacity={0.9}
        >
            <View style={[styles.imageContainer, { backgroundColor: colors.background }]}>
                {item.images && item.images[0] ? (
                    <Image source={{ uri: item.images[0] }} style={styles.image} resizeMode="cover" />
                ) : (
                    <View style={[styles.image, { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{ opacity: 0.5, color: colors.textSecondary }}>No Image</Text>
                    </View>
                )}
                <TouchableOpacity
                    style={[styles.favoriteBtn, { backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)' }]}
                    onPress={() => toggleFavorite(item)}
                >
                    <FontAwesome
                        name={isFavorite(item.id) ? "heart" : "heart-o"}
                        size={16}
                        color={isFavorite(item.id) ? colors.danger : colors.textSecondary}
                    />
                </TouchableOpacity>
            </View>
            <View style={[styles.details, { backgroundColor: colors.card }]}>
                <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
                <Text style={[styles.price, { color: colors.primary }]}>${item.base_price.toFixed(2)}</Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!vendor) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }]}>
                <Text>Vendor not found</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ title: vendor.shop_name || 'Vendor Profile', headerBackTitle: 'Back' }} />

            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                {/* Vendor Header Info */}
                <View style={[styles.headerContainer, { backgroundColor: colors.card }]}>
                    <View style={[styles.vendorLogoContainer, { borderColor: colors.primary }]}>
                        {vendor.shop_logo_url ? (
                            <Image source={{ uri: vendor.shop_logo_url }} style={styles.vendorLogo} resizeMode="cover" />
                        ) : (
                            <View style={[styles.vendorLogo, { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
                                <FontAwesome name="shopping-bag" size={40} color={colors.textSecondary} />
                            </View>
                        )}
                    </View>
                    <Text style={[styles.shopName, { color: colors.text }]}>{vendor.shop_name}</Text>
                    {vendor.shop_description ? (
                        <Text style={[styles.description, { color: colors.textSecondary }]}>{vendor.shop_description}</Text>
                    ) : null}
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Products ({products.length})</Text>
                </View>

                <FlatList
                    data={products}
                    renderItem={renderProductItem}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    scrollEnabled={false} // Since we are inside ScrollView
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 40 }}>
                            <Text style={{ color: colors.textSecondary }}>No products found for this vendor.</Text>
                        </View>
                    }
                />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        marginBottom: 10,
    },
    vendorLogoContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        overflow: 'hidden',
        borderWidth: 3,
        marginBottom: 10,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    vendorLogo: {
        width: '100%',
        height: '100%',
    },
    shopName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    description: {
        textAlign: 'center',
        marginHorizontal: 20,
        fontSize: 14,
    },
    sectionHeader: {
        paddingHorizontal: 16,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    list: {
        paddingHorizontal: 10,
    },
    card: {
        flex: 1,
        margin: 6,
        borderRadius: 12,
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    imageContainer: {
        height: 120, // Slightly larger for details page maybe?
        width: '100%',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    details: {
        padding: 8,
    },
    productName: {
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    price: {
        fontSize: 13,
        fontWeight: '900',
    },
    favoriteBtn: {
        position: 'absolute',
        right: 5,
        top: 5,
        borderRadius: 12,
        padding: 4,
    },
});

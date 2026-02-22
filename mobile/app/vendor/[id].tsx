import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { StyleSheet, Image, FlatList, ActivityIndicator, TouchableOpacity, ScrollView, TextInput, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, View } from '@/components/Themed';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import Colors from '@/constants/Colors';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useCart } from '@/contexts/CartContext';

interface Product {
    id: string;
    name: string;
    base_price: number;
    images: string[];
    vendor_id?: string;
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
    const { addToCart } = useCart();
    const router = useRouter();

    const [vendor, setVendor] = useState<VendorProfile | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (searchQuery) {
            setFilteredProducts(products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())));
        } else {
            setFilteredProducts(products);
        }
    }, [searchQuery, products]);

    useEffect(() => {
        if (id) {
            fetchVendorDetails();
        }
    }, [id]);

    const fetchVendorDetails = async () => {
        setLoading(true);
        try {
            // Load from cache first
            const cachedData = await AsyncStorage.getItem(`cache_vendor_${id}`);
            if (cachedData) {
                const { vendor: cVendor, products: cProducts } = JSON.parse(cachedData);
                setVendor(cVendor);
                setProducts(cProducts);
                setFilteredProducts(cProducts);
                setLoading(false); // Show cached content immediately
            }

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
                .select('id, name, base_price, images, vendor_id')
                .eq('vendor_id', id)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (productsError) throw productsError;

            const fetchedProducts = productsData || [];
            setProducts(fetchedProducts);
            if (!searchQuery) {
                setFilteredProducts(fetchedProducts);
            }

            // Save to cache
            await AsyncStorage.setItem(`cache_vendor_${id}`, JSON.stringify({
                vendor: vendorData,
                products: fetchedProducts
            }));

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

    const handleAddToCart = (item: Product) => {
        addToCart({
            id: item.id,
            name: item.name,
            price: item.base_price,
            base_price: item.base_price,
            image: item.images?.[0] || '',
            quantity: 1,
            vendor: vendor?.shop_name || 'Vendor',
            vendor_id: item.vendor_id || vendor?.id || 'unknown',
            options: {}
        });
    };

    /* Marketplace Style Constants */
    const { width: SCREEN_WIDTH } = Dimensions.get('window');
    const SPACING = 2;
    const ITEM_WIDTH = (SCREEN_WIDTH / 2) - SPACING;

    const renderProductItem = ({ item }: { item: Product }) => (
        <TouchableOpacity
            style={[styles.card, { width: ITEM_WIDTH, backgroundColor: colors.card }]}
            onPress={() => router.push(`/product/${item.id}`)}
            activeOpacity={0.9}
        >
            <View style={[styles.imageContainer, { height: ITEM_WIDTH }]}>
                {item.images && item.images[0] ? (
                    <Image source={{ uri: item.images[0] }} style={styles.image} resizeMode="cover" />
                ) : (
                    <View style={[styles.image, { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{ opacity: 0.5, color: colors.textSecondary, fontSize: 10 }}>No Image</Text>
                    </View>
                )}
                {/* Product Icons Overlay */}
                <View style={styles.productIconsOverlay}>
                    <TouchableOpacity
                        style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.9)' }]}
                        onPress={() => toggleFavorite(item)}
                    >
                        <FontAwesome
                            name={isFavorite(item.id) ? "heart" : "heart-o"}
                            size={14}
                            color={isFavorite(item.id) ? colors.danger : '#333'}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.iconCircle, { backgroundColor: colors.primary }]}
                        onPress={() => handleAddToCart(item)}
                    >
                        <FontAwesome name="shopping-cart" size={14} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Product Details Overlay */}
                <View style={styles.detailsOverlay}>
                    <Text style={[styles.productName, { color: '#fff' }]} numberOfLines={1}>{item.name}</Text>
                    <Text style={[styles.price, { color: '#fff' }]}>${item.base_price.toLocaleString()}</Text>
                </View>
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

                <View style={[styles.sectionHeader, { paddingHorizontal: 16 }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Products ({products.length})</Text>
                </View>

                <View style={styles.searchRow}>
                    <View style={[styles.searchContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                        <FontAwesome name="search" size={16} color={colors.textSecondary} style={styles.searchIcon} />
                        <TextInput
                            placeholder="Search products..."
                            placeholderTextColor={colors.textSecondary}
                            style={[styles.searchInput, { color: colors.text }]}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                <FlatList
                    data={filteredProducts}
                    renderItem={renderProductItem}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    scrollEnabled={false} // Since we are inside ScrollView
                    contentContainerStyle={styles.list}
                    columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: SPACING }}
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
        width: 80,
        height: 80,
        borderRadius: 40,
        overflow: 'hidden',
        borderWidth: 2,
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
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    description: {
        textAlign: 'center',
        marginHorizontal: 20,
        fontSize: 13,
    },
    sectionHeader: {
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 12,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        paddingHorizontal: 16,
        height: 40,
        borderWidth: 1,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
    },
    list: {
        paddingHorizontal: 0,
    },
    card: {
        marginBottom: 0,
        borderRadius: 12,
        overflow: 'hidden',
    },
    imageContainer: {
        width: '100%',
        position: 'relative',
        backgroundColor: '#e2e8f0',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    detailsOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 8,
        backgroundColor: 'rgba(50,50,50,0.7)',
    },
    productName: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    price: {
        fontSize: 14,
        fontWeight: '900',
    },
    productIconsOverlay: {
        position: 'absolute',
        top: 8,
        right: 8,
        gap: 8,
    },
    iconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
});

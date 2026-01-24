import { StyleSheet, FlatList, ActivityIndicator, Image, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Text, View } from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTheme } from '@/contexts/ThemeContext';
import Colors from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { useFavorites } from '@/contexts/FavoritesContext';

interface Product {
    id: string;
    name: string;
    base_price: number;
    images: string[];
}

interface Vendor {
    id: string;
    shop_name: string;
    shop_logo_url: string;
}

export default function ExploreScreen() {
    const { addFavorite, removeFavorite, isFavorite } = useFavorites();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();

    const [view, setView] = useState<'products' | 'vendors'>('products');
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState<string | null>(null);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (view === 'products') {
            if (searchQuery) {
                setFilteredProducts(products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())));
            } else {
                setFilteredProducts(products);
            }
        } else {
            if (searchQuery) {
                setFilteredVendors(vendors.filter(v => (v.shop_name || '').toLowerCase().includes(searchQuery.toLowerCase())));
            } else {
                setFilteredVendors(vendors);
            }
        }
    }, [searchQuery, view, products, vendors]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            await Promise.all([fetchProducts(), fetchVendors()]);
        } catch (error: any) {
            console.error('Error in fetchData:', error);
            setError(error.message || 'An error occurred fetching data');
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('id, name, base_price, images')
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                throw error;
            }
            if (data) {
                setProducts(data);
                setFilteredProducts(data);
            }
        } catch (error) {
            console.log('Error fetching products catch:', error);
        }
    };

    const fetchVendors = async () => {
        try {
            const { data, error } = await supabase
                .from('vendor_profiles')
                .select('id, shop_name, shop_logo_url')
                .eq('is_approved', true)
                .limit(50);

            if (error) {
                throw error;
            }

            if (data) {
                setVendors(data);
                setFilteredVendors(data);
            }
        } catch (error) {
            console.log('Error fetching vendors catch:', error);
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

    const renderVendorItem = ({ item }: { item: Vendor }) => (
        <TouchableOpacity
            style={[styles.vendorCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push(`/vendor/${item.id}`)}
        >
            <View style={[styles.vendorImageContainer, { borderColor: colors.primary, backgroundColor: colors.background }]}>
                {item.shop_logo_url ? (
                    <Image source={{ uri: item.shop_logo_url }} style={styles.vendorImage} resizeMode="cover" />
                ) : (
                    <View style={[styles.vendorImage, { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
                        <FontAwesome name="shopping-bag" size={24} color={colors.textSecondary} />
                    </View>
                )}
            </View>
            <Text style={[styles.vendorName, { color: colors.text }]} numberOfLines={1}>{item.shop_name || 'Vendor'}</Text>
        </TouchableOpacity>
    );

    const ProductSkeleton = () => (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={[styles.imageContainer, { backgroundColor: colors.border }]} />
            <View style={[styles.details, { backgroundColor: colors.card }]}>
                <View style={{ height: 10, width: '90%', backgroundColor: colors.border, marginBottom: 6, borderRadius: 4 }} />
                <View style={{ height: 12, width: '50%', backgroundColor: colors.border, borderRadius: 4 }} />
            </View>
        </View>
    );

    const VendorSkeleton = () => (
        <View style={[styles.vendorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.vendorImageContainer, { backgroundColor: colors.border, borderColor: colors.border }]} />
            <View style={{ height: 10, width: '80%', backgroundColor: colors.border, marginTop: 8, borderRadius: 4 }} />
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Search Bar & Header Icons */}
            <View style={styles.searchRow}>
                <View style={[styles.searchContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border, marginRight: 0 }]}>
                    <FontAwesome name="search" size={20} color={colors.primary} style={styles.searchIcon} />
                    <TextInput
                        placeholder={`Search ${view}...`}
                        placeholderTextColor={colors.textSecondary}
                        style={[styles.searchInput, { color: colors.text }]}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {error ? (
                <View style={{ backgroundColor: '#fee2e2', padding: 10, marginHorizontal: 16, marginBottom: 10, borderRadius: 8 }}>
                    <Text style={{ color: '#ef4444', textAlign: 'center' }}>{error}</Text>
                    <TouchableOpacity onPress={fetchData} style={{ alignItems: 'center', marginTop: 4 }}>
                        <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : null}

            {/* Toggles */}
            <View style={[styles.toggleContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TouchableOpacity
                    style={[styles.toggleBtn, view === 'products' && { backgroundColor: colors.primary }]}
                    onPress={() => setView('products')}
                >
                    <Text style={[styles.toggleText, view === 'products' ? { color: '#fff' } : { color: colors.textSecondary }]}>All Products</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleBtn, view === 'vendors' && { backgroundColor: colors.primary }]}
                    onPress={() => setView('vendors')}
                >
                    <Text style={[styles.toggleText, view === 'vendors' ? { color: '#fff' } : { color: colors.textSecondary }]}>All Vendors</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.list}>
                    {view === 'products' ? (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                            {[...Array(6)].map((_, i) => (
                                <View key={i} style={{ width: '48%' }}>
                                    <ProductSkeleton />
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                            {[...Array(9)].map((_, i) => (
                                <View key={i} style={{ width: '31%' }}>
                                    <VendorSkeleton />
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            ) : (
                <FlatList
                    key={view} // Force re-render when changing view
                    data={view === 'products' ? (filteredProducts as any) : (filteredVendors as any)}
                    renderItem={view === 'products' ? (renderProductItem as any) : (renderVendorItem as any)}
                    keyExtractor={(item) => item.id}
                    numColumns={view === 'products' ? 2 : 3}
                    contentContainerStyle={styles.list}
                    columnWrapperStyle={view === 'vendors' ? styles.vendorColumnWrapper : undefined}
                    ListEmptyComponent={
                        <View style={{ flex: 1, alignItems: 'center', marginTop: 50 }}>
                            <FontAwesome name="inbox" size={40} color={colors.textSecondary} />
                            <Text style={{ marginTop: 10, color: colors.textSecondary }}>No {view} found.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 10,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 16,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 50,
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        marginRight: 10,
    },
    bellButton: {
        width: 50,
        height: 50,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        position: 'relative'
    },
    badge: {
        position: 'absolute',
        right: 12,
        top: 12,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#ef4444',
        borderWidth: 2,
        borderColor: '#fff',
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
    },
    toggleContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    toggleText: {
        fontSize: 13,
        fontWeight: '600',
    },
    list: {
        paddingHorizontal: 10,
        paddingBottom: 20,
    },
    // Product Card Styles (Reused)
    card: {
        flex: 1,
        margin: 5,
        borderRadius: 8,
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    imageContainer: {
        height: 100,
        width: '100%',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    details: {
        padding: 6,
    },
    productName: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    price: {
        fontSize: 12,
        fontWeight: '900',
    },
    // Vendor Card Styles
    vendorColumnWrapper: {
        justifyContent: 'space-between',
        paddingHorizontal: 6,
    },
    vendorCard: {
        width: '30%',
        borderRadius: 12,
        padding: 10,
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        height: 100,
        justifyContent: 'center',
    },
    vendorImageContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        overflow: 'hidden',
        marginBottom: 8,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    vendorImage: {
        width: '100%',
        height: '100%',
    },
    vendorName: {
        fontSize: 10,
        fontWeight: '700',
        textAlign: 'center',
    },
    favoriteBtn: {
        position: 'absolute',
        right: 5,
        top: 5,
        borderRadius: 12,
        padding: 4,
    },
});

import { StyleSheet, FlatList, ActivityIndicator, Image, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Text, View } from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTheme } from '@/contexts/ThemeContext';
import Colors from '@/constants/Colors';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useCart } from '@/contexts/CartContext';

interface Product {
    id: string;
    name: string;
    base_price: number;
    images: string[];
    vendor_id?: string;
}

export default function CategoryProductsScreen() {
    const { id } = useLocalSearchParams();
    const { addFavorite, removeFavorite, isFavorite } = useFavorites();
    const { addToCart } = useCart();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();

    const [products, setProducts] = useState<Product[]>([]);
    const [categoryName, setCategoryName] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

    useEffect(() => {
        if (id) {
            fetchCategoryDetails();
            fetchProducts();
        }
    }, [id]);

    useEffect(() => {
        if (searchQuery) {
            setFilteredProducts(products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())));
        } else {
            setFilteredProducts(products);
        }
    }, [searchQuery, products]);

    const fetchCategoryDetails = async () => {
        try {
            // Load from cache first
            const cachedName = await AsyncStorage.getItem(`cache_category_name_${id}`);
            if (cachedName) setCategoryName(cachedName);

            const { data, error } = await supabase
                .from('categories')
                .select('name')
                .eq('id', id)
                .single();

            if (data) {
                setCategoryName(data.name);
                await AsyncStorage.setItem(`cache_category_name_${id}`, data.name);
            }
        } catch (error) {
            console.log('Error fetching category:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            // Load from cache first
            const cachedProducts = await AsyncStorage.getItem(`cache_category_products_${id}`);
            if (cachedProducts) {
                const parsed = JSON.parse(cachedProducts);
                setProducts(parsed);
                setFilteredProducts(parsed);
                setLoading(false);
            }

            const { data, error } = await supabase
                .from('products')
                .select('id, name, base_price, images, vendor_id')
                .eq('category_id', id)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                setProducts(data);
                if (!searchQuery) {
                    setFilteredProducts(data);
                }
                await AsyncStorage.setItem(`cache_category_products_${id}`, JSON.stringify(data));
            }
        } catch (error) {
            console.log('Error fetching products:', error);
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

    /* Grid Layout Constants Matching Other Pages */
    const { width: SCREEN_WIDTH } = Dimensions.get('window');
    const SPACING = 2; // Spacing between items
    const ITEM_WIDTH = (SCREEN_WIDTH / 2) - SPACING;

    const renderProductItem = ({ item }: { item: Product }) => (
        <TouchableOpacity
            style={[styles.card, { width: ITEM_WIDTH, backgroundColor: colors.card, shadowColor: colors.text }]}
            onPress={() => router.push(`/product/${item.id}`)}
            activeOpacity={0.9}
        >
            <View style={[styles.imageContainer, { backgroundColor: colors.background, height: ITEM_WIDTH }]}>
                {item.images && item.images[0] ? (
                    <Image source={{ uri: item.images[0] }} style={styles.image} resizeMode="cover" />
                ) : (
                    <View style={[styles.image, { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{ opacity: 0.5, color: colors.textSecondary }}>No Image</Text>
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
                        onPress={(e) => {
                            e.stopPropagation();
                            addToCart({
                                id: item.id,
                                name: item.name,
                                price: item.base_price,
                                base_price: item.base_price,
                                image: item.images && item.images[0] ? item.images[0] : '',
                                quantity: 1,
                                vendor: 'Vendor',
                                vendor_id: item.vendor_id || 'unknown'
                            });
                        }}
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

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ title: categoryName || 'Category' }} />

            <View style={[styles.searchContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                <FontAwesome name="search" size={20} color={colors.primary} style={styles.searchIcon} />
                <TextInput
                    placeholder={`Search in ${categoryName || 'category'}...`}
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.searchInput, { color: colors.text }]}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredProducts}
                    renderItem={renderProductItem}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    contentContainerStyle={styles.list}
                    columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: SPACING }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={{ flex: 1, alignItems: 'center', marginTop: 50 }}>
                            <FontAwesome name="inbox" size={40} color={colors.textSecondary} />
                            <Text style={{ marginTop: 10, color: colors.textSecondary }}>No products found in this category.</Text>
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 50,
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
    },
    list: {
        paddingHorizontal: 0,
        paddingBottom: 20,
    },
    card: {
        marginBottom: 0,
        borderRadius: 12,
        overflow: 'hidden',
        // Shadow removed or minimal to match outline style if needed, but keeping for now
    },
    imageContainer: {
        // height set dynamically in render
        width: '100%',
        position: 'relative',
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

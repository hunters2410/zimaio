import { StyleSheet, FlatList, ActivityIndicator, Image, TouchableOpacity, TextInput } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Text, View } from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTheme } from '@/contexts/ThemeContext';
import Colors from '@/constants/Colors';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useFavorites } from '@/contexts/FavoritesContext';

interface Product {
    id: string;
    name: string;
    base_price: number;
    images: string[];
}

export default function CategoryProductsScreen() {
    const { id } = useLocalSearchParams();
    const { addFavorite, removeFavorite, isFavorite } = useFavorites();
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
            const { data, error } = await supabase
                .from('categories')
                .select('name')
                .eq('id', id)
                .single();

            if (data) {
                setCategoryName(data.name);
            }
        } catch (error) {
            console.log('Error fetching category:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('id, name, base_price, images')
                .eq('category_id', id)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                setProducts(data);
                setFilteredProducts(data);
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
        paddingHorizontal: 10,
        paddingBottom: 20,
    },
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
        height: 150,
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
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    price: {
        fontSize: 14,
        fontWeight: '900',
    },
    favoriteBtn: {
        position: 'absolute',
        right: 8,
        top: 8,
        borderRadius: 16,
        padding: 6,
    }
});

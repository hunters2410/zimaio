import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { StyleSheet, Image, ScrollView, TouchableOpacity, View as RNView, Dimensions, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import Colors from '@/constants/Colors';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';

interface Product {
    id: string;
    name: string;
    description: string;
    base_price: number;
    images: string[];
    vendor_id: string;
    stock: number;
    vendor?: {
        shop_name: string;
    };
}

const { width: WINDOW_WIDTH } = Dimensions.get('window');

export default function ProductDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const { addToCart } = useCart();
    const { addFavorite, removeFavorite, isFavorite } = useFavorites();

    const [product, setProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    const imageScrollRef = useRef<ScrollView>(null);

    useEffect(() => {
        if (id) {
            fetchProduct();
        }
    }, [id]);

    const fetchProduct = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select(`
                    id, 
                    name, 
                    description, 
                    base_price, 
                    images, 
                    vendor_id, 
                    stock:stock_quantity,
                    vendor:vendor_profiles(shop_name)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;

            // Handle vendor data structure which can be an array or object depending on PostgREST version/query
            const vendorData = Array.isArray(data.vendor) ? data.vendor[0] : data.vendor;

            setProduct({
                ...data,
                vendor: vendorData
            });
        } catch (error) {
            console.error('Error fetching product:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = () => {
        if (!product) return;
        addToCart({
            id: product.id,
            name: product.name,
            price: product.base_price,
            base_price: product.base_price,
            quantity: quantity,
            image: product.images?.[0] || '',
            vendor: product.vendor?.shop_name || 'Vendor',
            vendor_id: product.vendor_id,
            options: {}
        });
        router.push('/cart');
    };

    const toggleFavorite = () => {
        if (!product) return;
        if (isFavorite(product.id)) {
            removeFavorite(product.id);
        } else {
            addFavorite({
                id: product.id,
                name: product.name,
                base_price: product.base_price,
                images: product.images,
            });
        }
    };

    const scrollToImage = (index: number) => {
        setActiveImageIndex(index);
        imageScrollRef.current?.scrollTo({ x: index * WINDOW_WIDTH, animated: true });
    };

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!product) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <Text style={{ color: colors.textSecondary }}>Product not found</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Stack.Screen options={{ title: 'Product Details' }} />

            <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
                {/* Image Gallery */}
                <View style={styles.imageContainer}>
                    <ScrollView
                        ref={imageScrollRef}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={(e) => {
                            const index = Math.round(e.nativeEvent.contentOffset.x / WINDOW_WIDTH);
                            setActiveImageIndex(index);
                        }}
                    >
                        {product.images && product.images.length > 0 ? (
                            product.images.map((img, idx) => (
                                <Image
                                    key={idx}
                                    source={{ uri: img }}
                                    style={[styles.image, { width: WINDOW_WIDTH }]}
                                    resizeMode="cover"
                                />
                            ))
                        ) : (
                            <View style={[styles.image, { width: WINDOW_WIDTH, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
                                <FontAwesome name="image" size={50} color={colors.textSecondary} />
                            </View>
                        )}
                    </ScrollView>

                    {/* Progress Indicators */}
                    {product.images && product.images.length > 1 && (
                        <View style={styles.indicators}>
                            {product.images.map((_, idx) => (
                                <View
                                    key={idx}
                                    style={[
                                        styles.indicator,
                                        { backgroundColor: activeImageIndex === idx ? colors.primary : 'rgba(255,255,255,0.5)', width: activeImageIndex === idx ? 20 : 8 }
                                    ]}
                                />
                            ))}
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.favBtn, { backgroundColor: colors.card }]}
                        onPress={toggleFavorite}
                    >
                        <FontAwesome
                            name={isFavorite(product.id) ? "heart" : "heart-o"}
                            size={24}
                            color={isFavorite(product.id) ? colors.danger : colors.textSecondary}
                        />
                    </TouchableOpacity>
                </View>

                {/* Thumbnails Row */}
                {product.images && product.images.length > 1 && (
                    <View style={styles.thumbnailWrapper}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.thumbnailList}
                        >
                            {product.images.map((img, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    onPress={() => scrollToImage(idx)}
                                    style={[
                                        styles.thumbnailContainer,
                                        { borderColor: activeImageIndex === idx ? colors.primary : colors.border }
                                    ]}
                                >
                                    <Image source={{ uri: img }} style={styles.thumbnail} resizeMode="cover" />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Info Section */}
                <View style={[styles.infoContainer, { backgroundColor: colors.card }]}>
                    <Text style={[styles.name, { color: colors.text }]}>{product.name}</Text>

                    <View style={styles.priceRow}>
                        <View>
                            <Text style={[styles.price, { color: colors.primary }]}>${product.base_price.toFixed(2)}</Text>
                            <Text style={[styles.stockStatus, { color: product.stock > 0 ? '#10b981' : '#ef4444' }]}>
                                {product.stock > 0 ? '● In Stock' : '○ Out of Stock'}
                            </Text>
                        </View>

                        {/* Quantity Selector */}
                        <View style={[styles.quantityControl, { borderColor: colors.border }]}>
                            <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))} style={styles.qBtn}>
                                <FontAwesome name="minus" size={12} color={colors.text} />
                            </TouchableOpacity>
                            <Text style={[styles.qText, { color: colors.text }]}>{quantity}</Text>
                            <TouchableOpacity onPress={() => setQuantity(quantity + 1)} style={styles.qBtn}>
                                <FontAwesome name="plus" size={12} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={[styles.vendorCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <View style={[styles.vendorIcon, { backgroundColor: colors.card }]}>
                            <FontAwesome name="shopping-bag" size={16} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 12, color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 'bold' }}>Sold by</Text>
                            <Text style={{ fontSize: 15, color: colors.text, fontWeight: 'bold' }}>{product.vendor?.shop_name || 'Official Store'}</Text>
                        </View>
                        <FontAwesome name="angle-right" size={20} color={colors.textSecondary} />
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Explore Product</Text>
                    <Text style={[styles.description, { color: colors.textSecondary }]}>
                        {product.description || 'No description available for this product.'}
                    </Text>
                </View>
            </ScrollView>

            {/* Bottom Action Bar */}
            <View style={[styles.actionBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                <TouchableOpacity style={[styles.addToCartBtn, { backgroundColor: colors.primary }]} onPress={handleAddToCart}>
                    <FontAwesome name="shopping-cart" size={18} color="#fff" style={{ marginRight: 10 }} />
                    <Text style={styles.addToCartText}>Add to Cart</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageContainer: {
        width: WINDOW_WIDTH,
        height: 400,
        position: 'relative',
    },
    image: {
        height: 400,
    },
    indicators: {
        position: 'absolute',
        bottom: 20,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
    },
    indicator: {
        height: 8,
        borderRadius: 4,
    },
    favBtn: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    thumbnailWrapper: {
        marginTop: 12,
    },
    thumbnailList: {
        paddingHorizontal: 20,
        gap: 12,
    },
    thumbnailContainer: {
        width: 60,
        height: 60,
        borderRadius: 12,
        borderWidth: 2,
        overflow: 'hidden',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    infoContainer: {
        flex: 1,
        padding: 24,
        marginTop: 12,
    },
    name: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    price: {
        fontSize: 28,
        fontWeight: '900',
    },
    stockStatus: {
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 4,
    },
    quantityControl: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 25,
        paddingHorizontal: 12,
        height: 44,
    },
    qBtn: {
        padding: 8,
    },
    qText: {
        marginHorizontal: 16,
        fontSize: 18,
        fontWeight: 'bold',
    },
    vendorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 24,
    },
    vendorIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    divider: {
        height: 1,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
    },
    actionBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: 34,
        borderTopWidth: 1,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    addToCartBtn: {
        height: 56,
        borderRadius: 28,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    addToCartText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

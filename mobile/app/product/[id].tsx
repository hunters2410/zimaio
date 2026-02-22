import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { StyleSheet, Image, ScrollView, TouchableOpacity, View as RNView, Dimensions, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, View } from '@/components/Themed';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import Colors from '@/constants/Colors';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Product {
    id: string;
    name: string;
    description: string;
    base_price: number;
    images: string[];
    vendor_id: string;
    stock: number;
    sku?: string;
    attributes?: {
        colors?: string[];
    };
    vendor?: {
        shop_name: string;
    };
    brand?: {
        name: string;
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
    const insets = useSafeAreaInsets();

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
            // Load from cache first
            const cachedProduct = await AsyncStorage.getItem(`cache_product_${id}`);
            if (cachedProduct) {
                setProduct(JSON.parse(cachedProduct));
                setLoading(false);
            }

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
                    sku,
                    attributes,
                    vendor:vendor_profiles(shop_name),
                    brand:brands(name)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;

            // Handle vendor/brand data structure
            const vendorData = Array.isArray(data.vendor) ? data.vendor[0] : data.vendor;
            const brandData = Array.isArray(data.brand) ? data.brand[0] : data.brand;

            const fullProduct = {
                ...data,
                vendor: vendorData,
                brand: brandData
            };

            setProduct(fullProduct);
            await AsyncStorage.setItem(`cache_product_${id}`, JSON.stringify(fullProduct));
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

            <ScrollView contentContainerStyle={{ paddingBottom: 100 + insets.bottom }} showsVerticalScrollIndicator={false}>
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
                                <FontAwesome name="image" size={40} color={colors.textSecondary} />
                            </View>
                        )}
                    </ScrollView>

                    <TouchableOpacity
                        style={[styles.favBtn, { backgroundColor: colors.card }]}
                        onPress={toggleFavorite}
                    >
                        <FontAwesome
                            name={isFavorite(product.id) ? "heart" : "heart-o"}
                            size={18}
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
                    {product.brand?.name && (
                        <Text style={[styles.brand, { color: colors.primary }]}>{product.brand.name}</Text>
                    )}

                    <Text style={[styles.name, { color: colors.text }]}>{product.name}</Text>

                    {product.sku && (
                        <Text style={[styles.sku, { color: colors.textSecondary }]}>SKU: {product.sku}</Text>
                    )}

                    <View style={styles.priceRow}>
                        <View>
                            <Text style={[styles.price, { color: colors.text }]}>${product.base_price.toFixed(2)}</Text>
                            <Text style={[styles.stockStatus, { color: product.stock > 0 ? colors.success : colors.danger }]}>
                                {product.stock > 0 ? '● In Stock' : '○ Out of Stock'}
                            </Text>
                        </View>

                        {/* Quantity Selector */}
                        <View style={[styles.quantityControl, { borderColor: colors.border }]}>
                            <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))} style={styles.qBtn}>
                                <FontAwesome name="minus" size={10} color={colors.text} />
                            </TouchableOpacity>
                            <Text style={[styles.qText, { color: colors.text }]}>{quantity}</Text>
                            <TouchableOpacity onPress={() => setQuantity(quantity + 1)} style={styles.qBtn}>
                                <FontAwesome name="plus" size={10} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Attributes (e.g. Colors) */}
                    {product.attributes?.colors && product.attributes.colors.length > 0 && (
                        <View style={styles.attributesContainer}>
                            <Text style={[styles.attributeLabel, { color: colors.textSecondary }]}>Available Colors:</Text>
                            <View style={styles.colorList}>
                                {product.attributes.colors.map((color: string, idx: number) => (
                                    <View
                                        key={idx}
                                        style={[
                                            styles.colorDot,
                                            { backgroundColor: color, borderColor: colors.border }
                                        ]}
                                    />
                                ))}
                            </View>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.vendorCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                        onPress={() => product.vendor_id && router.push(`/vendor/${product.vendor_id}`)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.vendorIcon, { backgroundColor: colors.card }]}>
                            <FontAwesome name="shopping-bag" size={14} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 'bold' }}>Sold by</Text>
                            <Text style={{ fontSize: 14, color: colors.text, fontWeight: 'bold' }}>{product.vendor?.shop_name || 'Official Store'}</Text>
                        </View>
                        <FontAwesome name="angle-right" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>

                    {/* Chat with Vendor Button */}
                    <TouchableOpacity
                        style={[styles.chatButton, { backgroundColor: colors.background, borderColor: colors.primary }]}
                        onPress={() => product.vendor_id && router.push(`/chat/${product.vendor_id}`)}
                    >
                        <FontAwesome name="comment" size={14} color={colors.primary} />
                        <Text style={[styles.chatButtonText, { color: colors.primary }]}>Chat with Vendor</Text>
                    </TouchableOpacity>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
                    <Text style={[styles.description, { color: colors.textSecondary }]}>
                        {product.description || 'No description available for this product.'}
                    </Text>
                </View>
            </ScrollView>

            {/* Bottom Action Bar */}
            <View style={[
                styles.actionBar,
                {
                    backgroundColor: colors.card,
                    borderTopColor: colors.border,
                    paddingBottom: Math.max(insets.bottom, 16)
                }
            ]}>
                <TouchableOpacity style={[styles.addToCartBtn, { backgroundColor: colors.primary }]} onPress={handleAddToCart}>
                    <FontAwesome name="shopping-cart" size={16} color="#fff" style={{ marginRight: 8 }} />
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
        position: 'relative',
    },
    image: {
        height: 250, // Reduced from 300
    },
    favBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 32, // Reduced from 40
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    thumbnailWrapper: {
        marginTop: 12,
    },
    thumbnailList: {
        paddingHorizontal: 16,
        gap: 8,
    },
    thumbnailContainer: {
        borderWidth: 2,
        borderRadius: 8,
        overflow: 'hidden',
    },
    thumbnail: {
        width: 50, // Reduced from 60
        height: 50,
    },
    infoContainer: {
        marginTop: 12, // Reduced
        padding: 16,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    brand: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    name: {
        fontSize: 18, // Reduced from 22
        fontWeight: 'bold',
        marginBottom: 4,
    },
    sku: {
        fontSize: 11,
        marginBottom: 8,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    price: {
        fontSize: 20, // Reduced from 24
        fontWeight: 'bold',
    },
    stockStatus: {
        fontSize: 12, // Reduced from 14
        marginTop: 2,
        fontWeight: '500',
    },
    quantityControl: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 16, // Reduced
        overflow: 'hidden',
    },
    qBtn: {
        padding: 8, // Reduced
        width: 32, // Reduced
        alignItems: 'center',
    },
    qText: {
        fontSize: 14, // Reduced from 16
        fontWeight: 'bold',
        marginHorizontal: 1,
        minWidth: 16,
        textAlign: 'center',
    },
    attributesContainer: {
        marginBottom: 16,
    },
    attributeLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 6,
    },
    colorList: {
        flexDirection: 'row',
        gap: 8,
    },
    colorDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1,
    },
    vendorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10, // Reduced from 12
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12, // Reduced
    },
    vendorIcon: {
        width: 32, // Reduced from 36
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    chatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10, // Reduced from 12
        borderRadius: 12,
        borderWidth: 2,
        marginBottom: 16,
        gap: 8,
    },
    chatButtonText: {
        fontSize: 13, // Reduced from 15
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        marginVertical: 10,
    },
    sectionTitle: {
        fontSize: 16, // Reduced from 18
        fontWeight: 'bold',
        marginBottom: 6,
        marginTop: 4,
    },
    description: {
        fontSize: 13, // Reduced from 14
        lineHeight: 20, // Reduced from 22
        marginBottom: 20,
    },
    actionBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
        paddingBottom: 24,
        borderTopWidth: 1,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    addToCartBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12, // Reduced from 16
        borderRadius: 12,
    },
    addToCartText: {
        color: '#fff',
        fontSize: 14, // Reduced from 16
        fontWeight: 'bold',
    },
});

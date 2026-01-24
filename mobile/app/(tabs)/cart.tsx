import { StyleSheet, FlatList, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useCart, CartItem } from '@/contexts/CartContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';

export default function CartScreen() {
    const { cartItems, removeFromCart, updateQuantity, totalPrice } = useCart();
    const router = useRouter();

    if (cartItems.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                    <FontAwesome name="shopping-cart" size={64} color="#cbd5e1" />
                </View>
                <Text style={styles.emptyTitle}>Your cart is empty</Text>
                <Text style={styles.emptySubtitle}>Looks like you haven't added anything to your cart yet.</Text>
                <TouchableOpacity
                    style={styles.exploreButton}
                    onPress={() => router.push('/(tabs)/explore')}
                >
                    <Text style={styles.exploreButtonText}>Start Shopping</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const renderItem = ({ item }: { item: CartItem }) => (
        <View style={styles.cartItem}>
            <View style={styles.itemImageContainer}>
                {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="cover" />
                ) : (
                    <View style={[styles.itemImage, { backgroundColor: '#f3f4f6' }]} />
                )}
            </View>
            <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>

                <View style={styles.quantityContainer}>
                    <TouchableOpacity
                        style={styles.quantityBtn}
                        onPress={() => {
                            if (item.quantity > 1) {
                                updateQuantity(item.id, item.quantity - 1, item.options);
                            } else {
                                removeFromCart(item.id, item.options);
                            }
                        }}
                    >
                        <FontAwesome name="minus" size={12} color="#64748b" />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity
                        style={styles.quantityBtn}
                        onPress={() => updateQuantity(item.id, item.quantity + 1, item.options)}
                    >
                        <FontAwesome name="plus" size={12} color="#64748b" />
                    </TouchableOpacity>
                </View>
            </View>
            <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => removeFromCart(item.id, item.options)}
            >
                <FontAwesome name="trash-o" size={20} color="#ef4444" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={cartItems}
                renderItem={renderItem}
                keyExtractor={(item) => item.id + JSON.stringify(item.options)}
                contentContainerStyle={styles.list}
            />

            <View style={styles.footer}>
                <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalPrice}>${totalPrice.toFixed(2)}</Text>
                </View>
                <TouchableOpacity style={styles.checkoutBtn} onPress={() => router.push('/checkout')}>
                    <Text style={styles.checkoutBtnText}>Checkout</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    list: {
        padding: 16,
    },
    // Empty State
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        backgroundColor: '#f8fafc',
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 32,
    },
    exploreButton: {
        backgroundColor: '#16a34a',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 24,
    },
    exploreButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    // Cart Item
    cartItem: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    itemImageContainer: {
        width: 80,
        height: 80,
        borderRadius: 8,
        overflow: 'hidden',
        marginRight: 12,
        backgroundColor: '#f1f5f9',
    },
    itemImage: {
        width: '100%',
        height: '100%',
    },
    itemDetails: {
        flex: 1,
        justifyContent: 'space-between',
    },
    itemName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    itemPrice: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#16a34a',
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    quantityBtn: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    quantityText: {
        marginHorizontal: 12,
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
    },
    removeBtn: {
        justifyContent: 'center',
        paddingLeft: 12,
    },
    // Footer
    footer: {
        backgroundColor: 'white',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 5,
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    totalLabel: {
        fontSize: 16,
        color: '#64748b',
    },
    totalPrice: {
        fontSize: 24,
        fontWeight: '900',
        color: '#16a34a',
    },
    checkoutBtn: {
        backgroundColor: '#16a34a',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    checkoutBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

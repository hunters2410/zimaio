import { StyleSheet, FlatList, TouchableOpacity, Image, View } from 'react-native';
import { Text } from '@/components/Themed';
import { useCart, CartItem } from '@/contexts/CartContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import Colors from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CartScreen() {
    const { cartItems, removeFromCart, updateQuantity, totalPrice } = useCart();
    const router = useRouter();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();

    if (cartItems.length === 0) {
        return (
            <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
                <FontAwesome name="shopping-cart" size={48} color={colors.textSecondary} style={{ marginBottom: 16 }} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Your cart is empty</Text>
                <TouchableOpacity
                    style={[styles.exploreButton, { backgroundColor: colors.primary }]}
                    onPress={() => router.push('/(tabs)/explore')}
                >
                    <Text style={[styles.exploreButtonText, { color: '#fff' }]}>Start Shopping</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const renderItem = ({ item }: { item: CartItem }) => (
        <View style={[styles.cartItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.itemImageContainer, { backgroundColor: colors.background }]}>
                {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="cover" />
                ) : (
                    <View style={[styles.itemImage, { backgroundColor: colors.border }]} />
                )}
            </View>
            <View style={styles.itemDetails}>
                <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.itemPrice, { color: colors.primary }]}>${item.price.toFixed(2)}</Text>
                <View style={styles.quantityContainer}>
                    <TouchableOpacity
                        style={[styles.quantityBtn, { borderColor: colors.border }]}
                        onPress={() => item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1, item.options) : removeFromCart(item.id, item.options)}
                    >
                        <FontAwesome name="minus" size={10} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.quantityText, { color: colors.text }]}>{item.quantity}</Text>
                    <TouchableOpacity
                        style={[styles.quantityBtn, { borderColor: colors.border }]}
                        onPress={() => updateQuantity(item.id, item.quantity + 1, item.options)}
                    >
                        <FontAwesome name="plus" size={10} color={colors.text} />
                    </TouchableOpacity>
                </View>
            </View>
            <TouchableOpacity style={styles.removeBtn} onPress={() => removeFromCart(item.id, item.options)}>
                <FontAwesome name="trash-o" size={16} color={colors.danger} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <FlatList
                data={cartItems}
                renderItem={renderItem}
                keyExtractor={(item) => item.id + JSON.stringify(item.options)}
                contentContainerStyle={[styles.list, { paddingBottom: 100 + insets.bottom }]}
            />
            <View style={[
                styles.footer,
                {
                    backgroundColor: colors.card,
                    borderTopColor: colors.border,
                    paddingBottom: Math.max(insets.bottom, 16)
                }
            ]}>
                <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total</Text>
                    <Text style={[styles.totalPrice, { color: colors.primary }]}>${totalPrice.toFixed(2)}</Text>
                </View>
                <TouchableOpacity style={[styles.checkoutBtn, { backgroundColor: colors.primary }]} onPress={() => router.push('/checkout')}>
                    <Text style={styles.checkoutBtnText}>Checkout</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    list: { padding: 12 },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
    emptyTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 20 },
    exploreButton: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 20 },
    exploreButtonText: { fontWeight: 'bold', fontSize: 14 },
    cartItem: { flexDirection: 'row', borderRadius: 10, padding: 8, marginBottom: 10, borderWidth: 1 },
    itemImageContainer: { width: 60, height: 60, borderRadius: 6, overflow: 'hidden', marginRight: 10 },
    itemImage: { width: '100%', height: '100%' },
    itemDetails: { flex: 1, justifyContent: 'center', gap: 4 },
    itemName: { fontSize: 13, fontWeight: '600' },
    itemPrice: { fontSize: 14, fontWeight: 'bold' },
    quantityContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    quantityBtn: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    quantityText: { fontSize: 13, fontWeight: '600' },
    removeBtn: { justifyContent: 'center', paddingLeft: 10 },
    footer: { padding: 16, borderTopWidth: 1 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    totalLabel: { fontSize: 14 },
    totalPrice: { fontSize: 20, fontWeight: '900' },
    checkoutBtn: { paddingVertical: 12, borderRadius: 22, alignItems: 'center' },
    checkoutBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});

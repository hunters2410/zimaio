import { StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useFavorites, FavoriteProduct } from '@/contexts/FavoritesContext';
import { useTheme } from '@/contexts/ThemeContext';
import Colors from '@/constants/Colors';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';

export default function FavoritesScreen() {
    const { favorites, removeFavorite } = useFavorites();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();

    const renderItem = ({ item }: { item: FavoriteProduct }) => (
        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.text }]}>
            <View style={[styles.imageContainer, { backgroundColor: colors.background }]}>
                {item.images && item.images[0] ? (
                    <Image source={{ uri: item.images[0] }} style={styles.image} resizeMode="cover" />
                ) : (
                    <View style={[styles.image, { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{ opacity: 0.5, color: colors.textSecondary }}>No Image</Text>
                    </View>
                )}
                <TouchableOpacity
                    style={[styles.removeBtn, { backgroundColor: 'rgba(239, 68, 68, 0.9)' }]}
                    onPress={() => removeFavorite(item.id)}
                >
                    <FontAwesome name="trash" size={16} color="#fff" />
                </TouchableOpacity>
            </View>
            <View style={[styles.details, { backgroundColor: colors.card }]}>
                <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
                <Text style={[styles.price, { color: colors.primary }]}>${item.base_price.toFixed(2)}</Text>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <FlatList
                data={favorites}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <FontAwesome name="heart-o" size={60} color={colors.textSecondary} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Your wishlist is empty.</Text>
                        <TouchableOpacity
                            style={[styles.shopBtn, { backgroundColor: colors.primary }]}
                            onPress={() => router.back()}
                        >
                            <Text style={styles.shopBtnText}>Start Shopping</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    list: {
        padding: 10,
    },
    card: {
        flex: 1,
        margin: 6,
        borderRadius: 12,
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    imageContainer: {
        height: 140,
        width: '100%',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    removeBtn: {
        position: 'absolute',
        right: 8,
        top: 8,
        borderRadius: 16,
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    details: {
        padding: 12,
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 18,
        marginTop: 16,
        marginBottom: 24,
    },
    shopBtn: {
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 24,
    },
    shopBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

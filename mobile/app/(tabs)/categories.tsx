import { StyleSheet, FlatList, ActivityIndicator, Image, TouchableOpacity, TextInput, View as NativeView } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { Text, View } from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import Colors from '@/constants/Colors';

interface Category {
    id: string;
    name: string;
    slug?: string;
    image_url?: string;
}

export default function CategoriesScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const [categories, setCategories] = useState<Category[]>([]);
    const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadCachedAndFetch();
    }, []);

    const loadCachedAndFetch = async () => {
        try {
            const cached = await AsyncStorage.getItem('cache_categories');
            if (cached) {
                const data = JSON.parse(cached);
                setCategories(data);
                setFilteredCategories(data);
                setLoading(false);
            }
            await fetchCategories();
        } catch (error) {
            console.error('Error loading cached categories:', error);
            await fetchCategories();
        }
    };

    useEffect(() => {
        if (searchQuery) {
            const filtered = categories.filter(cat =>
                cat.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredCategories(filtered);
        } else {
            setFilteredCategories(categories);
        }
    }, [searchQuery, categories]);

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('id, name, image_url')
                .eq('is_active', true)
                .order('name');

            if (error) throw error;
            if (data) {
                setCategories(data);
                setFilteredCategories(data);
                await AsyncStorage.setItem('cache_categories', JSON.stringify(data));
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const SkeletonItem = () => (
        <View style={styles.cardContainer}>
            <View style={[styles.card, { opacity: 0.7, backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.placeholderIcon, { backgroundColor: colors.border, borderColor: colors.border }]} />
                <View style={{ height: 10, width: '80%', backgroundColor: colors.border, marginTop: 8, borderRadius: 4 }} />
            </View>
        </View>
    );

    const renderItem = ({ item, index }: { item: Category; index: number }) => (
        <Animated.View
            entering={FadeInDown.delay(index * 30).springify()}
            style={styles.cardContainer}
        >
            <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(`/category/${item.id}`)}
                activeOpacity={0.7}
            >
                <View style={styles.iconContainer}>
                    {item.image_url ? (
                        <Image
                            source={{ uri: item.image_url }}
                            style={styles.categoryImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={[styles.placeholderIcon, { backgroundColor: theme === 'dark' ? 'rgba(34, 197, 94, 0.2)' : '#f0fdf4', borderColor: theme === 'dark' ? 'rgba(34, 197, 94, 0.4)' : '#bbf7d0' }]}>
                            <Text style={[styles.placeholderText, { color: colors.primary }]}>{item.name.charAt(0)}</Text>
                        </View>
                    )}
                </View>
                <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.searchContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                <FontAwesome name="search" size={20} color={colors.primary} style={styles.searchIcon} />
                <TextInput
                    placeholder="Search categories..."
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.searchInput, { color: colors.text }]}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {loading ? (
                <View style={[styles.list, { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }]}>
                    {[...Array(12)].map((_, i) => <SkeletonItem key={i} />)}
                </View>
            ) : (
                <FlatList
                    data={filteredCategories}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    numColumns={3}
                    contentContainerStyle={styles.list}
                    columnWrapperStyle={styles.columnWrapper}
                    showsVerticalScrollIndicator={false}
                    initialNumToRender={12}
                    maxToRenderPerBatch={6}
                    windowSize={5}
                    removeClippedSubviews={true}
                    onRefresh={fetchCategories}
                    refreshing={loading}
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
        borderRadius: 16,
        paddingHorizontal: 16,
        marginHorizontal: 16,
        marginBottom: 16,
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
        padding: 16,
        paddingTop: 0,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    cardContainer: {
        width: '31%',
        marginBottom: 16,
    },
    card: {
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        shadowColor: '#16a34a', // Keeping some green shadow hint or maybe change to #000 for neutral
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        height: 110,
        justifyContent: 'center',
    },
    iconContainer: {
        marginBottom: 8,
    },
    placeholderIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    categoryImage: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    placeholderText: {
        fontSize: 20,
        fontWeight: '900',
    },
    name: {
        fontSize: 11,
        fontWeight: '700',
        textAlign: 'center',
        textTransform: 'uppercase',
    },
});

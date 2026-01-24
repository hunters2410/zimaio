import { StyleSheet, FlatList, ActivityIndicator, Image, TouchableOpacity, TextInput, View as NativeView } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Text, View } from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

interface Category {
    id: string;
    name: string;
    slug?: string;
    image_url?: string;
}

export default function CategoriesScreen() {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchCategories();
    }, []);

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
                .select('id, name') // Optimization: Only select needed fields
                .eq('is_active', true)
                .order('name');

            if (error) throw error;
            if (data) {
                setCategories(data);
                setFilteredCategories(data);
            }
        } catch (error) {
            console.log('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const SkeletonItem = () => (
        <View style={styles.cardContainer}>
            <View style={[styles.card, { opacity: 0.7 }]}>
                <View style={[styles.placeholderIcon, { backgroundColor: '#e2e8f0', borderColor: '#cbd5e1' }]} />
                <View style={{ height: 10, width: '80%', backgroundColor: '#e2e8f0', marginTop: 8, borderRadius: 4 }} />
            </View>
        </View>
    );

    const renderItem = ({ item, index }: { item: Category; index: number }) => (
        <Animated.View
            entering={FadeInDown.delay(index * 30).springify()} // Optimization: Reduced delay
            style={styles.cardContainer}
        >
            <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/category/${item.id}`)}
                activeOpacity={0.7}
            >
                <View style={styles.iconContainer}>
                    <View style={styles.placeholderIcon}>
                        <Text style={styles.placeholderText}>{item.name.charAt(0)}</Text>
                    </View>
                </View>
                <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <FontAwesome name="search" size={20} color="#16a34a" style={styles.searchIcon} />
                <TextInput
                    placeholder="Search categories..."
                    placeholderTextColor="#9ca3af"
                    style={styles.searchInput}
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
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 10,
        backgroundColor: '#f8fafc',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
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
        borderColor: 'rgba(22, 163, 74, 0.1)',
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#334155',
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
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f1f5f9',
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
        backgroundColor: '#f0fdf4',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#bbf7d0',
    },
    placeholderText: {
        fontSize: 20,
        fontWeight: '900',
        color: '#16a34a',
    },
    name: {
        fontSize: 11,
        fontWeight: '700',
        textAlign: 'center',
        color: '#334155',
        textTransform: 'uppercase',
    },
});

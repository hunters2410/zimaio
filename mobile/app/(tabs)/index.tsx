import { StyleSheet, FlatList, ActivityIndicator, Image, TouchableOpacity, TextInput, ScrollView, Dimensions } from 'react-native';
import { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { supabase } from '../../lib/supabase';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { useFavorites, FavoriteProduct } from '@/contexts/FavoritesContext';
import { useTheme } from '@/contexts/ThemeContext';
import Colors from '@/constants/Colors';

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

export default function HomeScreen() {
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const { theme } = useTheme();
  const colors = Colors[theme];

  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchProducts(), fetchVendors()]);
    } catch (error) {
      console.error("Error in fetchData: ", error);
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
        .limit(20);

      if (error) throw error;
      if (data) setProducts(data);
    } catch (error) {
      console.log('Error fetching products:', error);
    }
  };

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('id, shop_name, shop_logo_url')
        .eq('is_approved', true)
        .limit(20);

      if (error) throw error;
      if (data) setVendors(data);
    } catch (error) {
      console.log('Error fetching vendors:', error);
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
      } as FavoriteProduct);
    }
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.text }]}
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
    <TouchableOpacity style={styles.vendorItem} onPress={() => router.push(`/vendor/${item.id}`)}>
      <View style={[styles.vendorImageContainer, { borderColor: colors.primary, backgroundColor: colors.background }]}>
        {item.shop_logo_url ? (
          <Image source={{ uri: item.shop_logo_url }} style={styles.vendorImage} resizeMode="cover" />
        ) : (
          <View style={[styles.vendorImage, { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
            <FontAwesome name="shopping-bag" size={20} color={colors.textSecondary} />
          </View>
        )}
      </View>
      <Text style={[styles.vendorName, { color: colors.text }]} numberOfLines={1}>{item.shop_name || 'Vendor'}</Text>
    </TouchableOpacity>
  );

  const VendorSkeleton = () => (
    <View style={styles.vendorItem}>
      <View style={[styles.vendorImageContainer, { backgroundColor: colors.border, borderColor: colors.border }]} />
      <View style={{ height: 10, width: 50, backgroundColor: colors.border, marginTop: 4, borderRadius: 4 }} />
    </View>
  )

  const ProductSkeleton = () => (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={[styles.imageContainer, { backgroundColor: colors.border }]} />
      <View style={[styles.details, { backgroundColor: colors.card }]}>
        <View style={{ height: 10, width: '90%', backgroundColor: colors.border, marginBottom: 6, borderRadius: 4 }} />
        <View style={{ height: 12, width: '50%', backgroundColor: colors.border, borderRadius: 4 }} />
      </View>
    </View>
  )

  const renderHeader = () => (
    <View style={{ backgroundColor: colors.background }}>
      <View style={styles.searchRow}>
        <View style={[styles.searchContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border, marginRight: 0 }]}>
          <FontAwesome name="search" size={20} color={colors.primary} style={styles.searchIcon} />
          <TextInput
            placeholder="Search premium products..."
            placeholderTextColor={colors.textSecondary}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>
      </View>

      <Text style={[styles.header, { color: colors.primary }]}>Vendors</Text>
      <View style={styles.vendorsContainer}>
        {loading ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vendorsList}>
            {[...Array(6)].map((_, i) => <VendorSkeleton key={i} />)}
          </ScrollView>
        ) : (
          <FlatList
            data={vendors}
            renderItem={renderVendorItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.vendorsList}
          />
        )}
      </View>

      <Text style={[styles.header, { color: colors.primary }]}>Featured Products</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {loading ? (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {renderHeader()}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10 }}>
            {[...Array(6)].map((_, i) => (
              <View key={i} style={{ width: '50%' }}>
                <ProductSkeleton />
              </View>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          key={2}
          numColumns={2}
          contentContainerStyle={styles.list}
          ListHeaderComponent={renderHeader}
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
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 8,
    textTransform: 'uppercase',
    color: '#16a34a',
    letterSpacing: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 20,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.1)',
    marginRight: 10,
  },
  bellButton: {
    width: 50,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.1)',
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
    color: '#334155',
    fontWeight: '500',
  },
  vendorsContainer: {
    marginBottom: 10,
  },
  vendorsList: {
    paddingHorizontal: 16,
    paddingVertical: 4, // Add some vertical padding for shadows
  },
  vendorItem: {
    alignItems: 'center',
    marginRight: 20,
    width: 70,
  },
  vendorImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#16a34a',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vendorImage: {
    width: '100%',
    height: '100%',
  },
  vendorName: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    color: '#334155',
  },
  list: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  card: {
    flex: 1,
    margin: 6,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  imageContainer: {
    height: 100,
    width: '100%',
    backgroundColor: '#f8fafc',
    position: 'relative',
  },
  favoriteBtn: {
    position: 'absolute',
    right: 5,
    top: 5,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
    padding: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  details: {
    padding: 8,
    backgroundColor: '#fff',
  },
  productName: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    color: '#334155',
  },
  price: {
    fontSize: 13,
    fontWeight: '900',
    color: '#16a34a',
  },
});

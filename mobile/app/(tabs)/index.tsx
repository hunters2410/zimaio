import { StyleSheet, FlatList, Image, ImageBackground, TouchableOpacity, TextInput, ScrollView, Dimensions, ActivityIndicator, Animated, Alert } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { supabase } from '@/lib/supabase';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { useFavorites, FavoriteProduct } from '@/contexts/FavoritesContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useCart } from '@/contexts/CartContext';
import Colors from '@/constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_WIDTH = SCREEN_WIDTH - 24;

interface Product {
  id: string;
  name: string;
  base_price: number;
  images: string[];
  vendor_id?: string;
}

interface Vendor {
  id: string;
  shop_name: string;
  shop_logo_url: string;
}

interface HomeSlide {
  id: string;
  title: string;
  image_url: string;
  link_url?: string;
}

interface Category {
  id: string;
  name: string;
  image_url: string;
}



export default function HomeScreen() {
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const { addToCart, cartItems, updateQuantity } = useCart();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();

  // Products and Vendors state
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [slides, setSlides] = useState<HomeSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadCachedDataAndFetch();
  }, []); // Only fetch on mount

  const loadCachedDataAndFetch = async () => {
    try {
      // Load cached data first for instant display
      const [cachedSlides, cachedProducts, cachedVendors, cachedCategories] = await Promise.all([
        AsyncStorage.getItem('cache_home_slides'),
        AsyncStorage.getItem('cache_home_products'),
        AsyncStorage.getItem('cache_home_vendors'),
        AsyncStorage.getItem('cache_home_categories')
      ]);

      if (cachedSlides) setSlides(JSON.parse(cachedSlides));
      if (cachedProducts) setProducts(JSON.parse(cachedProducts));
      if (cachedVendors) setVendors(JSON.parse(cachedVendors));
      if (cachedCategories) setCategories(JSON.parse(cachedCategories));

      // If we have cache, show it immediately
      if (cachedSlides && cachedProducts && cachedVendors && cachedCategories) {
        setLoading(false);
      }

      // Then fetch fresh data in background
      await fetchData();
    } catch (error) {
      console.error('Error loading cached data:', error);
      await fetchData();
    }
  };

  // Auto-switch slideshow with fade
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setActiveSlide(prev => (prev === slides.length - 1 ? 0 : prev + 1));
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const fetchData = async () => {
    try {
      // Fetch all data in parallel for better performance
      await Promise.all([fetchSlides(), fetchProducts(), fetchVendors(), fetchCategories()]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSlides = async () => {
    try {
      const { data, error } = await supabase
        .from('home_slides')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(5); // Limit to 5 slides for performance

      if (error) throw error;

      if (data) {
        setSlides(data);
        await AsyncStorage.setItem('cache_home_slides', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error fetching slides:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, base_price, images, vendor_id')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10); // Reduced to 10 for faster initial load

      if (error) throw error;
      if (data) {
        setProducts(data);
        await AsyncStorage.setItem('cache_home_products', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('id, shop_name, shop_logo_url')
        .eq('is_approved', true)
        .limit(6); // Reduced to 6 for faster load

      if (error) throw error;
      if (data) {
        setVendors(data);
        await AsyncStorage.setItem('cache_home_vendors', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Error fetching vendors:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, image_url')
        .eq('is_active', true)
        .order('name')
        .limit(10);

      if (error) throw error;
      if (data) {
        setCategories(data);
        await AsyncStorage.setItem('cache_home_categories', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const toggleFavorite = (item: Product) => {
    if (isFavorite(item.id)) removeFavorite(item.id);
    else addFavorite({ id: item.id, name: item.name, base_price: item.base_price, images: item.images } as FavoriteProduct);
  };

  const handleAddToCart = (item: Product) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.base_price,
      base_price: item.base_price,
      image: item.images?.[0] || '',
      quantity: 1,
      vendor: 'Vendor',
      vendor_id: item.vendor_id || 'unknown'
    });
  };



  const renderVendorItem = ({ item }: { item: Vendor }) => (
    <TouchableOpacity style={styles.vendorItem} onPress={() => router.push(`/vendor/${item.id}`)}>
      <View style={[styles.vendorImageContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
        {item.shop_logo_url ? (
          <Image source={{ uri: item.shop_logo_url }} style={styles.vendorImage} />
        ) : (
          <FontAwesome name="shopping-bag" size={16} color={colors.textSecondary} />
        )}
      </View>
      <Text style={[styles.vendorName, { color: colors.text }]} numberOfLines={1}>{item.shop_name}</Text>
    </TouchableOpacity>
  );

  /* Marketplace Style Constants */
  const SPACING = 2;
  const ITEM_WIDTH = (SCREEN_WIDTH / 2) - SPACING; // For products

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={[styles.card, { width: ITEM_WIDTH, backgroundColor: colors.card }]}
      onPress={() => router.push(`/product/${item.id}`)}
      activeOpacity={0.9}
    >
      <View style={[styles.imageContainer, { height: ITEM_WIDTH }]}>
        {item.images?.[0] ? (
          <Image source={{ uri: item.images[0] }} style={styles.productImage} resizeMode="cover" />
        ) : (
          <View style={[styles.placeholderImage, { backgroundColor: colors.border }]}>
            <Text style={{ fontSize: 10, color: colors.textSecondary }}>No Image</Text>
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
              color={isFavorite(item.id) ? colors.danger : '#333'} // Force dark color for visibility on white bg
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconCircle, { backgroundColor: colors.primary }]}
            onPress={() => handleAddToCart(item)}
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



  const renderHeader = () => (
    <View style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8 }}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
        <FontAwesome name="search" size={14} color={colors.textSecondary} style={{ marginRight: 8 }} />
        <TextInput placeholder="Search..." placeholderTextColor={colors.textSecondary} style={[styles.searchInput, { color: colors.text }]} />
      </View>

      {/* Sell On ZimAIO Banner */}
      <TouchableOpacity
        style={styles.sellBanner}
        onPress={async () => {
          const { data: { session } } = await supabase.auth.getSession();

          if (!session) {
            Alert.alert(
              "Start Selling",
              "Join ZimAIO as a vendor today!",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Sign In", onPress: () => router.push('/login') },
                { text: "Sign Up", onPress: () => router.push('/vendor-portal/register') }
              ]
            );
            return;
          }

          // Check if vendor
          const { data: vendor } = await supabase
            .from('vendor_profiles')
            .select('id')
            .eq('user_id', session.user.id)
            .single();

          if (vendor) {
            router.push('/vendor-portal');
          } else {
            Alert.alert(
              "Become a Vendor",
              "Complete your vendor registration to start selling.",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Register as Vendor", onPress: () => router.push('/vendor-portal/register') }
              ]
            );
          }
        }}
      >
        <Text style={styles.sellBannerText}>
          <Text style={{ color: '#2563eb' }}>Sell On </Text>
          <Text style={{ color: '#16a34a' }}>ZimAIO</Text>
        </Text>
        <FontAwesome name="angle-right" size={16} color="#16a34a" />
      </TouchableOpacity>

      {/* Slideshow */}
      {slides.length > 0 && (
        <Animated.View style={[styles.carouselContainer, { opacity: fadeAnim }]}>
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={() => slides[activeSlide].link_url && router.push(slides[activeSlide].link_url as any)}
          >
            <ImageBackground
              source={{ uri: slides[activeSlide].image_url }}
              style={styles.slideImageBackground}
              imageStyle={{ borderRadius: 12 }}
              resizeMode="cover"
            >
              <View style={styles.slideTextOverlay}>
                <Text style={styles.slideTitle}>{slides[activeSlide].title}</Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>

          {/* Pagination Dots - Temporarily Removed for Testing */}
          {/* {slides.length > 1 && (
            <View style={styles.paginationContainer}>
              {slides.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
                      setActiveSlide(index);
                      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
                    });
                  }}
                >
                  <View
                    style={[
                      styles.paginationDot,
                      { backgroundColor: index === activeSlide ? '#fff' : 'rgba(255,255,255,0.5)' }
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )} */}
        </Animated.View>
      )}

      {/* Categories */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>CATEGORIES</Text>
        <TouchableOpacity onPress={() => router.push('/categories')}>
          <Text style={{ fontSize: 10, color: colors.primary, fontWeight: 'bold' }}>VIEW ALL</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={categories}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.categoryHomeItem}
            onPress={() => router.push(`/category/${item.id}`)}
          >
            <View style={[styles.categoryCircle, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.categoryHomeImage} />
              ) : (
                <FontAwesome name="th-large" size={20} color={colors.textSecondary} />
              )}
            </View>
            <Text style={[styles.categoryHomeName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
          </TouchableOpacity>
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
      />

      {/* Vendors */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>VENDORS</Text>
        <TouchableOpacity onPress={() => router.push('/explore?mode=vendors')}><Text style={{ fontSize: 10, color: colors.primary, fontWeight: 'bold' }}>VIEW ALL</Text></TouchableOpacity>
      </View>
      <FlatList
        data={vendors}
        renderItem={renderVendorItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.vendorList}
      />

      {/* Featured Products Title */}
      <View style={[styles.sectionHeader, { marginBottom: 4 }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Product Pick</Text>
        <TouchableOpacity onPress={() => router.push('/explore?mode=products')}>
          <Text style={{ fontSize: 10, color: colors.primary, fontWeight: 'bold' }}>VIEW ALL</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {loading && products.length === 0 ? (
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
          ListHeaderComponent={renderHeader}
          columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: SPACING }}
          showsVerticalScrollIndicator={false}
          initialNumToRender={6}
          maxToRenderPerBatch={4}
          windowSize={5}
          removeClippedSubviews={true}
          onRefresh={fetchData}
          refreshing={loading}
          ListEmptyComponent={
            <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
              <FontAwesome name="shopping-bag" size={40} color={colors.textSecondary} style={{ marginBottom: 10, opacity: 0.5 }} />
              <Text style={{ color: colors.textSecondary }}>No products available at the moment.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 0,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  carouselContainer: {
    height: 160,
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
  },
  slideImageBackground: {
    width: '100%',
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideTextOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  slideTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
  detailsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(50,50,50,0.7)', // Changed from black (0,0,0,0.6) to greyish
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  vendorList: {
    marginBottom: 16,
  },
  vendorItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 56,
  },
  vendorImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 4,
    overflow: 'hidden',
  },
  vendorImage: {
    width: '100%',
    height: '100%',
  },
  vendorName: {
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
  card: {
    overflow: 'hidden',
    borderWidth: 0,
    marginBottom: 0,
    borderRadius: 12,
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: '#e2e8f0',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    padding: 6,
  },
  details: {
    padding: 8,
    paddingTop: 6,
  },
  productName: {
    fontSize: 13,
    fontWeight: 'bold', // Changed from 400
    flex: 1,
  },
  price: {
    fontSize: 14, // Slightly larger
    fontWeight: '900', // Already bold but confirmed
  },
  sellBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryList: {
    paddingBottom: 16,
  },
  categoryHomeItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 64,
  },
  categoryCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 6,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryHomeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  categoryHomeName: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  sellBannerText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

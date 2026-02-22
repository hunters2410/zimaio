import { useState, useEffect } from 'react';
import { StyleSheet, Alert, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function AddProductScreen() {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const isEditing = !!id;

    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [description, setDescription] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('');

    useEffect(() => {
        fetchCategories();
        if (isEditing) {
            fetchProductDetails();
        }
    }, [id]);

    const fetchCategories = async () => {
        try {
            const { data } = await supabase.from('categories').select('*').order('name');
            if (data) setCategories(data);
        } catch (error) {
            console.error('Categories fetch error:', error);
        }
    };

    const fetchProductDetails = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                setName(data.name);
                setPrice(data.base_price.toString());
                setStock(data.stock_quantity.toString());
                setDescription(data.description || '');
                setImages(data.images || []);
                setSelectedCategory(data.category_id);
            }
        } catch (error: any) {
            Alert.alert('Error', 'Failed to fetch product details');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled) {
            uploadImage(result.assets[0]);
        }
    };

    const uploadImage = async (imageAsset: ImagePicker.ImagePickerAsset) => {
        try {
            setUploading(true);
            const base64 = imageAsset.base64;
            const fileExt = imageAsset.uri.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `product-images/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(filePath, decode(base64!), {
                    contentType: imageAsset.mimeType,
                });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath);

            setImages(prev => [...prev, data.publicUrl]);
        } catch (error: any) {
            Alert.alert('Error', 'Failed to upload image: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!name || !price || !stock || !selectedCategory) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }

        if (images.length === 0) {
            Alert.alert('Error', 'Please upload at least one image');
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data: vendor } = await supabase
                .from('vendor_profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!vendor) throw new Error('Vendor profile not found');

            const productData = {
                name,
                base_price: parseFloat(price),
                stock_quantity: parseInt(stock),
                description,
                images: images,
                category_id: selectedCategory,
                vendor_id: vendor.id,
                is_active: true
            };

            if (isEditing) {
                const { error } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', id);
                if (error) throw error;
                Alert.alert('Success', 'Product updated successfully!', [{ text: 'OK', onPress: () => router.back() }]);
            } else {
                const { error } = await supabase
                    .from('products')
                    .insert([productData]);
                if (error) throw error;
                Alert.alert('Success', 'Product added successfully!', [{ text: 'OK', onPress: () => router.back() }]);
            }

        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const decode = (base64: string) => {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    };

    const atob = (input: string = '') => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        let str = input.replace(/=+$/, '');
        let output = '';

        if (str.length % 4 == 1) {
            throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
        }
        for (let bc = 0, bs = 0, buffer, i = 0;
            buffer = str.charAt(i++);

            ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
                bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
        ) {
            buffer = chars.indexOf(buffer);
        }

        return output;
    }

    return (
        <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 20 }}>
            <Stack.Screen options={{ title: isEditing ? 'Edit Product' : 'Add Product' }} />

            <View style={{ marginBottom: 20 }}>
                <Text style={[styles.label, { color: colors.text }]}>Product Images</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginBottom: 10 }}>
                    {images.map((img, index) => (
                        <View key={index} style={{ marginRight: 10, position: 'relative' }}>
                            <Image source={{ uri: img }} style={styles.uploadedImage} />
                            <TouchableOpacity
                                style={styles.removeBtn}
                                onPress={() => removeImage(index)}
                            >
                                <FontAwesome name="times" size={12} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    ))}
                    <TouchableOpacity onPress={pickImage} style={[styles.imageUpload, { borderColor: colors.border, backgroundColor: colors.card }]}>
                        {uploading ? (
                            <ActivityIndicator color={colors.primary} />
                        ) : (
                            <View style={{ alignItems: 'center' }}>
                                <FontAwesome name="image" size={24} color={colors.textSecondary} />
                                <Text style={{ marginTop: 4, color: colors.textSecondary, fontSize: 10 }}>Add</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                {categories.map((cat) => (
                    <TouchableOpacity
                        key={cat.id}
                        onPress={() => setSelectedCategory(cat.id)}
                        style={[
                            styles.categoryChip,
                            {
                                backgroundColor: selectedCategory === cat.id ? colors.primary : colors.card,
                                borderColor: selectedCategory === cat.id ? colors.primary : colors.border
                            }
                        ]}
                    >
                        <Text style={{ color: selectedCategory === cat.id ? '#fff' : colors.text }}>{cat.name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <Text style={[styles.label, { color: colors.text }]}>Product Name *</Text>
            <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                placeholder="Product Name"
                value={name}
                onChangeText={setName}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: colors.text }]}>Price ($) *</Text>
                    <TextInput
                        style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                        placeholder="0.00"
                        keyboardType="numeric"
                        value={price}
                        onChangeText={setPrice}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: colors.text }]}>Stock *</Text>
                    <TextInput
                        style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                        placeholder="0"
                        keyboardType="numeric"
                        value={stock}
                        onChangeText={setStock}
                    />
                </View>
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Description</Text>
            <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border, height: 100, textAlignVertical: 'top' }]}
                placeholder="Product Description"
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
            />

            <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
                onPress={handleSubmit}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>{isEditing ? 'Update Product' : 'Add Product'}</Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    imageUpload: {
        width: 100,
        height: 100,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    uploadedImage: {
        width: 100,
        height: 100,
        borderRadius: 12,
    },
    removeBtn: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#ef4444',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#fff',
        zIndex: 1,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        marginBottom: 20,
    },
    categoryChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 8,
    },
    button: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 40,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

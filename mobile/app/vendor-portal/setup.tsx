import { useState, useEffect } from 'react';
import { StyleSheet, Alert, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VendorSetupScreen() {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();

    const [shopName, setShopName] = useState('');
    const [shopDescription, setShopDescription] = useState('');
    const [businessPhone, setBusinessPhone] = useState('');
    const [shopLogo, setShopLogo] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return router.replace('/login');

        const { data } = await supabase
            .from('vendor_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (data) {
            setShopName(data.shop_name || '');
            setShopDescription(data.shop_description || '');
            setBusinessPhone(data.business_phone || '');
            setShopLogo(data.shop_logo_url || '');
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

    const uploadImage = async (image: ImagePicker.ImagePickerAsset) => {
        try {
            setUploading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const fileExt = image.uri.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;
            const filePath = `vendor-logos/${fileName}`;
            const base64 = image.base64;

            // Simple ArrayBuffer conversion for React Native if needed
            const { error: uploadError } = await supabase.storage
                .from('avatars') // Using avatars bucket as common public bucket
                .upload(filePath, decode(base64!), {
                    contentType: image.mimeType || 'image/jpeg',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setShopLogo(data.publicUrl);
        } catch (error: any) {
            Alert.alert('Error', 'Failed to upload image: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    // Polyfill for base64 decode
    const decode = (base64: string) => { // @ts-ignore
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
        if (str.length % 4 == 1) throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
        for (let bc = 0, bs = 0, buffer, i = 0;
            buffer = str.charAt(i++);
            ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
        ) {
            buffer = chars.indexOf(buffer);
        }
        return output;
    }


    const handleSubmit = async () => {
        if (!shopName || !businessPhone) {
            Alert.alert('Error', 'Shop Name and Phone are required.');
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            const { error } = await supabase
                .from('vendor_profiles')
                .update({
                    shop_name: shopName,
                    shop_description: shopDescription,
                    business_phone: businessPhone,
                    shop_logo_url: shopLogo,
                })
                .eq('user_id', user.id);

            if (error) throw error;

            router.replace('/vendor-portal');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>Shop Setup</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Configure your digital storefront identity.</Text>
                </View>

                {/* Logo Upload */}
                <View style={{ alignItems: 'center', marginBottom: 30 }}>
                    <TouchableOpacity onPress={pickImage} style={[styles.logoUpload, { borderColor: colors.border, backgroundColor: colors.card }]}>
                        {shopLogo ? (
                            <Image source={{ uri: shopLogo }} style={{ width: '100%', height: '100%' }} />
                        ) : (
                            <View style={{ alignItems: 'center' }}>
                                <FontAwesome name="image" size={30} color={colors.textSecondary} />
                                <Text style={{ marginTop: 8, color: colors.textSecondary, fontSize: 12 }}>Upload Logo</Text>
                            </View>
                        )}
                        {uploading && (
                            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }]}>
                                <ActivityIndicator color={colors.primary} />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Shop Name *</Text>
                    <TextInput
                        style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                        value={shopName}
                        onChangeText={setShopName}
                        placeholder="e.g. Zim Best Electronics"
                        placeholderTextColor={colors.textSecondary}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Business Phone *</Text>
                    <TextInput
                        style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                        value={businessPhone}
                        onChangeText={setBusinessPhone}
                        placeholder="+263 ..."
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="phone-pad"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Shop Description</Text>
                    <TextInput
                        style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.border, height: 100, textAlignVertical: 'top' }]}
                        value={shopDescription}
                        onChangeText={setShopDescription}
                        placeholder="Tell us about your products..."
                        placeholderTextColor={colors.textSecondary}
                        multiline
                        numberOfLines={4}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.primary }]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Launch My Store</Text>}
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        marginBottom: 30,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        textAlign: 'center',
        fontSize: 14,
    },
    logoUpload: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
    },
    button: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});

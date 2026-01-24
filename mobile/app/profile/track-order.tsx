import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Stack, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import Colors from '@/constants/Colors';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function TrackOrderScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = Colors[theme];

    const [orderNumber, setOrderNumber] = useState('');
    const [loading, setLoading] = useState(false);

    const handleTrack = async () => {
        if (!orderNumber.trim()) {
            Alert.alert('Error', 'Please enter an Order Number');
            return;
        }

        setLoading(true);
        try {
            // Try to find the order by order_number
            // Note: This relies on RLS allowing read access. 
            // If strictly private, this might fail for guests unless we have a public tracking policy.
            const { data, error } = await supabase
                .from('orders')
                .select('id')
                .eq('order_number', orderNumber.trim())
                .single();

            if (error) {
                // If row not found or permission denied
                throw new Error('Order not found or access denied.');
            }

            if (data) {
                router.push(`/orders/${data.id}`);
            }
        } catch (error: any) {
            console.error(error);
            Alert.alert('Tracking Failed', 'Could not find an order with that number. Please check and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <Stack.Screen options={{ title: 'Track Order' }} />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <View style={styles.iconContainer}>
                        <FontAwesome name="search" size={40} color={colors.primary} />
                    </View>
                    <Text style={[styles.title, { color: colors.text }]}>Track Your Order</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Enter your order tracking number below to check its status.
                    </Text>

                    <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="e.g. ORD-17384..."
                            placeholderTextColor={colors.textSecondary}
                            value={orderNumber}
                            onChangeText={setOrderNumber}
                            autoCapitalize="characters"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.primary }]}
                        onPress={handleTrack}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Track Order</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        flexGrow: 1,
        justifyContent: 'center',
    },
    card: {
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    iconContainer: {
        marginBottom: 16,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(22, 163, 74, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    inputContainer: {
        width: '100%',
        borderRadius: 12,
        borderWidth: 1,
        height: 50,
        marginBottom: 20,
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    input: {
        fontSize: 16,
    },
    button: {
        width: '100%',
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

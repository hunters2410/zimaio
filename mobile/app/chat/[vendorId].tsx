import { useState, useEffect, useRef } from 'react';
import { StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Stack, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTheme } from '@/contexts/ThemeContext';
import Colors from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';

interface Message {
    id: string;
    sender_id: string;
    sender_type: 'customer' | 'vendor';
    message: string;
    created_at: string;
    is_read: boolean;
}

export default function ChatScreen() {
    const { vendorId: rawVendorId } = useLocalSearchParams();
    const vendorId = Array.isArray(rawVendorId) ? rawVendorId[0] : rawVendorId;
    const { theme } = useTheme();
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();
    const headerHeight = useHeaderHeight();

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [resolvedVendorId, setResolvedVendorId] = useState<string | null>(null);
    const [vendorName, setVendorName] = useState('Vendor');
    const flatListRef = useRef<FlatList>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        if (vendorId) {
            initializeChat();
        } else {
            setLoading(false);
            setErrorMsg("No vendor ID provided");
        }
    }, [vendorId]);

    const initializeChat = async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
            console.log('🔄 Initializing chat with vendorId:', vendorId);

            if (!vendorId) {
                throw new Error("Invalid Vendor ID");
            }

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.log('❌ No user found');
                setLoading(false);
                return;
            }
            console.log('✅ User found:', user.id);
            setCurrentUserId(user.id);

            // Get vendor details - vendorId might be the vendor's user_id or the profile id
            console.log('🔍 Fetching vendor details...');

            // Try fetching by profile ID first
            let vendorData = await supabase
                .from('vendor_profiles')
                .select('id, shop_name, user_id')
                .eq('id', vendorId)
                .maybeSingle();

            // If not found, try by user_id
            if (!vendorData.data) {
                console.log('⚠️ Vendor not found by profile ID, trying user_id...');
                vendorData = await supabase
                    .from('vendor_profiles')
                    .select('id, shop_name, user_id')
                    .eq('user_id', vendorId)
                    .maybeSingle();
            }

            if (vendorData.error) throw vendorData.error;

            if (!vendorData.data) {
                throw new Error("Vendor profile not found");
            }

            const vendor = vendorData.data;
            console.log('✅ Vendor found:', vendor.shop_name, 'ID:', vendor.id);
            setVendorName(vendor.shop_name || 'Vendor');
            setResolvedVendorId(vendor.id);

            // Fetch existing messages using the correct vendor profile ID
            console.log('📥 Fetching messages...');
            await fetchMessages(user.id, vendor.id);

            // Subscribe to new messages
            console.log('👂 Setting up real-time subscription...');
            const channel = supabase
                .channel(`chat:${user.id}:${vendor.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `customer_id=eq.${user.id},vendor_id=eq.${vendor.id}`
                    },
                    (payload) => {
                        console.log('📨 New message received:', payload.new);
                        setMessages(prev => [...prev, payload.new as Message]);
                        scrollToBottom();
                    }
                )
                .subscribe();

            console.log('✅ Chat initialized successfully');

            return () => {
                console.log('🔌 Unsubscribing from chat channel');
                supabase.removeChannel(channel);
            };
        } catch (error: any) {
            console.error('💥 Error initializing chat:', error);
            setErrorMsg(error.message || "Failed to load chat");
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (userId: string, vendorProfileId: string) => {
        try {
            console.log('📥 Fetching messages for customer:', userId, 'vendor:', vendorProfileId);

            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('customer_id', userId)
                .eq('vendor_id', vendorProfileId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('❌ Error fetching messages:', error);
                throw error;
            }

            console.log('✅ Fetched', data?.length || 0, 'messages');
            setMessages(data || []);
            setTimeout(scrollToBottom, 100);
        } catch (error) {
            console.error('💥 Error in fetchMessages:', error);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !currentUserId || !resolvedVendorId || sending) return;

        setSending(true);
        try {
            const { error } = await supabase
                .from('messages')
                .insert({
                    customer_id: currentUserId,
                    vendor_id: resolvedVendorId,
                    sender_id: currentUserId,
                    sender_type: 'customer',
                    message: newMessage.trim(),
                    is_read: false
                });

            if (error) throw error;

            setNewMessage('');
            scrollToBottom();
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const scrollToBottom = () => {
        if (flatListRef.current && messages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: true });
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isMyMessage = item.sender_id === currentUserId;

        return (
            <View style={[
                styles.messageContainer,
                isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer
            ]}>
                <View style={[
                    styles.messageBubble,
                    isMyMessage
                        ? { backgroundColor: colors.primary }
                        : { backgroundColor: colors.card }
                ]}>
                    <Text style={[
                        styles.messageText,
                        { color: isMyMessage ? '#FFF' : colors.text }
                    ]}>
                        {item.message}
                    </Text>
                    <Text style={[
                        styles.messageTime,
                        { color: isMyMessage ? 'rgba(255,255,255,0.7)' : colors.textSecondary }
                    ]}>
                        {formatTime(item.created_at)}
                    </Text>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Stack.Screen options={{ title: 'Loading Chat...' }} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </View>
        );
    }

    if (errorMsg) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Stack.Screen options={{ title: 'Chat Error' }} />
                <View style={styles.emptyContainer}>
                    <FontAwesome name="exclamation-circle" size={40} color={colors.danger || '#ef4444'} />
                    <Text style={[styles.emptyText, { color: colors.text, marginTop: 20 }]}>
                        {errorMsg}
                    </Text>
                    <TouchableOpacity
                        style={[styles.sendButton, { width: 120, backgroundColor: colors.primary, marginTop: 20 }]}
                        onPress={() => initializeChat()}
                    >
                        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (!currentUserId) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Stack.Screen options={{ title: 'Chat' }} />
                <View style={styles.emptyContainer}>
                    <FontAwesome name="sign-in" size={40} color={colors.textSecondary} />
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        Please sign in to chat with vendors
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
        >
            <Stack.Screen options={{ title: vendorName }} />

            <FlatList
                ref={flatListRef}
                style={{ flex: 1 }}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={[styles.messagesList, { paddingBottom: 20 }]}
                onContentSizeChange={scrollToBottom}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <FontAwesome name="comments" size={40} color={colors.textSecondary} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            No messages yet
                        </Text>
                        <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                            Start a conversation with {vendorName}
                        </Text>
                    </View>
                }
            />

            <View style={[
                styles.inputContainer,
                {
                    backgroundColor: colors.card,
                    borderTopColor: colors.border,
                    paddingBottom: Math.max(insets.bottom, 20) // Ensure it clears the home indicator/nav bar
                }
            ]}>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    placeholder="Type a message..."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity
                    style={[styles.sendButton, { backgroundColor: newMessage.trim() ? colors.primary : colors.border }]}
                    onPress={sendMessage}
                    disabled={!newMessage.trim() || sending}
                >
                    {sending ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <FontAwesome name="send" size={18} color="#FFF" />
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        marginTop: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    emptySubtext: {
        marginTop: 8,
        fontSize: 14,
        textAlign: 'center',
    },
    messagesList: {
        padding: 16,
    },
    messageContainer: {
        marginBottom: 12,
        maxWidth: '80%',
    },
    myMessageContainer: {
        alignSelf: 'flex-end',
    },
    theirMessageContainer: {
        alignSelf: 'flex-start',
    },
    messageBubble: {
        padding: 12,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    messageTime: {
        fontSize: 11,
        marginTop: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        borderTopWidth: 1,
        alignItems: 'flex-end',
        gap: 8,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        maxHeight: 100,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

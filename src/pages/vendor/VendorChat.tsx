import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { MessageCircle, Send, Search, Circle } from 'lucide-react';

interface Conversation {
    customer_id: string;
    customer_name: string;
    customer_avatar?: string;
    last_message: string;
    last_message_at: string;
    unread_count: number;
}

interface Message {
    id: string;
    customer_id: string;
    vendor_id: string;
    sender_id: string;
    sender_type: 'customer' | 'vendor';
    message: string;
    created_at: string;
    is_read: boolean;
}

export function VendorChat() {
    const { profile } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [vendorId, setVendorId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (profile?.id) {
            initializeVendor();
        }
    }, [profile?.id]);

    useEffect(() => {
        if (selectedCustomerId && vendorId) {
            fetchMessages(selectedCustomerId);
            markAsRead(selectedCustomerId);
        }
    }, [selectedCustomerId, vendorId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const initializeVendor = async () => {
        try {
            // Get vendor details
            const { data: vendorData, error } = await supabase
                .from('vendor_profiles')
                .select('id')
                .eq('user_id', profile?.id)
                .single();

            if (error) throw error;
            if (vendorData) {
                setVendorId(vendorData.id);
                fetchConversations(vendorData.id);
                subscribeToMessages(vendorData.id);
            }
        } catch (error) {
            console.error('Error initializing vendor chat:', error);
            setLoading(false);
        }
    };

    const subscribeToMessages = (vId: string) => {
        const subscription = supabase
            .channel(`vendor_chat:${vId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `vendor_id=eq.${vId}`
                },
                (payload) => {
                    const newMsg = payload.new as Message;

                    // Update messages if this conversation is open
                    if (selectedCustomerId === newMsg.customer_id) {
                        setMessages(prev => [...prev, newMsg]);
                        markAsRead(newMsg.customer_id);
                    }

                    // Refresh conversations list to update order and last message
                    fetchConversations(vId);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    };

    const fetchConversations = async (vId: string) => {
        try {
            // Fetch all messages for this vendor to group them
            // Note: In a production app with millions of messages, you'd want a dedicated conversations view or table
            const { data: allMessages, error } = await supabase
                .from('messages')
                .select('customer_id, message, created_at, is_read, sender_id, sender_type')
                .eq('vendor_id', vId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const groupedMap = new Map<string, Conversation>();

            // Process messages to build conversation list
            for (const msg of allMessages || []) {
                if (!groupedMap.has(msg.customer_id)) {
                    // Initial entry for this customer
                    groupedMap.set(msg.customer_id, {
                        customer_id: msg.customer_id,
                        customer_name: 'Loading...', // Will fetch below
                        last_message: msg.message,
                        last_message_at: msg.created_at,
                        unread_count: 0
                    });
                }

                // Increment unread count if it's an unread message from customer
                if (!msg.is_read && msg.sender_type === 'customer') {
                    const conv = groupedMap.get(msg.customer_id)!;
                    conv.unread_count += 1;
                }
            }

            const convs = Array.from(groupedMap.values());

            // Fetch customer details
            const customerIds = convs.map(c => c.customer_id);
            if (customerIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url')
                    .in('id', customerIds);

                const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

                convs.forEach(c => {
                    const p = profileMap.get(c.customer_id);
                    if (p) {
                        c.customer_name = p.full_name || 'Anonymous';
                        c.customer_avatar = p.avatar_url;
                    }
                });
            }

            setConversations(convs);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (customerId: string) => {
        if (!vendorId) return;

        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('vendor_id', vendorId)
                .eq('customer_id', customerId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMessages(data || []);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const markAsRead = async (customerId: string) => {
        if (!vendorId) return;

        await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('vendor_id', vendorId)
            .eq('customer_id', customerId)
            .eq('sender_type', 'customer')
            .eq('is_read', false);

        // Update local unread count
        setConversations(prev => prev.map(c =>
            c.customer_id === customerId ? { ...c, unread_count: 0 } : c
        ));
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedCustomerId || !vendorId || !profile?.id) return;

        setSending(true);
        try {
            const messageData = {
                vendor_id: vendorId,
                customer_id: selectedCustomerId,
                sender_id: profile.id,
                sender_type: 'vendor',
                message: newMessage.trim(),
                is_read: false
            };

            const { error } = await supabase
                .from('messages')
                .insert(messageData);

            if (error) throw error;

            setNewMessage('');
            // Optimistic update
            const newMsg: Message = {
                id: Date.now().toString(), // Temp ID
                ...messageData,
                created_at: new Date().toISOString(),
                sender_type: 'vendor'
            };
            setMessages(prev => [...prev, newMsg]);

            // Refresh conversations to update last message
            fetchConversations(vendorId);

        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    const selectedConv = conversations.find(c => c.customer_id === selectedCustomerId);

    return (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex h-[700px]">
            {/* Sidebar */}
            <div className="w-80 border-r border-gray-50 flex flex-col">
                <div className="p-6 border-b border-gray-50">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Customer Messages</h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {conversations.length === 0 ? (
                        <div className="p-10 text-center">
                            <MessageCircle className="h-10 w-10 text-gray-200 mx-auto mb-4" />
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No conversations yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {conversations.map((conv) => (
                                <button
                                    key={conv.customer_id}
                                    onClick={() => setSelectedCustomerId(conv.customer_id)}
                                    className={`w-full p-6 flex items-start gap-4 hover:bg-gray-50 transition-all text-left ${selectedCustomerId === conv.customer_id ? 'bg-emerald-50/50 border-r-4 border-emerald-500' : ''}`}
                                >
                                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0 uppercase font-black text-emerald-700 shadow-sm overflow-hidden">
                                        {conv.customer_avatar ? (
                                            <img src={conv.customer_avatar} alt={conv.customer_name} className="w-full h-full object-cover" />
                                        ) : (
                                            conv.customer_name?.[0]
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="text-xs font-black text-gray-900 uppercase truncate">{conv.customer_name}</h4>
                                            {conv.unread_count > 0 ? (
                                                <span className="w-5 h-5 bg-emerald-600 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                                    {conv.unread_count}
                                                </span>
                                            ) : (
                                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">
                                                    {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-500 truncate italic">
                                            {conv.last_message}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-gray-50/30">
                {selectedCustomerId ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-6 bg-white border-b border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center uppercase font-black text-emerald-700 overflow-hidden">
                                    {selectedConv?.customer_avatar ? (
                                        <img src={selectedConv.customer_avatar} alt={selectedConv.customer_name} className="w-full h-full object-cover" />
                                    ) : (
                                        selectedConv?.customer_name?.[0]
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-gray-900 uppercase">{selectedConv?.customer_name}</h4>
                                    <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                                        <Circle className="w-1.5 h-1.5 fill-current" /> Active Now
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                            {messages.map((msg, index) => (
                                <div
                                    key={msg.id || index}
                                    className={`flex ${msg.sender_type === 'vendor' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[70%] p-4 rounded-3xl text-sm ${msg.sender_type === 'vendor'
                                            ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-200 rounded-tr-none'
                                            : 'bg-white text-gray-700 border border-gray-100 shadow-sm rounded-tl-none'
                                            }`}
                                    >
                                        <p className="font-bold leading-relaxed">{msg.message}</p>
                                        <p className={`text-[8px] font-black uppercase tracking-widest mt-2 ${msg.sender_type === 'vendor' ? 'text-emerald-100' : 'text-gray-400'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-6 bg-white border-t border-gray-50">
                            <form onSubmit={handleSendMessage} className="flex items-center gap-4">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type your message..."
                                    className="flex-1 bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:font-bold"
                                />
                                <button
                                    type="submit"
                                    disabled={sending || !newMessage.trim()}
                                    className="p-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-200 disabled:opacity-50 active:scale-95 group"
                                >
                                    <Send className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                        <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-900/10 mb-8">
                            <MessageCircle className="h-12 w-12 text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Select a Conversation</h3>
                        <p className="text-xs text-gray-500 font-bold max-w-xs uppercase tracking-widest leading-loose">Choose a customer from the left to start chatting and managing inquiries.</p>
                    </div>
                )}
            </div>
        </div>
    );
}


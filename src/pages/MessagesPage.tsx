import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, Send, Search, Circle, Store, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Conversation {
    id: string;
    last_message: string;
    last_message_at: string;
    participant_ids: string[];
    vendor_name?: string;
    vendor_logo?: string;
    unread_count?: number;
}

interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    message: string;
    created_at: string;
    is_read: boolean;
}

export function MessagesPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user?.id) {
            fetchConversations();
            subscribeToChanges();
        } else {
            navigate('/login');
        }
    }, [user?.id]);

    useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation.id);
            markAsRead(selectedConversation.id);
        }
    }, [selectedConversation]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const subscribeToChanges = () => {
        const chatSubscription = supabase
            .channel('customer_chat_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, (payload: any) => {
                if (selectedConversation && payload.new && payload.new.conversation_id === selectedConversation.id) {
                    setMessages(prev => [...prev, payload.new as Message]);
                }
                fetchConversations();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(chatSubscription);
        };
    };

    const fetchConversations = async () => {
        try {
            const { data, error } = await supabase
                .from('chat_conversations')
                .select('*')
                .contains('participant_ids', [user?.id])
                .order('last_message_at', { ascending: false });

            if (error) throw error;

            // Fetch vendor details for each conversation
            const convsWithVendors = await Promise.all((data || []).map(async (conv) => {
                const vendorUserId = conv.participant_ids.find((id: string) => id !== user?.id);
                const { data: vendorData } = await supabase
                    .from('vendor_profiles')
                    .select('shop_name, shop_logo_url')
                    .eq('user_id', vendorUserId)
                    .single();

                // Get unread count
                const { count } = await supabase
                    .from('chat_messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('conversation_id', conv.id)
                    .eq('is_read', false)
                    .neq('sender_id', user?.id);

                return {
                    ...conv,
                    vendor_name: vendorData?.shop_name || 'Premium Vendor',
                    vendor_logo: vendorData?.shop_logo_url,
                    unread_count: count || 0
                };
            }));

            setConversations(convsWithVendors);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (conversationId: string) => {
        try {
            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMessages(data || []);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const markAsRead = async (conversationId: string) => {
        await supabase
            .from('chat_messages')
            .update({ is_read: true })
            .eq('conversation_id', conversationId)
            .neq('sender_id', user?.id);

        setConversations(prev => prev.map(c =>
            c.id === conversationId ? { ...c, unread_count: 0 } : c
        ));
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation || !user?.id) return;

        setSending(true);
        try {
            const messageData = {
                conversation_id: selectedConversation.id,
                sender_id: user.id,
                message: newMessage.trim()
            };

            const { error } = await supabase
                .from('chat_messages')
                .insert(messageData);

            if (error) throw error;

            await supabase
                .from('chat_conversations')
                .update({
                    last_message: newMessage.trim(),
                    last_message_at: new Date().toISOString()
                })
                .eq('id', selectedConversation.id);

            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-100">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
                            <ArrowLeft className="w-5 h-5 text-gray-500" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Support Concierge</h1>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Your direct line to premium vendors</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-emerald-900/5 overflow-hidden flex h-[700px]">
                    {/* Sidebar */}
                    <div className="w-80 border-r border-gray-50 flex flex-col bg-white">
                        <div className="p-6 border-b border-gray-50">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search chats..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-bold italic"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {conversations.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4">
                                        <MessageCircle className="h-8 w-8 text-gray-200" />
                                    </div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Start a conversation</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {conversations.map((conv) => (
                                        <button
                                            key={conv.id}
                                            onClick={() => setSelectedConversation(conv)}
                                            className={`w-full p-6 flex items-start gap-4 hover:bg-emerald-50/30 transition-all text-left ${selectedConversation?.id === conv.id ? 'bg-emerald-50 border-r-4 border-emerald-500' : ''}`}
                                        >
                                            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                                                {conv.vendor_logo ? (
                                                    <img src={conv.vendor_logo} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    <Store className="h-6 w-6 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="text-xs font-black text-gray-900 uppercase truncate tracking-tight">{conv.vendor_name}</h4>
                                                    {conv.unread_count && conv.unread_count > 0 && (
                                                        <span className="w-5 h-5 bg-emerald-600 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                                            {conv.unread_count}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] font-bold text-gray-500 truncate italic opacity-70">
                                                    {conv.last_message}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col bg-gray-50/30">
                        {selectedConversation ? (
                            <>
                                <div className="p-6 bg-white border-b border-gray-50 flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                                            {selectedConversation.vendor_logo ? (
                                                <img src={selectedConversation.vendor_logo} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <Store className="h-5 w-5 text-gray-400" />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">{selectedConversation.vendor_name}</h4>
                                            <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                                                <Circle className="w-1.5 h-1.5 fill-current" /> Store Online
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[70%] p-5 rounded-[1.5rem] text-sm ${msg.sender_id === user?.id
                                                    ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-200 rounded-tr-none'
                                                    : 'bg-white text-gray-700 border border-gray-100 shadow-sm rounded-tl-none'
                                                    }`}
                                            >
                                                <p className="font-bold leading-relaxed">{msg.message}</p>
                                                <p className={`text-[8px] font-black uppercase tracking-widest mt-2 ${msg.sender_id === user?.id ? 'text-emerald-100' : 'text-gray-400'}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                <div className="p-6 bg-white border-t border-gray-50 shadow-2xl">
                                    <form onSubmit={handleSendMessage} className="flex items-center gap-4">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Ask the vendor about this product..."
                                            className="flex-1 bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:font-bold italic"
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
                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Concierge Support</h3>
                                <p className="text-xs text-gray-500 font-bold max-w-sm uppercase tracking-widest leading-loose">Pick a conversation from the sidebar to chat directly with verified vendors. Get instant answers about products, shipping, and more.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, Send, Search, Circle, Store, ArrowLeft, ShieldCheck, CheckCheck } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

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
    const [searchParams] = useSearchParams();

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
                    setMessages(prev => {
                        if (prev.find(m => m.id === payload.new.id)) return prev;
                        return [...prev, payload.new as Message];
                    });
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

            const convsWithVendors = await Promise.all((data || []).map(async (conv) => {
                const vendorUserId = conv.participant_ids.find((id: string) => id !== user?.id);
                const { data: vendorData } = await supabase
                    .from('vendor_profiles')
                    .select('shop_name, shop_logo_url')
                    .eq('user_id', vendorUserId)
                    .single();

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

            const cid = searchParams.get('cid');
            if (cid) {
                const targetConv = convsWithVendors.find(c => c.id === cid);
                if (targetConv) setSelectedConversation(targetConv);
            }
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
        const text = newMessage.trim();
        setNewMessage('');

        try {
            const { error } = await supabase
                .from('chat_messages')
                .insert({
                    conversation_id: selectedConversation.id,
                    sender_id: user.id,
                    message: text
                });

            if (error) throw error;

            await supabase
                .from('chat_conversations')
                .update({
                    last_message: text,
                    last_message_at: new Date().toISOString()
                })
                .eq('id', selectedConversation.id);

        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col transition-colors duration-500">
            {/* Direct Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex-none sticky top-16 md:top-0 z-40">
                <div className="container mx-auto px-4 py-6 md:py-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <button onClick={() => navigate(-1)} className="p-3 bg-gray-50 dark:bg-slate-800 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all active:scale-95 group">
                                <ArrowLeft className="w-6 h-6 text-gray-400 group-hover:text-emerald-500" />
                            </button>
                            <div>
                                <h1 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-1">Support Messages</h1>
                                <p className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.3em] flex items-center gap-2">
                                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Vendor Communications
                                </p>
                            </div>
                        </div>
                        <div className="hidden lg:flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Active Conversations</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{conversations.length} total channels</p>
                            </div>
                            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center">
                                <MessageCircle className="w-6 h-6 text-emerald-600" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 container mx-auto px-0 md:px-4 py-0 md:py-8 flex flex-col overflow-hidden">
                <div className="bg-white dark:bg-slate-900 md:rounded-[3rem] border-gray-100 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col md:flex-row flex-1 h-[calc(100vh-140px)] md:h-[750px] border">

                    {/* Channel List Sidebar */}
                    <div className={`w-full md:w-[400px] border-r border-gray-50 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900 ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                        <div className="p-8 border-b border-gray-50 dark:border-slate-800">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-600" />
                                <input
                                    type="text"
                                    placeholder="SEARCH VENDORS..."
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-800/50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {conversations.length === 0 ? (
                                <div className="p-16 text-center">
                                    <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                        <MessageCircle className="h-10 w-10 text-gray-200 dark:text-slate-700" />
                                    </div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-loose">No active message channels</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50 dark:divide-slate-800/50">
                                    {conversations.map((conv) => (
                                        <button
                                            key={conv.id}
                                            onClick={() => setSelectedConversation(conv)}
                                            className={`w-full p-8 flex items-center gap-6 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-all text-left group ${selectedConversation?.id === conv.id ? 'bg-emerald-50/50 dark:bg-emerald-900/20 border-r-4 border-emerald-500' : ''}`}
                                        >
                                            <div className="relative shrink-0">
                                                <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-[1.5rem] flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-105 transition-transform duration-500">
                                                    {conv.vendor_logo ? (
                                                        <img src={conv.vendor_logo} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        <Store className="h-8 w-8 text-gray-400 dark:text-slate-600" />
                                                    )}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-white dark:border-slate-900 rounded-full" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase truncate tracking-tight">{conv.vendor_name}</h4>
                                                    {conv.unread_count !== undefined && conv.unread_count > 0 && (
                                                        <span className="bg-emerald-600 text-white text-[9px] px-2 py-0.5 font-black rounded-lg shadow-lg animate-bounce">
                                                            {conv.unread_count}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 truncate uppercase tracking-widest opacity-60">
                                                    {conv.last_message || 'Start chatting...'}
                                                </p>
                                                <p className="text-[8px] font-black text-gray-300 dark:text-slate-600 uppercase tracking-tighter mt-1">
                                                    {new Date(conv.last_message_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chat Interface */}
                    <div className={`flex-1 flex flex-col bg-gray-50/50 dark:bg-slate-900/50 w-full ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
                        {selectedConversation ? (
                            <>
                                <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between shadow-sm z-10">
                                    <div className="flex items-center gap-6 overflow-hidden">
                                        <button
                                            onClick={() => setSelectedConversation(null)}
                                            className="md:hidden p-3 bg-gray-50 dark:bg-slate-800 rounded-2xl text-gray-500"
                                        >
                                            <ArrowLeft className="w-5 h-5" />
                                        </button>

                                        <div className="w-14 h-14 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                                            {selectedConversation.vendor_logo ? (
                                                <img src={selectedConversation.vendor_logo} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <Store className="h-7 w-7 text-gray-400 dark:text-slate-600" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter truncate">{selectedConversation.vendor_name}</h4>
                                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-2 mt-1">
                                                <Circle className="w-2 h-2 fill-current animate-pulse" /> Established Connection
                                            </p>
                                        </div>
                                    </div>
                                    <div className="hidden lg:flex items-center gap-4">
                                        <button className="text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-emerald-600 transition-colors">Order History</button>
                                        <div className="w-px h-4 bg-gray-100 dark:bg-slate-800" />
                                        <button className="text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-emerald-600 transition-colors">Vendor Profile</button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-8 custom-scrollbar">
                                    {messages.map((msg) => {
                                        const isMe = msg.sender_id === user?.id;
                                        return (
                                            <div
                                                key={msg.id}
                                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-[90%] md:max-w-[75%] space-y-2 flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                    <div
                                                        className={`p-6 md:p-8 rounded-[2rem] text-sm md:text-base leading-relaxed ${isMe
                                                            ? 'bg-emerald-600 text-white shadow-2xl shadow-emerald-200 dark:shadow-emerald-900/10 rounded-tr-none font-bold'
                                                            : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-slate-700 shadow-xl rounded-tl-none font-medium'
                                                            }`}
                                                    >
                                                        {msg.message}
                                                    </div>
                                                    <div className={`flex items-center gap-2 px-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                                                        <span className={`text-[9px] font-black uppercase tracking-widest ${isMe ? 'text-emerald-400' : 'text-gray-400 dark:text-slate-500'}`}>
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        {isMe && <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                <div className="p-6 md:p-10 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 z-10">
                                    <form onSubmit={handleSendMessage} className="flex items-center gap-4 max-w-5xl mx-auto">
                                        <div className="flex-1 relative group">
                                            <input
                                                type="text"
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                placeholder="WRITE A DIRECT MESSAGE..."
                                                className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-[1.5rem] px-8 py-5 text-sm font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-slate-600"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={sending || !newMessage.trim()}
                                            className="p-5 md:p-6 bg-emerald-600 text-white rounded-[1.5rem] hover:bg-emerald-700 transition shadow-2xl shadow-emerald-200 dark:shadow-emerald-900/20 disabled:opacity-50 active:scale-95 group shrink-0"
                                        >
                                            <Send className="h-6 w-6 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                                        </button>
                                    </form>
                                    <p className="text-[8px] text-center mt-6 text-gray-300 dark:text-slate-700 font-black uppercase tracking-[0.3em]">
                                        Always keep transactions within ZimAIO for protection
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center animate-in fade-in duration-1000">
                                <div className="w-32 h-32 bg-white dark:bg-slate-800 rounded-[3rem] flex items-center justify-center shadow-2xl shadow-emerald-900/10 mb-10 group hover:scale-110 transition-transform duration-700">
                                    <MessageCircle className="h-16 w-16 text-emerald-600 group-hover:rotate-12 transition-transform" />
                                </div>
                                <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-4">Message Support</h3>
                                <p className="text-[10px] text-gray-400 font-bold max-w-xs uppercase tracking-[0.2em] leading-relaxed">Select a verified vendor channel from the sidebar to establish a direct secure line.</p>
                                <div className="mt-12 flex gap-12 opacity-30">
                                    <div className="flex flex-col items-center gap-2">
                                        <ShieldCheck className="w-6 h-6" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">Encrypted</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <CheckCheck className="w-6 h-6" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">Verified</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}


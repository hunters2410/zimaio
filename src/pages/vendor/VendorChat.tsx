import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { MessageCircle, Send, Search, Circle } from 'lucide-react';

interface Conversation {
    id: string;
    last_message: string;
    last_message_at: string;
    participant_ids: string[];
    customer_name?: string;
    customer_avatar?: string;
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

export function VendorChat() {
    const { profile } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (profile?.id) {
            fetchConversations();
            subscribeToChanges();
        }
    }, [profile?.id]);

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
            .channel('chat_changes')
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
                .select(`
          *,
          chat_messages(count)
        `)
                .contains('participant_ids', [profile?.id])
                .order('last_message_at', { ascending: false });

            if (error) throw error;

            // Fetch customer names for each conversation
            const convsWithNames = await Promise.all((data || []).map(async (conv) => {
                const customerId = conv.participant_ids.find((id: string) => id !== profile?.id);
                const { data: customerData } = await supabase
                    .from('profiles')
                    .select('full_name, avatar_url')
                    .eq('id', customerId)
                    .single();

                // Get unread count
                const { count } = await supabase
                    .from('chat_messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('conversation_id', conv.id)
                    .eq('is_read', false)
                    .neq('sender_id', profile?.id);

                return {
                    ...conv,
                    customer_name: customerData?.full_name || 'Anonymous Customer',
                    customer_avatar: customerData?.avatar_url,
                    unread_count: count || 0
                };
            }));

            setConversations(convsWithNames);
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
            .neq('sender_id', profile?.id);

        // Update local state
        setConversations(prev => prev.map(c =>
            c.id === conversationId ? { ...c, unread_count: 0 } : c
        ));
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation || !profile?.id) return;

        setSending(true);
        try {
            const messageData = {
                conversation_id: selectedConversation.id,
                sender_id: profile.id,
                message: newMessage.trim()
            };

            const { error } = await supabase
                .from('chat_messages')
                .insert(messageData)
                .select()
                .single();

            if (error) throw error;

            // Update conversation last message
            await supabase
                .from('chat_conversations')
                .update({
                    last_message: newMessage.trim(),
                    last_message_at: new Date().toISOString()
                })
                .eq('id', selectedConversation.id);

            setNewMessage('');
            // Message will be added via subscription
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
                                    key={conv.id}
                                    onClick={() => setSelectedConversation(conv)}
                                    className={`w-full p-6 flex items-start gap-4 hover:bg-gray-50 transition-all text-left ${selectedConversation?.id === conv.id ? 'bg-emerald-50/50 border-r-4 border-emerald-500' : ''}`}
                                >
                                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0 uppercase font-black text-emerald-700 shadow-sm">
                                        {conv.customer_name?.[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="text-xs font-black text-gray-900 uppercase truncate">{conv.customer_name}</h4>
                                            {conv.unread_count && conv.unread_count > 0 ? (
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
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-6 bg-white border-b border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center uppercase font-black text-emerald-700">
                                    {selectedConversation.customer_name?.[0]}
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-gray-900 uppercase">{selectedConversation.customer_name}</h4>
                                    <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                                        <Circle className="w-1.5 h-1.5 fill-current" /> Active Now
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.sender_id === profile?.id ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[70%] p-4 rounded-3xl text-sm ${msg.sender_id === profile?.id
                                            ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-200 rounded-tr-none'
                                            : 'bg-white text-gray-700 border border-gray-100 shadow-sm rounded-tl-none'
                                            }`}
                                    >
                                        <p className="font-bold leading-relaxed">{msg.message}</p>
                                        <p className={`text-[8px] font-black uppercase tracking-widest mt-2 ${msg.sender_id === profile?.id ? 'text-emerald-100' : 'text-gray-400'}`}>
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

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Send, X, MessageSquare, User, Store } from 'lucide-react';

interface Message {
    id: string;
    sender_id: string;
    message: string;
    created_at: string;
}

interface ChatWindowProps {
    vendorId: string;
    vendorName: string;
    customerId: string;
    onClose: () => void;
}

export function ChatWindow({ vendorId, vendorName, customerId, onClose }: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setupConversation();
    }, [vendorId, customerId]);

    useEffect(() => {
        if (conversationId) {
            const subscription = supabase
                .channel(`chat:${conversationId}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `conversation_id=eq.${conversationId}`
                }, (payload) => {
                    setMessages(prev => [...prev, payload.new as Message]);
                })
                .subscribe();

            return () => {
                subscription.unsubscribe();
            };
        }
    }, [conversationId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const setupConversation = async () => {
        try {
            // Get vendor's user_id
            const { data: vendorProfile } = await supabase
                .from('vendor_profiles')
                .select('user_id')
                .eq('id', vendorId)
                .single();

            if (!vendorProfile) return;

            const vendorUserId = vendorProfile.user_id;

            // Find existing conversation
            const { data: convs } = await supabase
                .from('chat_conversations')
                .select('id, participant_ids')
                .filter('participant_ids', 'cs', `{${customerId},${vendorUserId}}`);

            let conv = convs?.find(c => c.participant_ids.length === 2);

            if (!conv) {
                // Create new conversation
                const { data: newConv, error } = await supabase
                    .from('chat_conversations')
                    .insert([{
                        participant_ids: [customerId, vendorUserId]
                    }])
                    .select()
                    .single();

                if (error) throw error;
                conv = newConv;
            }

            setConversationId(conv.id);

            // Fetch messages
            const { data: msgs } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('conversation_id', conv.id)
                .order('created_at', { ascending: true });

            setMessages(msgs || []);
        } catch (error) {
            console.error('Error setting up chat:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !conversationId) return;

        const messageText = newMessage.trim();
        setNewMessage('');

        try {
            const { error } = await supabase
                .from('chat_messages')
                .insert([{
                    conversation_id: conversationId,
                    sender_id: customerId,
                    message: messageText
                }]);

            if (error) throw error;

            // Update conversation last_message
            await supabase
                .from('chat_conversations')
                .update({
                    last_message: messageText,
                    last_message_at: new Date().toISOString()
                })
                .eq('id', conversationId);

        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] w-80 h-[450px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="bg-[#FF7F01] p-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <Store className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-tight">{vendorName}</h4>
                        <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-[10px] font-bold opacity-80">Vendor is Online</span>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="w-6 h-6 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-2 p-6">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <MessageSquare className="w-6 h-6 text-gray-300" />
                        </div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">No messages yet. Say hi!</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <div key={msg.id || idx} className={`flex ${msg.sender_id === customerId ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-2xl text-[12px] font-medium ${msg.sender_id === customerId
                                    ? 'bg-[#FF7F01] text-white rounded-tr-none shadow-md shadow-orange-500/10'
                                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-100 shadow-sm'
                                }`}>
                                {msg.message}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-50 flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="w-10 h-10 bg-[#FF7F01] text-white rounded-xl flex items-center justify-center hover:bg-[#e67300] transition-all active:scale-95 disabled:opacity-50"
                >
                    <Send className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
}

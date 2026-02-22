import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Send, X, MessageSquare, User, Store, ShieldCheck, CheckCheck, Smile } from 'lucide-react';

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
    embedded?: boolean;
}

export function ChatWindow({ vendorId, vendorName, customerId, onClose, embedded = false }: ChatWindowProps) {
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
            const channel = supabase
                .channel(`chat:${conversationId}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `conversation_id=eq.${conversationId}`
                }, (payload) => {
                    const newMsg = payload.new as Message;
                    setMessages(prev => {
                        if (prev.find(m => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
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
                .contains('participant_ids', [customerId, vendorUserId]);

            // Need to filter manually because contains checks if the array contains specific elements but we want strict match for this pair mostly
            // actually contains [A, B] ensures both are present.
            // But we might want to ensure only these two are present? For now assuming 2 participants.

            let conv = convs?.find(c => c.participant_ids.length === 2 && c.participant_ids.includes(customerId) && c.participant_ids.includes(vendorUserId));

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
        <div className={embedded
            ? "flex flex-col h-full bg-gray-50 dark:bg-slate-900"
            : "fixed bottom-0 right-0 md:bottom-24 md:right-6 z-[100] w-full md:w-[380px] h-full md:h-[550px] bg-white dark:bg-slate-900 md:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-500 md:border md:border-slate-100 dark:md:border-slate-800"
        }>
            {/* Premium Header - Only show if not embedded (embedded typically has its own header or wrapper) */}
            {!embedded && (
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 flex items-center justify-between text-white shrink-0 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                                <Store className="w-6 h-6 text-white" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white dark:border-slate-900 rounded-full" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="text-sm font-black uppercase tracking-tight truncate max-w-[150px]">{vendorName}</h4>
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100/80">Support Message</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 relative z-10">
                        <button onClick={onClose} className="p-2.5 hover:bg-white/20 rounded-xl transition-all active:scale-90 bg-white/10">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Safety Banner */}
            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-2 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-center gap-2">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Secure encrypted connection</span>
            </div>

            {/* Messages Content */}
            <div className={`flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar dark:bg-slate-900/50 ${embedded ? 'bg-white dark:bg-slate-950' : ''}`}>
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                        <div className="w-10 h-10 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Synchronizing...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-6 max-w-[240px] mx-auto">
                        <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-[2.5rem] flex items-center justify-center animate-bounce duration-[3000ms]">
                            <MessageSquare className="w-10 h-10 text-emerald-500" />
                        </div>
                        <div className="space-y-2">
                            <h5 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Direct Access</h5>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-relaxed">Ask anything about the product or delivery process.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {messages.map((msg, idx) => {
                            const isMe = msg.sender_id === customerId;
                            return (
                                <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[85%] p-4 rounded-3xl text-[13px] font-medium leading-relaxed shadow-sm transition-all hover:shadow-md ${isMe
                                        ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-tr-none'
                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700'
                                        }`}>
                                        {msg.message}
                                    </div>
                                    <div className={`flex items-center gap-1.5 mt-2 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {isMe && <CheckCheck className="w-3 h-3 text-emerald-500" />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Wrapper */}
            <div className="p-6 bg-white dark:bg-slate-900 shrink-0">
                <form onSubmit={handleSendMessage} className="relative group">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Write your message..."
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-5 pr-14 py-4 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center hover:bg-emerald-700 transition-all active:scale-90 disabled:opacity-30 disabled:grayscale shadow-lg shadow-emerald-500/20"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </form>
                <div className="mt-4 flex items-center justify-center gap-4 text-slate-300 dark:text-slate-700">
                    <button className="hover:text-emerald-500 transition-colors"><Smile className="w-4 h-4" /></button>
                    <div className="w-px h-3 bg-slate-100 dark:bg-slate-800" />
                    <button className="text-[9px] font-black uppercase tracking-widest hover:text-emerald-500 transition-colors">Attach File</button>
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
    MessageCircle, Send, Search, CheckCheck, Clock,
    MoreVertical, Phone, Video, Smile, Paperclip, X, ArrowLeft
} from 'lucide-react';

interface Conversation {
    id: string;
    customer_id: string;
    customer_name: string;
    customer_avatar?: string;
    last_message: string;
    last_message_at: string;
    unread_count: number;
}

interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    message: string;
    created_at: string;
    is_read: boolean;
}

function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function groupMessagesByDate(messages: Message[]) {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';
    for (const msg of messages) {
        const date = formatDate(msg.created_at);
        if (date !== currentDate) {
            currentDate = date;
            groups.push({ date, messages: [msg] });
        } else {
            groups[groups.length - 1].messages.push(msg);
        }
    }
    return groups;
}

export function VendorChat() {
    const { profile } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [vendorId, setVendorId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showMobileChat, setShowMobileChat] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (profile?.id) initializeVendor();
    }, [profile?.id]);

    useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation.id);
            markAsRead(selectedConversation.id);
        }
    }, [selectedConversation?.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const q = searchQuery.toLowerCase();
        setFilteredConversations(
            conversations.filter(c =>
                c.customer_name.toLowerCase().includes(q) ||
                c.last_message.toLowerCase().includes(q)
            )
        );
    }, [searchQuery, conversations]);

    const initializeVendor = async () => {
        try {
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
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' },
                async (payload) => {
                    const newMsg = payload.new as Message;
                    const { data: conv } = await supabase
                        .from('chat_conversations')
                        .select('vendor_id')
                        .eq('id', newMsg.conversation_id)
                        .single();

                    if (conv?.vendor_id === vId) {
                        if (selectedConversation?.id === newMsg.conversation_id) {
                            setMessages(prev => [...prev, newMsg]);
                            markAsRead(newMsg.conversation_id);
                        }
                        fetchConversations(vId);
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(subscription); };
    };

    const fetchConversations = async (vId: string) => {
        try {
            const { data: convs, error } = await supabase
                .from('chat_conversations')
                .select(`
                    id,
                    customer_id,
                    last_message,
                    last_message_at,
                    profiles:customer_id (
                        full_name,
                        avatar_url
                    )
                `)
                .eq('vendor_id', vId)
                .order('last_message_at', { ascending: false });

            if (error) throw error;

            const { data: unreadData } = await supabase
                .from('chat_messages')
                .select('conversation_id')
                .eq('is_read', false)
                .neq('sender_id', profile?.id);

            const unreadCounts = new Map<string, number>();
            unreadData?.forEach(m => {
                unreadCounts.set(m.conversation_id, (unreadCounts.get(m.conversation_id) || 0) + 1);
            });

            const formatted: Conversation[] = (convs || []).map((c: any) => ({
                id: c.id,
                customer_id: c.customer_id,
                customer_name: c.profiles?.full_name || 'Anonymous',
                customer_avatar: c.profiles?.avatar_url,
                last_message: c.last_message || '',
                last_message_at: c.last_message_at,
                unread_count: unreadCounts.get(c.id) || 0
            }));

            setConversations(formatted);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (convId: string) => {
        try {
            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('conversation_id', convId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMessages(data || []);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const markAsRead = async (convId: string) => {
        if (!profile?.id) return;
        await supabase
            .from('chat_messages')
            .update({ is_read: true })
            .eq('conversation_id', convId)
            .neq('sender_id', profile.id);

        setConversations(prev => prev.map(c =>
            c.id === convId ? { ...c, unread_count: 0 } : c
        ));
    };

    const handleSelectConversation = (conv: Conversation) => {
        setSelectedConversation(conv);
        setShowMobileChat(true);
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation || !profile?.id) return;

        const text = newMessage.trim();
        setNewMessage('');
        setSending(true);

        try {
            const { data: newMsg, error } = await supabase
                .from('chat_messages')
                .insert({
                    conversation_id: selectedConversation.id,
                    sender_id: profile.id,
                    message: text,
                    is_read: false
                })
                .select()
                .single();

            if (error) throw error;

            await supabase
                .from('chat_conversations')
                .update({ last_message: text, last_message_at: new Date().toISOString() })
                .eq('id', selectedConversation.id);

            if (newMsg) setMessages(prev => [...prev, newMsg]);
            if (vendorId) fetchConversations(vendorId);
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e as any);
        }
    };

    const messageGroups = groupMessagesByDate(messages);
    const totalUnread = conversations.reduce((s, c) => s + c.unread_count, 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[700px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
                            <MessageCircle className="w-7 h-7 text-emerald-500" />
                        </div>
                        <div className="absolute inset-0 rounded-2xl border-2 border-emerald-400 animate-ping opacity-30" />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Messages</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-900/5 overflow-hidden flex h-[calc(100vh-12rem)] min-h-[600px] max-h-[800px]">

            {/* ─── LEFT SIDEBAR ─── */}
            <div className={`
                w-full md:w-[340px] border-r border-slate-100 dark:border-slate-800 flex flex-col flex-shrink-0
                ${showMobileChat ? 'hidden md:flex' : 'flex'}
            `}>
                {/* Sidebar Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">Messages</h2>
                            {totalUnread > 0 && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {totalUnread} unread {totalUnread === 1 ? 'message' : 'messages'}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <MessageCircle className="w-4.5 h-4.5" />
                            </div>
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
                        />
                    </div>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
                                <MessageCircle className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                            </div>
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                                {searchQuery ? 'No results found' : 'No conversations yet'}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                {searchQuery ? 'Try a different search term' : 'Customer messages will appear here'}
                            </p>
                        </div>
                    ) : (
                        filteredConversations.map(conv => {
                            const isSelected = selectedConversation?.id === conv.id;
                            const initials = conv.customer_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => handleSelectConversation(conv)}
                                    className={`
                                        w-full px-4 py-4 flex items-center gap-3 transition-all text-left relative group
                                        ${isSelected
                                            ? 'bg-emerald-50 dark:bg-emerald-900/20'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                                        }
                                    `}
                                >
                                    {/* Active indicator */}
                                    {isSelected && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-emerald-500 rounded-r-full" />
                                    )}

                                    {/* Avatar */}
                                    <div className="relative shrink-0">
                                        <div className={`
                                            w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold overflow-hidden
                                            ${isSelected
                                                ? 'bg-emerald-100 dark:bg-emerald-800/60 text-emerald-700 dark:text-emerald-300'
                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                            }
                                        `}>
                                            {conv.customer_avatar ? (
                                                <img src={conv.customer_avatar} alt={conv.customer_name} className="w-full h-full object-cover" />
                                            ) : initials}
                                        </div>
                                        {/* Online dot (placeholder) */}
                                        <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-900" />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className={`text-sm font-semibold truncate ${isSelected ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-200'}`}>
                                                {conv.customer_name}
                                            </p>
                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 font-medium">
                                                {conv.last_message_at ? formatTime(conv.last_message_at) : ''}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2 mt-0.5">
                                            <p className={`text-xs truncate ${conv.unread_count > 0 ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
                                                {conv.last_message || 'No messages yet'}
                                            </p>
                                            {conv.unread_count > 0 && (
                                                <span className="shrink-0 min-w-[20px] h-5 px-1.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                                    {conv.unread_count}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ─── RIGHT CHAT PANEL ─── */}
            <div className={`
                flex-1 flex flex-col min-w-0
                ${showMobileChat ? 'flex' : 'hidden md:flex'}
            `}>
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-[73px] px-5 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                            <button
                                onClick={() => setShowMobileChat(false)}
                                className="md:hidden p-2 -ml-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>

                            {/* Avatar */}
                            <div className="relative shrink-0">
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-sm font-bold overflow-hidden">
                                    {selectedConversation.customer_avatar ? (
                                        <img src={selectedConversation.customer_avatar} alt={selectedConversation.customer_name} className="w-full h-full object-cover" />
                                    ) : selectedConversation.customer_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-900" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{selectedConversation.customer_name}</p>
                                <p className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-pulse" />
                                    Active now
                                </p>
                            </div>

                            <div className="flex items-center gap-1">
                                <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all" title="Call">
                                    <Phone className="w-4.5 h-4.5" />
                                </button>
                                <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all" title="Video">
                                    <Video className="w-4.5 h-4.5" />
                                </button>
                                <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all" title="More">
                                    <MoreVertical className="w-4.5 h-4.5" />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-1 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
                            {messageGroups.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center mb-4">
                                        <MessageCircle className="w-8 h-8 text-emerald-500" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Start the conversation</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Send your first message to {selectedConversation.customer_name}</p>
                                </div>
                            ) : (
                                messageGroups.map(group => (
                                    <div key={group.date}>
                                        {/* Date Divider */}
                                        <div className="flex items-center gap-3 py-4">
                                            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                                            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3">
                                                {group.date}
                                            </span>
                                            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                                        </div>

                                        <div className="space-y-2">
                                            {group.messages.map((msg, i) => {
                                                const isOwn = msg.sender_id === profile?.id;
                                                const isFirst = i === 0 || group.messages[i - 1].sender_id !== msg.sender_id;
                                                const isLast = i === group.messages.length - 1 || group.messages[i + 1].sender_id !== msg.sender_id;
                                                return (
                                                    <div
                                                        key={msg.id || i}
                                                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} items-end gap-2`}
                                                    >
                                                        {/* Customer avatar (only shown for last message in a group) */}
                                                        {!isOwn && (
                                                            <div className="w-7 h-7 shrink-0">
                                                                {isLast && (
                                                                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[10px] font-bold overflow-hidden">
                                                                        {selectedConversation.customer_avatar ? (
                                                                            <img src={selectedConversation.customer_avatar} alt="" className="w-full h-full object-cover" />
                                                                        ) : selectedConversation.customer_name[0]}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        <div className={`max-w-[72%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                                                            <div
                                                                className={`
                                                                    px-4 py-2.5 text-sm leading-relaxed shadow-sm
                                                                    ${isOwn
                                                                        ? 'bg-emerald-600 text-white shadow-emerald-200 dark:shadow-emerald-900/40'
                                                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700'
                                                                    }
                                                                    ${isFirst && isLast
                                                                        ? 'rounded-2xl'
                                                                        : isFirst
                                                                            ? isOwn ? 'rounded-2xl rounded-br-md' : 'rounded-2xl rounded-bl-md'
                                                                            : isLast
                                                                                ? isOwn ? 'rounded-2xl rounded-tr-md' : 'rounded-2xl rounded-tl-md'
                                                                                : isOwn ? 'rounded-l-2xl rounded-r-md' : 'rounded-r-2xl rounded-l-md'
                                                                    }
                                                                `}
                                                            >
                                                                {msg.message}
                                                            </div>

                                                            {isLast && (
                                                                <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                                                                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                                                        {formatTime(msg.created_at)}
                                                                    </span>
                                                                    {isOwn && (
                                                                        msg.is_read
                                                                            ? <CheckCheck className="w-3 h-3 text-emerald-500" />
                                                                            : <Clock className="w-3 h-3 text-slate-400" />
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                            <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                                <button
                                    type="button"
                                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all shrink-0"
                                >
                                    <Paperclip className="w-5 h-5" />
                                </button>
                                <div className="flex-1 relative">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={`Message ${selectedConversation.customer_name}...`}
                                        className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 transition-all"
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                    >
                                        <Smile className="w-4 h-4" />
                                    </button>
                                </div>
                                <button
                                    type="submit"
                                    disabled={sending || !newMessage.trim()}
                                    className="
                                        w-11 h-11 flex items-center justify-center shrink-0
                                        bg-emerald-600 hover:bg-emerald-700 active:scale-95
                                        text-white rounded-2xl
                                        shadow-lg shadow-emerald-500/30
                                        disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100
                                        transition-all duration-200
                                    "
                                >
                                    <Send className="w-4.5 h-4.5 -mr-0.5" />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    /* Empty State */
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="relative mb-8">
                            <div className="w-24 h-24 rounded-[2rem] bg-white dark:bg-slate-800 shadow-2xl shadow-slate-900/10 flex items-center justify-center">
                                <MessageCircle className="w-12 h-12 text-emerald-500" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg">
                                <Send className="w-4 h-4 text-white" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Your Inbox</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                            Select a conversation from the left to view and respond to customer messages.
                        </p>
                        <div className="mt-8 grid grid-cols-3 gap-4 w-full max-w-xs">
                            {[
                                { label: 'Total', value: conversations.length },
                                { label: 'Unread', value: totalUnread },
                                { label: 'Active', value: conversations.filter(c => c.unread_count > 0).length }
                            ].map(stat => (
                                <div key={stat.label} className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-center">
                                    <p className="text-xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium mt-0.5">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

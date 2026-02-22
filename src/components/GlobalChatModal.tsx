import { useState } from 'react';
import { X, Search, MessageSquare, Ticket, Send, ChevronRight, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ChatWindow } from './ChatWindow';
import { ArrowLeft } from 'lucide-react';

interface GlobalChatModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Vendor {
    id: string;
    shop_name: string;
    user_id: string;
}

export function GlobalChatModal({ isOpen, onClose }: GlobalChatModalProps) {
    const [activeTab, setActiveTab] = useState<'vendors' | 'support'>('vendors');
    const [searchQuery, setSearchQuery] = useState('');
    const [ticketSubject, setTicketSubject] = useState('');
    const [ticketMessage, setTicketMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const { user } = useAuth();
    // const navigate = useNavigate(); // Removed as we are inline now if desired, but keeping if needed elsewhere

    if (!isOpen) return null;

    const handleSearchVendors = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setVendors([]);
            return;
        }

        setSearching(true);
        try {
            const { data } = await supabase
                .from('vendor_profiles')
                .select('id, shop_name, user_id')
                .ilike('shop_name', `%${query}%`)
                .eq('is_approved', true)
                .limit(5);

            if (data) setVendors(data);
        } catch (error) {
            console.error('Error searching vendors:', error);
        } finally {
            setSearching(false);
        }
    };

    const startChat = (vendor: Vendor) => {
        setSelectedVendor(vendor);
    };

    const submitTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            await supabase.from('support_tickets').insert({
                user_id: user.id,
                subject: ticketSubject,
                message: ticketMessage,
                status: 'open',
                priority: 'medium'
            });

            alert('Ticket created successfully!');
            onClose();
        } catch (error) {
            console.error('Error creating ticket:', error);
            alert('Failed to create ticket.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 dark:border-slate-800 flex flex-col h-[600px]">

                {selectedVendor ? (
                    <div className="flex flex-col h-full relative">
                        {/* Chat Header inside Modal */}
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 text-white flex items-center gap-4 shadow-md z-10">
                            <button
                                onClick={() => setSelectedVendor(null)}
                                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg">{selectedVendor.shop_name}</h3>
                                <p className="text-xs text-green-100 opacity-90">Direct Message</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Chat Window */}
                        <div className="flex-1 overflow-hidden relative">
                            {user && (
                                <ChatWindow
                                    vendorId={selectedVendor.id}
                                    vendorName={selectedVendor.shop_name}
                                    customerId={user.id}
                                    onClose={() => setSelectedVendor(null)}
                                    embedded={true}
                                />
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white relative overflow-hidden shrink-0">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <MessageSquare className="w-24 h-24 transform rotate-12" />
                            </div>

                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <h2 className="text-2xl font-black tracking-tight mb-1">Messages Center</h2>
                            <p className="text-green-100 text-sm font-medium opacity-90">Connect with vendors or get support</p>

                            <div className="flex gap-2 mt-6">
                                <button
                                    onClick={() => setActiveTab('vendors')}
                                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'vendors'
                                        ? 'bg-white text-green-600 shadow-lg'
                                        : 'bg-green-700/50 text-green-100 hover:bg-green-700/70'
                                        }`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <User className="w-4 h-4" />
                                        <span>Message Vendor</span>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setActiveTab('support')}
                                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'support'
                                        ? 'bg-white text-green-600 shadow-lg'
                                        : 'bg-green-700/50 text-green-100 hover:bg-green-700/70'
                                        }`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <Ticket className="w-4 h-4" />
                                        <span>Open Ticket</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-slate-950/50 flex-1">
                            {!user ? (
                                <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
                                    <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center shadow-inner">
                                        <User className="w-10 h-10 text-gray-400 dark:text-slate-500" />
                                    </div>
                                    <div className="max-w-xs mx-auto">
                                        <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Login Required</h3>
                                        <p className="text-xs font-medium text-gray-500 mt-2 leading-relaxed">Please log in to your account to message vendors directly or submit support tickets.</p>
                                    </div>
                                    <button
                                        onClick={() => { onClose(); window.location.href = '/login'; }}
                                        className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-green-200 dark:shadow-green-900/20 hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95"
                                    >
                                        Log In Now
                                    </button>
                                </div>
                            ) : activeTab === 'vendors' ? (
                                <div className="space-y-6">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search by store name..."
                                            value={searchQuery}
                                            onChange={(e) => handleSearchVendors(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border-none rounded-2xl shadow-sm text-sm font-medium focus:ring-2 focus:ring-green-500 transition-all placeholder:text-gray-400 dark:text-white"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        {searching ? (
                                            <div className="text-center py-8 text-gray-400">
                                                <div className="animate-spin w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-2" />
                                                <span className="text-xs font-bold uppercase tracking-widest">Finding Vendors...</span>
                                            </div>
                                        ) : vendors.length > 0 ? (
                                            vendors.map((vendor) => (
                                                <button
                                                    key={vendor.id}
                                                    onClick={() => startChat(vendor)}
                                                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 hover:border-green-500 dark:hover:border-green-500 hover:shadow-md transition-all group text-left"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-green-200 dark:shadow-none">
                                                            {vendor.shop_name[0]}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-green-600 transition-colors">{vendor.shop_name}</h4>
                                                            <p className="text-xs text-gray-500 font-medium">Click to start conversation</p>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-green-500 transform group-hover:translate-x-1 transition-all" />
                                                </button>
                                            ))
                                        ) : searchQuery.length > 1 ? (
                                            <div className="text-center py-10 text-gray-400">
                                                <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                                <p className="text-sm font-medium">No vendors found matching "{searchQuery}"</p>
                                            </div>
                                        ) : (
                                            <div className="text-center py-10 text-gray-400">
                                                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                                <p className="text-sm font-medium">Start typing to find a vendor</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={submitTicket} className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Topic</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full p-4 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none transition-all font-medium text-sm dark:text-white"
                                            placeholder="Brief subject of your issue..."
                                            value={ticketSubject}
                                            onChange={(e) => setTicketSubject(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Message</label>
                                        <textarea
                                            required
                                            rows={6}
                                            className="w-full p-4 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none transition-all font-medium text-sm resize-none dark:text-white"
                                            placeholder="Describe your issue in detail..."
                                            value={ticketMessage}
                                            onChange={(e) => setTicketMessage(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-green-200 dark:shadow-green-900/20 hover:shadow-xl hover:translate-y-[-2px] active:translate-y-[1px] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {loading ? 'Submitting...' : (
                                            <>
                                                <span>Submit Ticket</span>
                                                <Send className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

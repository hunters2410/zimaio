import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, Mail, Save, AlertCircle, CheckCircle, Store } from 'lucide-react';

export function VendorSettings() {
    const { user } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Shop Settings State
    const [shopName, setShopName] = useState('');
    const [shopDescription, setShopDescription] = useState('');

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchShopDetails();
    }, [user]);

    const fetchShopDetails = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('vendor_profiles')
            .select('shop_name, shop_description')
            .eq('user_id', user.id)
            .single();

        if (data) {
            setShopName(data.shop_name || '');
            setShopDescription(data.shop_description || '');
        }
    };

    const handleUpdateShop = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase
                .from('vendor_profiles')
                .update({
                    shop_name: shopName,
                    shop_description: shopDescription
                })
                .eq('user_id', user?.id);

            if (error) throw error;
            setMessage({ type: 'success', text: 'Shop details updated successfully.' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({ email });
            if (error) throw error;
            setMessage({ type: 'success', text: 'Confirmation link sent to your new email.' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            setMessage({ type: 'success', text: 'Password updated successfully.' });
            setPassword('');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h2 className="text-xl font-bold text-gray-900">Settings</h2>
                <p className="text-xs text-gray-500 mt-0.5">Manage your shop profile and account security.</p>
            </div>

            {message && (
                <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {message.text}
                </div>
            )}

            {/* Shop Settings */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                    <div className="bg-emerald-50 p-2 rounded-lg">
                        <Store className="w-4 h-4 text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">Shop Details</h3>
                </div>

                <form onSubmit={handleUpdateShop} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Shop Name</label>
                            <input
                                type="text"
                                required
                                value={shopName}
                                onChange={(e) => setShopName(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                placeholder="My Awesome Shop"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description</label>
                            <input
                                type="text"
                                value={shopDescription}
                                onChange={(e) => setShopDescription(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                placeholder="Brief description of your shop..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-3.5 h-3.5" />
                            {loading ? 'Saving...' : 'Save Details'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Email Update */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="bg-blue-50 p-2 rounded-lg">
                            <Mail className="w-4 h-4 text-blue-600" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm">Update Email</h3>
                    </div>

                    <form onSubmit={handleUpdateEmail} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Current Email</label>
                            <input
                                type="text"
                                value={user?.email || ''}
                                disabled
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">New Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                placeholder="new@example.com"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !email}
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                            <Save className="w-3.5 h-3.5" />
                            {loading ? 'Updating...' : 'Update Email'}
                        </button>
                    </form>
                </div>

                {/* Password Update */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="bg-purple-50 p-2 rounded-lg">
                            <Lock className="w-4 h-4 text-purple-600" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm">Change Password</h3>
                    </div>

                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">New Password</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                                placeholder="Min 6 chars"
                            />
                        </div>
                        <div className="pt-[52px]"> {/* Spacer to align buttons if needed, or just let it flow */}
                            <button
                                type="submit"
                                disabled={loading || !password}
                                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-3.5 h-3.5" />
                                {loading ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

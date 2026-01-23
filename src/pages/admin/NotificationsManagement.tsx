import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AdminLayout } from '../../components/AdminLayout';
import { Bell, Plus, Send, Trash2, Users, User, Store, Globe, X } from 'lucide-react';

interface Notification {
    id: string;
    title: string;
    message: string;
    target_type: 'all' | 'customers' | 'vendors' | 'specific';
    target_user_id?: string;
    is_sent: boolean;
    created_at: string;
}

export default function NotificationsManagement() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        target_type: 'all' as 'all' | 'customers' | 'vendors' | 'specific',
        target_user_id: ''
    });

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        const { data, error } = await supabase.from('admin_notifications').select('*').order('created_at', { ascending: false });
        if (!error && data) setNotifications(data);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.from('admin_notifications').insert([{ ...formData, is_sent: false }]);
        if (!error) {
            setShowModal(false);
            setFormData({ title: '', message: '', target_type: 'all', target_user_id: '' });
            fetchNotifications();
        }
        setLoading(false);
    };

    const handleSend = async (id: string) => {
        const { error } = await supabase.from('admin_notifications').update({ is_sent: true }).eq('id', id);
        if (!error) fetchNotifications();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this notification?')) return;
        const { error } = await supabase.from('admin_notifications').delete().eq('id', id);
        if (!error) fetchNotifications();
    };

    return (
        <AdminLayout>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                            <Bell className="w-6 h-6 mr-2 text-blue-600" />
                            Notifications Management
                        </h1>
                        <p className="text-gray-600 text-sm mt-1">Send notifications to users and vendors</p>
                    </div>
                    <button onClick={() => setShowModal(true)} className="flex items-center px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm">
                        <Plus className="w-4 h-4 mr-1" />
                        Create
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <Bell className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-xs text-slate-600 uppercase">Total</p>
                        <h2 className="text-2xl font-bold text-slate-900">{notifications.length}</h2>
                    </div>
                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <Send className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-xs text-slate-600 uppercase">Sent</p>
                        <h2 className="text-2xl font-bold text-green-600">{notifications.filter(n => n.is_sent).length}</h2>
                    </div>
                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <Users className="w-5 h-5 text-purple-600" />
                        </div>
                        <p className="text-xs text-slate-600 uppercase">To Customers</p>
                        <h2 className="text-2xl font-bold text-purple-600">{notifications.filter(n => n.target_type === 'customers').length}</h2>
                    </div>
                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <Store className="w-5 h-5 text-orange-600" />
                        </div>
                        <p className="text-xs text-slate-600 uppercase">To Vendors</p>
                        <h2 className="text-2xl font-bold text-orange-600">{notifications.filter(n => n.target_type === 'vendors').length}</h2>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : notifications.map((notif) => (
                        <div key={notif.id} className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:shadow-md transition">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${notif.is_sent ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {notif.is_sent ? 'Sent' : 'Draft'}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 flex items-center gap-1">
                                            {notif.target_type === 'all' && <><Globe className="w-3 h-3" /> All Users</>}
                                            {notif.target_type === 'customers' && <><Users className="w-3 h-3" /> Customers</>}
                                            {notif.target_type === 'vendors' && <><Store className="w-3 h-3" /> Vendors</>}
                                            {notif.target_type === 'specific' && <><User className="w-3 h-3" /> Specific User</>}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">{notif.title}</h3>
                                    <p className="text-sm text-gray-600">{notif.message}</p>
                                    <p className="text-xs text-gray-400 mt-2">{new Date(notif.created_at).toLocaleString()}</p>
                                </div>
                                <div className="flex items-center gap-1 ml-4">
                                    {!notif.is_sent && (
                                        <button onClick={() => handleSend(notif.id)} className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-600 hover:text-white transition">
                                            <Send className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button onClick={() => handleDelete(notif.id)} className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-600 hover:text-white transition">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {notifications.length === 0 && (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-gray-400">No notifications yet</h3>
                            <p className="text-sm text-gray-300">Create your first notification</p>
                        </div>
                    )}
                </div>

                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
                        <div className="bg-white rounded-lg w-full max-w-lg p-6 shadow-xl">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-900">Create Notification</h3>
                                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded transition">
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
                                    <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-2 py-1 bg-gray-50 rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Notification title" />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Message *</label>
                                    <textarea required value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} className="w-full px-2 py-1 bg-gray-50 rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm min-h-[100px]" placeholder="Notification message" />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Target Audience *</label>
                                    <select value={formData.target_type} onChange={e => setFormData({ ...formData, target_type: e.target.value as any })} className="w-full px-2 py-1 bg-gray-50 rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm">
                                        <option value="all">All Users</option>
                                        <option value="customers">Customers Only</option>
                                        <option value="vendors">Vendors Only</option>
                                        <option value="specific">Specific User</option>
                                    </select>
                                </div>

                                {formData.target_type === 'specific' && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">User ID *</label>
                                        <input required value={formData.target_user_id} onChange={e => setFormData({ ...formData, target_user_id: e.target.value })} className="w-full px-2 py-1 bg-gray-50 rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Enter user ID" />
                                    </div>
                                )}

                                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white rounded py-2 font-medium hover:bg-blue-700 transition disabled:opacity-50 text-sm">
                                    {loading ? 'Creating...' : 'Create Notification'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

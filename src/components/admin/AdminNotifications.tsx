import { useState, useEffect, useRef } from 'react';
import { Bell, X, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

interface Notification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    data?: any;
}

export function AdminNotifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [latestToast, setLatestToast] = useState<Notification | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!user) return;

        fetchNotifications();

        // Real-time subscription - Listen for all notifications where user_id is the admin's ID
        const channel = supabase
            .channel('admin-notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    const newNotification = payload.new as Notification;
                    setNotifications(prev => [newNotification, ...prev]);
                    setUnreadCount(prev => prev + 1);

                    // Trigger pop-up toast
                    setLatestToast(newNotification);
                    setTimeout(() => setLatestToast(null), 5000);
                }
            )
            .subscribe();

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            supabase.removeChannel(channel);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [user]);

    const fetchNotifications = async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (!error && data) {
            setNotifications(data as Notification[]);
            setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
        }
        setLoading(false);
    };

    const markAsRead = async (id: string) => {
        setNotifications(prev => prev.map(n =>
            n.id === id ? { ...n, is_read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));

        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);
    };

    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);

        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user?.id)
            .eq('is_read', false);
    };

    const deleteNotification = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const wasUnread = notifications.find(n => n.id === id)?.is_read === false;
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));

        await supabase
            .from('notifications')
            .delete()
            .eq('id', id);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
            case 'error': return <AlertTriangle className="h-5 w-5 text-red-500" />;
            default: return <Info className="h-5 w-5 text-blue-500" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
                aria-label="Admin Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
                )}
            </button>

            {/* Real-time Pop-up Toast */}
            {latestToast && (
                <div className="fixed bottom-6 right-6 w-96 bg-white dark:bg-slate-900 border-l-4 border-red-500 rounded-2xl shadow-2xl p-4 z-[100] animate-in slide-in-from-right-full duration-500 flex items-start gap-3">
                    <div className="mt-1">
                        {getIcon(latestToast.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{latestToast.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{latestToast.message}</p>
                    </div>
                    <button onClick={() => setLatestToast(null)} className="text-slate-400 hover:text-slate-600">
                        <X size={16} />
                    </button>
                </div>
            )}

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 dark:text-white">Admin Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {loading && notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                <div className="animate-spin w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full mx-auto mb-2" />
                                <p className="text-xs">Loading...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p className="text-sm font-medium">No alerts</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative group ${!notification.is_read ? 'bg-slate-50/50 dark:bg-slate-800/30' : ''}`}
                                        onClick={() => markAsRead(notification.id)}
                                    >
                                        <div className="flex gap-3">
                                            <div className="mt-1 shrink-0">
                                                {getIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={`text-sm font-semibold ${!notification.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                                        {notification.title}
                                                    </p>
                                                    <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap">
                                                        {new Date(notification.created_at).toLocaleDateString(undefined, {
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                                    {notification.message}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => deleteNotification(notification.id, e)}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all absolute top-2 right-2 bg-white dark:bg-slate-900 shadow-sm rounded-lg"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-center">
                        <Link
                            to="/admin/notifications"
                            className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                        >
                            Manage All Alerts
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

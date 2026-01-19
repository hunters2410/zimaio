import { useEffect, useState } from 'react';
import {
    Truck,
    Package,
    CheckCircle,
    Clock,
    MapPin,
    Phone,
    LayoutDashboard,
    History,
    Wallet,
    User,
    ChevronRight,
    Search,
    Filter,
    Navigation,
    Calendar,
    ArrowUpRight,
    TrendingUp,
    Shield
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Delivery {
    id: string;
    tracking_number: string;
    delivery_status: string;
    delivery_address: string;
    customer_phone: string;
    created_at: string;
    updated_at: string;
    order_id: string;
    customer_id: string;
    vendor_id: string;
    delivery_notes: string | null;
    delivery_time?: string;
    pickup_time?: string;
    orders?: {
        shipping_fee: number;
        subtotal: number;
        order_number: string;
    };
}

interface Wallet {
    id: string;
    user_id: string;
    balance: number;
    pending_balance: number;
    total_earned: number;
    total_withdrawn: number;
    currency_code: string;
}

type TabType = 'tasks' | 'history' | 'earnings' | 'profile';

export function LogisticDashboard() {
    const { user } = useAuth();
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [loading, setLoading] = useState(true);
    const [driverInfo, setDriverInfo] = useState<any>(null);
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('tasks');
    const [searchQuery, setSearchQuery] = useState('');
    const [historySearchQuery, setHistorySearchQuery] = useState('');
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({
        driver_name: '',
        phone_number: '',
        vehicle_type: '',
        vehicle_number: ''
    });

    useEffect(() => {
        if (user) {
            fetchDriverAndDeliveries();
        }
    }, [user]);

    const fetchDriverAndDeliveries = async () => {
        setLoading(true);

        try {
            // Get driver profile
            const { data: driverData, error: driverError } = await supabase
                .from('delivery_drivers')
                .select('*')
                .eq('profile_id', user?.id)
                .single();

            if (driverError) throw driverError;

            if (driverData) {
                setDriverInfo(driverData);
                setProfileForm({
                    driver_name: driverData.driver_name,
                    phone_number: driverData.phone_number,
                    vehicle_type: driverData.vehicle_type,
                    vehicle_number: driverData.vehicle_number
                });

                // Get assigned deliveries with order info
                const { data: deliveryData } = await supabase
                    .from('deliveries')
                    .select(`
                        *,
                        orders!inner (
                            shipping_fee,
                            subtotal,
                            order_number
                        )
                    `)
                    .eq('driver_id', driverData.id)
                    .order('created_at', { ascending: false });

                setDeliveries(deliveryData || []);

                // Get wallet data
                const { data: walletData } = await supabase
                    .from('wallets')
                    .select('*')
                    .eq('user_id', user?.id)
                    .single();

                setWallet(walletData);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!driverInfo) return;

        setLoading(true);
        const { error } = await supabase
            .from('delivery_drivers')
            .update({
                driver_name: profileForm.driver_name,
                phone_number: profileForm.phone_number,
                vehicle_type: profileForm.vehicle_type,
                vehicle_number: profileForm.vehicle_number
            })
            .eq('id', driverInfo.id);

        if (!error) {
            setDriverInfo({ ...driverInfo, ...profileForm });
            setIsEditingProfile(false);
        }
        setLoading(false);
    };

    const handleWithdraw = () => {
        if (!wallet || wallet.balance <= 0) {
            alert("No balance available to withdraw.");
            return;
        }
        alert(`Withdrawal request of $${wallet.balance.toFixed(2)} has been submitted!`);
    };

    const toggleAvailability = async () => {
        if (!driverInfo) return;

        const newStatus = !driverInfo.is_available;
        const { error } = await supabase
            .from('delivery_drivers')
            .update({ is_available: newStatus })
            .eq('id', driverInfo.id);

        if (!error) {
            setDriverInfo({ ...driverInfo, is_available: newStatus });
        }
    };

    const updateStatus = async (deliveryId: string, newStatus: string) => {
        const { error } = await supabase.rpc('update_delivery_status', {
            delivery_id_param: deliveryId,
            new_status: newStatus,
            location_param: 'Updated by driver',
            notes_param: `Status changed to ${newStatus}`
        });

        if (!error) {
            fetchDriverAndDeliveries();
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'in_transit': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'picked_up': return 'bg-violet-100 text-violet-700 border-violet-200';
            case 'assigned': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const activeTasks = deliveries.filter(d =>
        ['assigned', 'picked_up', 'in_transit'].includes(d.delivery_status)
    );

    const completedTasks = deliveries.filter(d => d.delivery_status === 'delivered');

    const todayEarnings = deliveries
        .filter(d =>
            d.delivery_status === 'delivered' &&
            new Date(d.delivery_time || d.updated_at).toDateString() === new Date().toDateString()
        )
        .reduce((sum, d) => sum + (d.orders?.shipping_fee || 0), 0);

    const monthlyEarningsCount = deliveries.filter(d => {
        const dDate = new Date(d.delivery_time || d.updated_at);
        const now = new Date();
        return d.delivery_status === 'delivered' &&
            dDate.getMonth() === now.getMonth() &&
            dDate.getFullYear() === now.getFullYear();
    }).length;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
                <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600"></div>
                    <Truck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-emerald-600" />
                </div>
            </div>
        );
    }

    if (!driverInfo) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl shadow-emerald-100/50 p-10 text-center border border-emerald-50">
                    <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Shield className="h-10 w-10 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Account Not Registered</h2>
                    <p className="text-slate-500 mb-8 leading-relaxed">Your account isn't registered in our delivery fleet system yet. Please contact support or your manager and provide your details.</p>
                    <button className="w-full bg-emerald-600 text-white font-semibold py-3 rounded-xl hover:bg-emerald-700 transition-colors">
                        Contact Support
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-white border-r border-slate-100 p-6 flex flex-col gap-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                        <Truck className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-900 leading-none">ZimaLogistics</h2>
                        <span className="text-xs text-slate-400">Driver Portal</span>
                    </div>
                </div>

                <nav className="flex flex-col gap-2">
                    {[
                        { id: 'tasks', icon: LayoutDashboard, label: 'Active Tasks', count: activeTasks.length },
                        { id: 'history', icon: History, label: 'History' },
                        { id: 'earnings', icon: Wallet, label: 'Earnings' },
                        { id: 'profile', icon: User, label: 'Profile' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as TabType)}
                            className={`flex items-center justify-between p-3 rounded-xl transition-all ${activeTab === item.id
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className="h-5 w-5" />
                                <span className="font-medium">{item.label}</span>
                            </div>
                            {item.count !== undefined && item.count > 0 && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === item.id ? 'bg-emerald-200' : 'bg-slate-100'
                                    }`}>
                                    {item.count}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="mt-auto pt-6 border-t border-slate-100">
                    <div className="bg-slate-50 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-slate-600">Online Status</span>
                            <button
                                onClick={toggleAvailability}
                                className={`w-10 h-5 rounded-full relative transition-colors ${driverInfo.is_available ? 'bg-emerald-500' : 'bg-slate-300'
                                    }`}
                            >
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${driverInfo.is_available ? 'right-1' : 'left-1'
                                    }`} />
                            </button>
                        </div>
                        <p className="text-xs text-slate-400">
                            {driverInfo.is_available
                                ? 'You are receiving new delivery requests.'
                                : 'You are currently offline.'}
                        </p>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 capitalize">{activeTab} Dashboard</h1>
                        <p className="text-slate-500">Welcome back, {driverInfo.driver_name}</p>
                    </div>
                    {activeTab === 'tasks' && (
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search tracking #..."
                                    className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all w-full md:w-64"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                                <Filter className="h-4 w-4 text-slate-600" />
                            </button>
                        </div>
                    )}
                    {activeTab === 'history' && (
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search history..."
                                    className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all w-full md:w-64"
                                    value={historySearchQuery}
                                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </header>

                {activeTab === 'tasks' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Tasks List */}
                        <div className="lg:col-span-2 space-y-6">
                            {activeTasks.length === 0 ? (
                                <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Package className="h-10 w-10 text-slate-300" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">No Active Tasks</h3>
                                    <p className="text-slate-500 max-w-xs mx-auto">When you are assigned new deliveries, they will appear here.</p>
                                </div>
                            ) : (
                                activeTasks
                                    .filter(d => d.tracking_number.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map((delivery) => (
                                        <div key={delivery.id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                                            <div className="p-6">
                                                <div className="flex items-start justify-between mb-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                                                            <Package className="h-6 w-6 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                                                        </div>
                                                        <div>
                                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">#{delivery.tracking_number}</span>
                                                            <h3 className="text-lg font-bold text-slate-900">New Order Pick-up</h3>
                                                        </div>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(delivery.delivery_status)}`}>
                                                        {delivery.delivery_status.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                </div>

                                                <div className="space-y-4 mb-8">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
                                                            <MapPin className="h-4 w-4 text-slate-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-medium text-slate-400 uppercase">Delivery Address</p>
                                                            <p className="text-slate-700 font-medium">{delivery.delivery_address}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-8">
                                                        <div className="flex items-start gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
                                                                <Phone className="h-4 w-4 text-slate-400" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-medium text-slate-400 uppercase">Contact</p>
                                                                <p className="text-slate-700 font-medium">{delivery.customer_phone}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
                                                                <Calendar className="h-4 w-4 text-slate-400" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-medium text-slate-400 uppercase">Booked On</p>
                                                                <p className="text-slate-700 font-medium">{new Date(delivery.created_at).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col sm:flex-row gap-3">
                                                    {delivery.delivery_status === 'assigned' && (
                                                        <button
                                                            onClick={() => updateStatus(delivery.id, 'picked_up')}
                                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
                                                        >
                                                            Confirm Pickup <ChevronRight className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    {delivery.delivery_status === 'picked_up' && (
                                                        <button
                                                            onClick={() => updateStatus(delivery.id, 'in_transit')}
                                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                                                        >
                                                            <Navigation className="h-4 w-4" /> Start Delivery
                                                        </button>
                                                    )}
                                                    {delivery.delivery_status === 'in_transit' && (
                                                        <button
                                                            onClick={() => updateStatus(delivery.id, 'delivered')}
                                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
                                                        >
                                                            <CheckCircle className="h-4 w-4" /> Mark as Delivered
                                                        </button>
                                                    )}
                                                    <button className="px-6 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-2xl transition-all">
                                                        Details
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>

                        {/* Summary Stats */}
                        <div className="space-y-6">
                            <div className="bg-emerald-600 rounded-3xl p-6 text-white overflow-hidden relative">
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                                            <Wallet className="h-6 w-6 text-white" />
                                        </div>
                                        <span className="flex items-center gap-1 text-xs font-bold bg-white/20 backdrop-blur-md py-1 px-2 rounded-lg">
                                            Available <ArrowUpRight className="h-3 w-3" />
                                        </span>
                                    </div>
                                    <p className="text-emerald-100 text-sm font-medium mb-1">Today's Earnings</p>
                                    <h2 className="text-3xl font-bold mb-6">${todayEarnings.toFixed(2)}</h2>
                                    <div className="flex items-center gap-2 text-sm text-emerald-100">
                                        <TrendingUp className="h-4 w-4" />
                                        <span>Tracking daily progress</span>
                                    </div>
                                </div>
                                <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
                            </div>

                            <div className="bg-white rounded-3xl p-6 border border-slate-100">
                                <h3 className="font-bold text-slate-900 mb-4">Quick Stats</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                                                <Clock className="h-4 w-4" />
                                            </div>
                                            <span className="text-sm font-medium text-slate-600">Avg. Delivery</span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-900">24 mins</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                                                <Package className="h-4 w-4" />
                                            </div>
                                            <span className="text-sm font-medium text-slate-600">Total Pickups</span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-900">{deliveries.length}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                                                <CheckCircle className="h-4 w-4" />
                                            </div>
                                            <span className="text-sm font-medium text-slate-600">Success Rate</span>
                                        </div>
                                        <span className="text-sm font-bold text-emerald-600">98.5%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900">Recent Deliveries</h3>
                            <button className="text-sm text-emerald-600 font-bold hover:text-emerald-700">Export History</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Tracking #</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Location</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Earned</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {completedTasks.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No completed deliveries found in history.</td>
                                        </tr>
                                    ) : (
                                        completedTasks
                                            .filter(d =>
                                                d.tracking_number.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
                                                d.delivery_address.toLowerCase().includes(historySearchQuery.toLowerCase())
                                            )
                                            .map((delivery) => (
                                                <tr key={delivery.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4 font-mono text-sm font-bold text-slate-700">{delivery.tracking_number}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-500">{new Date(delivery.created_at).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">{delivery.delivery_address}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">DELIVERED</span>
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-slate-900">${(delivery.orders?.shipping_fee || 0).toFixed(2)}</td>
                                                </tr>
                                            ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'earnings' && (
                    <div className="space-y-8">
                        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
                            <h3 className="text-xl font-bold text-slate-900 mb-8">Payout Summary</h3>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Available for Payout</p>
                                        <h4 className="text-2xl font-bold text-slate-900">${(wallet?.balance || 0).toFixed(2)}</h4>
                                    </div>
                                    <button
                                        onClick={handleWithdraw}
                                        className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
                                    >
                                        Withdraw
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 border border-slate-100 rounded-2xl">
                                        <p className="text-xs font-medium text-slate-400 mb-1">Lifetime Earnings</p>
                                        <p className="text-lg font-bold text-slate-900">${(wallet?.total_earned || 0).toFixed(2)}</p>
                                    </div>
                                    <div className="p-4 border border-slate-100 rounded-2xl">
                                        <p className="text-xs font-medium text-slate-400 mb-1">Deliveries This Month</p>
                                        <p className="text-lg font-bold text-slate-900">{monthlyEarningsCount}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-8 border border-slate-100">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold text-slate-900">Earnings Chart</h3>
                                <select className="bg-slate-50 border-none rounded-lg text-xs font-bold px-3 py-1 text-slate-500 focus:ring-0">
                                    <option>Last 7 Days</option>
                                    <option>Last 30 Days</option>
                                </select>
                            </div>
                            <div className="h-48 flex items-end justify-between gap-2 px-2">
                                {[40, 70, 50, 90, 65, 85, 100].map((height, i) => (
                                    <div key={i} className="flex-1 group relative">
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                            ${height}
                                        </div>
                                        <div
                                            className="w-full bg-emerald-100 group-hover:bg-emerald-500 transition-all rounded-t-lg"
                                            style={{ height: `${height}%` }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between mt-4 px-2">
                                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => <span key={d} className="text-[10px] font-bold text-slate-400">{d}</span>)}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'profile' && (
                    <div className="max-w-2xl bg-white rounded-3xl border border-slate-100 p-8 shadow-xl shadow-slate-200/40">
                        <div className="flex items-center gap-6 mb-10 pb-10 border-b border-slate-100">
                            <div className="w-24 h-24 bg-emerald-100 rounded-3xl flex items-center justify-center relative">
                                <User className="h-12 w-12 text-emerald-600" />
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full border border-slate-100 flex items-center justify-center shadow-lg">
                                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900">{driverInfo.driver_name}</h3>
                                <p className="text-slate-500 font-medium">{driverInfo.vehicle_type} • {driverInfo.vehicle_number}</p>
                                <span className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                                    <Shield className="h-3 w-3" /> Verified Driver
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={profileForm.driver_name}
                                        onChange={(e) => setProfileForm({ ...profileForm, driver_name: e.target.value })}
                                        disabled={!isEditingProfile}
                                        className={`w-full border-none rounded-2xl px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 ${isEditingProfile ? 'bg-white border border-slate-200' : 'bg-slate-50'}`}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Phone Number</label>
                                    <input
                                        type="text"
                                        value={profileForm.phone_number}
                                        onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })}
                                        disabled={!isEditingProfile}
                                        className={`w-full border-none rounded-2xl px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 ${isEditingProfile ? 'bg-white border border-slate-200' : 'bg-slate-50'}`}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Vehicle Type</label>
                                    <select
                                        value={profileForm.vehicle_type}
                                        onChange={(e) => setProfileForm({ ...profileForm, vehicle_type: e.target.value })}
                                        disabled={!isEditingProfile}
                                        className={`w-full border-none rounded-2xl px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 ${isEditingProfile ? 'bg-white border border-slate-200' : 'bg-slate-50'}`}
                                    >
                                        <option value="motorcycle">Motorcycle</option>
                                        <option value="car">Car</option>
                                        <option value="van">Van</option>
                                        <option value="truck">Truck</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">License Plate</label>
                                    <input
                                        type="text"
                                        value={profileForm.vehicle_number}
                                        onChange={(e) => setProfileForm({ ...profileForm, vehicle_number: e.target.value })}
                                        disabled={!isEditingProfile}
                                        className={`w-full border-none rounded-2xl px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 ${isEditingProfile ? 'bg-white border border-slate-200' : 'bg-slate-50'}`}
                                    />
                                </div>
                            </div>
                            <div className="pt-6">
                                {isEditingProfile ? (
                                    <div className="flex gap-4">
                                        <button type="submit" className="flex-1 bg-emerald-600 text-white font-bold py-4 rounded-2xl hover:bg-emerald-700 transition-all">
                                            Save Changes
                                        </button>
                                        <button type="button" onClick={() => setIsEditingProfile(false)} className="px-8 bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all">
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <button type="button" onClick={() => setIsEditingProfile(true)} className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-all">
                                        Edit Profile Settings
                                    </button>
                                )}
                                <p className="text-center text-xs text-slate-400 mt-4">For security, some fields can only be changed by an administrator.</p>
                            </div>
                        </form>
                    </div>
                )}
            </main>
        </div >
    );
}



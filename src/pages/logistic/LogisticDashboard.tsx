import { useEffect, useState } from 'react';
import {
    Truck,
    Package,
    CheckCircle,
    Wallet,
    Plus,
    X,
    Edit,
    Trash2,
    MapPin,
    LayoutGrid,
    LayoutList
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { LogisticLayout } from '../../components/LogisticLayout';
import { useLocation, useNavigate } from 'react-router-dom';

// Interfaces
interface LogisticsProfile {
    id: string;
    company_name: string;
    description: string | null;
    business_email: string;
    business_phone: string | null;
    is_verified: boolean;
    rating: number;
}

interface ShippingMethod {
    id: string;
    display_name: string;
    description: string;
    base_cost: number;
    delivery_time_min: number;
    delivery_time_max: number;
    is_active: boolean;
}

interface Driver {
    id: string;
    driver_name: string;
    phone_number: string;
    vehicle_type: string;
    vehicle_number: string;
    is_available: boolean;
}

interface Delivery {
    id: string;
    tracking_number: string;
    delivery_status: string;
    delivery_address: string;
    customer_phone: string;
    created_at: string;
    driver?: {
        driver_name: string;
    };
}

interface ShippingZone {
    id: string;
    name: string;
    regions: string[];
    is_active: boolean;
}

type TabType = 'overview' | 'fleet' | 'shipping' | 'orders' | 'profile' | 'settings' | 'notifications' | 'zones';


export function LogisticDashboard() {
    const { user } = useAuth();
    const { formatPrice } = useCurrency();
    const [profile, setProfile] = useState<LogisticsProfile | null>(null);
    const [loading, setLoading] = useState(true);
    // const [activeSection, setActiveTab] = useState<TabType>('overview'); // State removed in favor of URL routing
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [methods, setMethods] = useState<ShippingMethod[]>([]);
    const [zones, setZones] = useState<ShippingZone[]>([]);
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [stats, setStats] = useState({
        total_deliveries: 0,
        active_drivers: 0,
        total_earned: 0,
        success_rate: 98.5
    });
    // Notifications state
    const [notifications, setNotifications] = useState<any[]>([]);
    const [notificationForm, setNotificationForm] = useState({
        title: '',
        message: '',
        type: 'info',
        target: 'all'
    });

    // Modals
    const [showDriverModal, setShowDriverModal] = useState(false);
    const [showMethodModal, setShowMethodModal] = useState(false);
    const [initializing, setInitializing] = useState(false);
    const [showZoneModal, setShowZoneModal] = useState(false);
    const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
    const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
    const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.id) {
            fetchLogisticsData();
        }
    }, [user?.id]);

    // Determine active section from URL path
    const getActiveSection = (): 'overview' | 'fleet' | 'shipping' | 'orders' | 'profile' | 'settings' | 'notifications' | 'zones' => {
        const path = location.pathname;
        if (path.includes('/fleet')) return 'fleet';
        if (path.includes('/shipping')) return 'shipping';
        if (path.includes('/zones')) return 'zones';
        if (path.includes('/orders')) return 'orders';
        if (path.includes('/profile')) return 'profile';
        if (path.includes('/settings')) return 'settings';
        if (path.includes('/notifications')) return 'notifications';
        return 'overview';
    };

    const activeSection = getActiveSection();

    const fetchLogisticsData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Company Profile
            const { data: profileData, error: profileError } = await supabase
                .from('logistics_profiles')
                .select('*')
                .eq('user_id', user?.id)
                .single();

            if (profileError) throw profileError;
            setProfile(profileData);

            if (profileData) {
                // 2. Fetch Fleet
                const { data: driverData } = await supabase
                    .from('delivery_drivers')
                    .select('*')
                    .eq('logistics_id', profileData.id);
                setDrivers(driverData || []);

                // 3. Fetch Shipping Methods
                const { data: methodData } = await supabase
                    .from('shipping_methods')
                    .select('*')
                    .eq('logistics_id', profileData.id);
                setMethods(methodData || []);

                // 3.5 Fetch Shipping Zones
                const { data: zoneData } = await supabase
                    .from('shipping_zones')
                    .select('*')
                    .eq('logistics_id', profileData.id);
                setZones(zoneData || []);

                // 4. Fetch Deliveries
                const { data: deliveryData } = await supabase
                    .from('deliveries')
                    .select('*, driver:delivery_drivers(driver_name)')
                    .eq('logistics_id', profileData.id)
                    .order('created_at', { ascending: false });
                setDeliveries(deliveryData || []);

                // Update Stats
                setStats({
                    total_deliveries: deliveryData?.length || 0,
                    active_drivers: driverData?.filter(d => d.is_available).length || 0,
                    total_earned: 0, // Calculate from completed payments
                    success_rate: 0.0
                });
            }

            // Mock fetching notifications if table doesn't exist yet, or fetch real ones
            // For now we'll just initialize with an empty array or fetch from a 'notifications' table if you have one.
            // setNotifications([]); 
        } catch (error) {
            console.error('Error fetching logistics data:', error);
        } finally {
            setLoading(false);
        }
    };

    const initializeProfile = async () => {
        if (!user) return;
        setInitializing(true);
        try {
            const { error: lpError } = await supabase.from('logistics_profiles').insert({
                user_id: user.id,
                company_name: user.user_metadata?.full_name + ' Logistics' || 'New Logistics Company',
                business_email: user.email || '',
                is_active: true
            });
            if (lpError) throw lpError;
            await fetchLogisticsData();
        } catch (error: any) {
            alert(`Profile initialization failed: ${error.message}`);
        } finally {
            setInitializing(false);
        }
    };

    const handleSendNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate sending a notification or insert into a real table
        const newNotification = {
            id: Date.now().toString(),
            ...notificationForm,
            created_at: new Date().toISOString(),
            status: 'sent'
        };

        setNotifications([newNotification, ...notifications]);
        setNotificationForm({ title: '', message: '', type: 'info', target: 'all' });
        alert('System Alert Broadcasted Successfully');
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const password = formData.get('new_password') as string;
        const confirm = formData.get('confirm_password') as string;

        if (password !== confirm) {
            alert('Security Error: Passwords do not match');
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            alert('Security Protocol Updated: Password changed successfully');
            (e.target as HTMLFormElement).reset();
        } catch (err: any) {
            alert(`Update Failed: ${err.message}`);
        }
    };

    const handleSaveDriver = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;
        const formData = new FormData(e.target as HTMLFormElement);
        const driverData = {
            logistics_id: profile.id,
            driver_name: formData.get('driver_name') as string,
            phone_number: formData.get('phone_number') as string,
            vehicle_type: formData.get('vehicle_type') as string,
            vehicle_number: formData.get('vehicle_number') as string,
        };

        try {
            let error;
            if (editingDriver) {
                const { error: err } = await supabase.from('delivery_drivers').update(driverData).eq('id', editingDriver.id);
                error = err;
            } else {
                const { error: err } = await supabase.from('delivery_drivers').insert(driverData);
                error = err;
            }
            if (error) throw error;
            setShowDriverModal(false);
            setEditingDriver(null);
            fetchLogisticsData();
        } catch (error: any) {
            alert(`Failed to save driver: ${error.message}`);
        }
    };

    const handleSaveMethod = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;
        const formData = new FormData(e.target as HTMLFormElement);
        const methodData = {
            logistics_id: profile.id,
            name: (formData.get('display_name') as string).toLowerCase().replace(/\s+/g, '_'),
            display_name: formData.get('display_name') as string,
            description: formData.get('description') as string,
            base_cost: parseFloat(formData.get('base_cost') as string),
            delivery_time_min: parseInt(formData.get('delivery_time_min') as string),
            delivery_time_max: parseInt(formData.get('delivery_time_max') as string),
            is_active: true,
            is_global: false
        };

        try {
            let error;
            if (editingMethod) {
                const { error: err } = await supabase.from('shipping_methods').update(methodData).eq('id', editingMethod.id);
                error = err;
            } else {
                const { error: err } = await supabase.from('shipping_methods').insert(methodData);
                error = err;
            }
            if (error) throw error;
            setShowMethodModal(false);
            setEditingMethod(null);
            fetchLogisticsData();
        } catch (error: any) {
            alert(`Failed to save shipping method: ${error.message}`);
        }
    };

    const handleSaveZone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;
        const formData = new FormData(e.target as HTMLFormElement);
        const regionsParam = formData.get('regions') as string;

        const zoneData = {
            logistics_id: profile.id,
            name: formData.get('name') as string,
            regions: regionsParam.split(',').map(r => r.trim()).filter(r => r !== ''),
            is_active: true,
            base_rate: 0 // Default, logic might need expansion later
        };

        try {
            let error;
            if (editingZone) {
                const { error: err } = await supabase.from('shipping_zones').update(zoneData).eq('id', editingZone.id);
                error = err;
            } else {
                const { error: err } = await supabase.from('shipping_zones').insert(zoneData);
                error = err;
            }
            if (error) throw error;
            setShowZoneModal(false);
            setEditingZone(null);
            fetchLogisticsData();
        } catch (error: any) {
            alert(`Failed to save zone: ${error.message}`);
        }
    };

    const handleDeleteZone = async (id: string) => {
        if (!confirm('Are you sure you want to delete this zone?')) return;
        try {
            const { error } = await supabase.from('shipping_zones').delete().eq('id', id);
            if (error) throw error;
            fetchLogisticsData();
        } catch (error: any) {
            alert(`Error deleting zone: ${error.message}`);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
                <div className="text-center max-w-sm">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Truck className="h-8 w-8" />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 mb-2">Logistics Profile Required</h2>
                    <p className="text-slate-500 text-sm mb-8">We couldn't find your logistics company profile. Click below to initialize your carrier dashboard.</p>
                    <button
                        onClick={initializeProfile}
                        disabled={initializing}
                        className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                    >
                        {initializing ? 'Configuring Node...' : 'Initialize Carrier Profile'}
                    </button>
                    <p className="mt-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        System Identity: {user?.email}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <LogisticLayout>
            <div className="max-w-7xl mx-auto w-full space-y-8 pb-20 px-4 sm:px-6 lg:px-8">
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-all">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tighter capitalize">{activeSection === 'fleet' ? 'Fleet Management' : activeSection === 'shipping' ? 'Shipping Rates' : activeSection === 'zones' ? 'Delivery Zones' : activeSection}</h1>
                        <p className="text-black text-[10px] font-bold uppercase tracking-widest leading-none mt-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Carrier Hub: <strong className="text-black">{profile.company_name}</strong>
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {activeSection === 'fleet' && (
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                                    <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>
                                        <LayoutGrid className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>
                                        <LayoutList className="h-4 w-4" />
                                    </button>
                                </div>
                                <button
                                    onClick={() => { setEditingDriver(null); setShowDriverModal(true); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-[10px] hover:bg-emerald-700 transition-all shadow-sm uppercase tracking-widest"
                                >
                                    <Plus className="h-3 w-3" /> Registration
                                </button>
                            </div>
                        )}
                        {activeSection === 'shipping' && (
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                                    <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>
                                        <LayoutGrid className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>
                                        <LayoutList className="h-4 w-4" />
                                    </button>
                                </div>
                                <button
                                    onClick={() => { setEditingMethod(null); setShowMethodModal(true); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-[10px] hover:bg-emerald-700 transition-all shadow-sm uppercase tracking-widest"
                                >
                                    <Plus className="h-3 w-3" /> Create Rate
                                </button>
                            </div>
                        )}
                        {activeSection === 'zones' && (
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                                    <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>
                                        <LayoutGrid className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>
                                        <LayoutList className="h-4 w-4" />
                                    </button>
                                </div>
                                <button
                                    onClick={() => { setEditingZone(null); setShowZoneModal(true); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-[10px] hover:bg-emerald-700 transition-all shadow-sm uppercase tracking-widest"
                                >
                                    <Plus className="h-3 w-3" /> Create Zone
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {activeSection === 'overview' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Efficiency section removed as requested */}

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'Active Deliveries', value: stats.total_deliveries, icon: Package, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
                                { label: 'Fleet Personnel', value: stats.active_drivers, icon: Truck, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                                { label: 'Network Revenue', value: formatPrice(stats.total_earned), icon: Wallet, color: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
                                { label: 'Delivery Success', value: `${stats.success_rate}%`, icon: CheckCircle, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
                            ].map((stat, i) => (
                                <div key={i} className="bg-white p-5 rounded-sm border border-slate-200 hover:border-emerald-500 transition-all group">
                                    <div className={`w-10 h-10 ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
                                        <stat.icon className="h-5 w-5" />
                                    </div>
                                    <p className="text-[10px] font-black text-black uppercase tracking-widest mb-1">{stat.label}</p>
                                    <h3 className="text-xl font-black text-black tracking-tighter">{stat.value}</h3>
                                </div>
                            ))}
                        </div>

                        {/* Live Activity */}
                        <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden border-b-4 border-b-emerald-500">
                            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white">
                                <div>
                                    <h3 className="text-[10px] font-black text-black tracking-[0.2em] uppercase">Telemetry Log</h3>
                                    <p className="text-[8px] text-black mt-0.5 font-bold uppercase tracking-widest">Real-time vector tracking</p>
                                </div>
                                <button onClick={() => navigate('/logistic/orders')} className="px-3 py-1 bg-white border border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-none text-[9px] font-black uppercase tracking-widest transition-all">View All</button>
                            </div>
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left min-w-[600px]">
                                    <thead className="bg-slate-100/50">
                                        <tr>
                                            <th className="px-6 py-4 font-black text-black text-[9px]">Registry ID</th>
                                            <th className="px-6 py-4 font-black text-black text-[9px]">Vector End Point</th>
                                            <th className="px-6 py-4 font-black text-black text-[9px]">Protocol Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {deliveries.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="p-12 text-center text-black text-[10px] font-bold uppercase tracking-widest">Awaiting signals from the field...</td>
                                            </tr>
                                        ) : (
                                            deliveries.slice(0, 5).map((d) => (
                                                <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 font-mono font-black text-emerald-600 tracking-tighter text-xs">#{d.tracking_number.toUpperCase()}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="h-3 w-3 text-slate-400" />
                                                            <span className="font-bold text-black text-[10px]">{d.delivery_address}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 ${d.delivery_status === 'delivered' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                                                            }`}>
                                                            <div className={`w-1 h-1 rounded-full ${d.delivery_status === 'delivered' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></div>
                                                            {d.delivery_status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeSection === 'fleet' && (
                    <>
                        {drivers.length === 0 ? (
                            <div className="col-span-full py-20 text-center bg-white rounded-sm border border-dashed border-slate-200">
                                <p className="text-[10px] font-black text-black">No operators registered in the fleet</p>
                            </div>
                        ) : viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                {drivers.map((driver) => (
                                    <div key={driver.id} className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm relative group overflow-hidden">
                                        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditingDriver(driver); setShowDriverModal(true); }} className="p-2 bg-slate-50 text-slate-400 hover:text-emerald-500 rounded-xl">
                                                <Edit className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-sm flex items-center justify-center font-black text-lg mb-4 shadow-sm border border-slate-200">
                                            {driver.driver_name.charAt(0)}
                                        </div>
                                        <h3 className="text-sm font-black text-black tracking-tight leading-none mb-1">{driver.driver_name}</h3>
                                        <p className="text-[9px] font-black text-black uppercase tracking-widest mb-4 inline-flex items-center gap-2">
                                            <span className="px-1.5 py-0.5 bg-slate-100 rounded">{driver.vehicle_type}</span>
                                            <span>•</span>
                                            <span className="text-emerald-600 font-bold">{driver.vehicle_number}</span>
                                        </p>
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                            <span className="text-[10px] font-bold text-black">{driver.phone_number}</span>
                                            <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${driver.is_available ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                {driver.is_available ? 'Active' : 'Transit'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-6 py-4 font-black text-black text-[9px] uppercase tracking-widest">Driver Name</th>
                                                <th className="px-6 py-4 font-black text-black text-[9px] uppercase tracking-widest">Vehicle</th>
                                                <th className="px-6 py-4 font-black text-black text-[9px] uppercase tracking-widest">Contact</th>
                                                <th className="px-6 py-4 font-black text-black text-[9px] uppercase tracking-widest">Status</th>
                                                <th className="px-6 py-4 font-black text-black text-[9px] uppercase tracking-widest text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {drivers.map(driver => (
                                                <tr key={driver.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-slate-100 rounded-sm flex items-center justify-center font-black text-xs text-slate-700">
                                                                {driver.driver_name.charAt(0)}
                                                            </div>
                                                            <span className="text-xs font-black text-black">{driver.driver_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-slate-900 capitalize">{driver.vehicle_type}</span>
                                                            <span className="text-[10px] text-emerald-600 font-mono">{driver.vehicle_number}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-bold text-slate-600">
                                                        {driver.phone_number}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${driver.is_available ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                            {driver.is_available ? 'Active' : 'Transit'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button onClick={() => { setEditingDriver(driver); setShowDriverModal(true); }} className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"><Edit className="h-4 w-4" /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {activeSection === 'shipping' && (
                    <>
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                {methods.map((method) => (
                                    <div key={method.id} className="bg-white p-6 rounded-sm border border-slate-200 shadow-sm relative group hover:border-emerald-500/50 transition-all">
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-sm font-black text-black tracking-tight">{method.display_name}</h3>
                                                <span className="text-[8px] font-black px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded uppercase tracking-tighter">Active Protocol</span>
                                            </div>
                                            <p className="text-[9px] text-slate-600">{method.delivery_time_min}-{method.delivery_time_max} Days Window</p>
                                        </div>
                                        <div className="flex items-baseline gap-1 mb-6">
                                            <span className="text-xs font-bold text-slate-400">$</span>
                                            <span className="text-3xl font-black text-black tracking-tighter leading-none">{method.base_cost.toFixed(2)}</span>
                                            <span className="text-[9px] font-black text-black uppercase ml-2 tracking-widest">Base Rate</span>
                                        </div>
                                        <div className="flex gap-2 pt-4 border-t border-slate-300">
                                            <button onClick={() => { setEditingMethod(method); setShowMethodModal(true); }} className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all hover:bg-emerald-700">Update</button>
                                            <button className="px-3 py-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all border border-rose-500/20"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-6 py-4 font-black text-black text-[9px] uppercase tracking-widest">Method Name</th>
                                                <th className="px-6 py-4 font-black text-black text-[9px] uppercase tracking-widest">Duration (Days)</th>
                                                <th className="px-6 py-4 font-black text-black text-[9px] uppercase tracking-widest">Base Cost</th>
                                                <th className="px-6 py-4 font-black text-black text-[9px] uppercase tracking-widest">Status</th>
                                                <th className="px-6 py-4 font-black text-black text-[9px] uppercase tracking-widest text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {methods.map(method => (
                                                <tr key={method.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black text-black">{method.display_name}</span>
                                                            <span className="text-[10px] text-slate-500 truncate max-w-[200px]">{method.description}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs font-bold text-slate-700">{method.delivery_time_min}-{method.delivery_time_max} Days</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs font-black text-black">${method.base_cost.toFixed(2)}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600">
                                                            Active Protocol
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                                        <button onClick={() => { setEditingMethod(method); setShowMethodModal(true); }} className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"><Edit className="h-4 w-4" /></button>
                                                        <button className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {activeSection === 'zones' && (
                    <>
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                {zones.map((zone) => (
                                    <div key={zone.id} className="bg-white p-6 rounded-sm border border-slate-200 shadow-sm relative group hover:border-emerald-500/50 transition-all">
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-sm font-black text-black tracking-tight">{zone.name}</h3>
                                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${zone.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>{zone.is_active ? 'Active' : 'Inactive'}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1 h-12 overflow-hidden">
                                                {zone.regions.map((region, i) => (
                                                    <span key={i} className="text-[8px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-bold">{region}</span>
                                                ))}
                                                {zone.regions.length === 0 && <span className="text-[8px] text-slate-400 italic">No regions assigned</span>}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 pt-4 border-t border-slate-300">
                                            <button onClick={() => { setEditingZone(zone); setShowZoneModal(true); }} className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all hover:bg-emerald-700">Configure</button>
                                            <button onClick={() => handleDeleteZone(zone.id)} className="px-3 py-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all border border-rose-500/20"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-6 py-4 font-black text-black text-[9px] uppercase tracking-widest">Zone Id</th>
                                                <th className="px-6 py-4 font-black text-black text-[9px] uppercase tracking-widest">Regions</th>
                                                <th className="px-6 py-4 font-black text-black text-[9px] uppercase tracking-widest">Status</th>
                                                <th className="px-6 py-4 font-black text-black text-[9px] uppercase tracking-widest text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {zones.map(zone => (
                                                <tr key={zone.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs font-black text-black">{zone.name}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-wrap gap-1 max-w-md">
                                                            {zone.regions.slice(0, 5).map((region, i) => (
                                                                <span key={i} className="text-[8px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-bold">{region}</span>
                                                            ))}
                                                            {zone.regions.length > 5 && <span className="text-[8px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-bold">+{zone.regions.length - 5}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${zone.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                            {zone.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                                        <button onClick={() => { setEditingZone(zone); setShowZoneModal(true); }} className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"><Edit className="h-4 w-4" /></button>
                                                        <button onClick={() => handleDeleteZone(zone.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {activeSection === 'profile' && (
                    <div className="max-w-xl mx-auto space-y-4 animate-in fade-in slide-in-from-right-2 duration-500">
                        <div className="bg-white rounded-sm border border-slate-300 p-8 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[40px] rounded-full -mr-10 -mt-10"></div>

                            <div className="flex items-center gap-5 mb-8 pb-8 border-b border-slate-50">
                                <div className="w-16 h-16 bg-emerald-500 text-white rounded-sm flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                    <Truck className="h-8 w-8" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-black tracking-tight">{profile.company_name}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-black rounded uppercase tracking-widest">Verified Infrastructure</span>
                                        <span className="text-[10px] text-slate-500 font-bold">• Active Node Since 2024</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 mb-8">
                                <div>
                                    <label className="text-[9px] font-black text-black block mb-1.5">Carrier ID / Email</label>
                                    <p className="text-xs font-black text-slate-800">{profile.business_email}</p>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-black block mb-1.5">Command Hotline</label>
                                    <p className="text-xs font-black text-slate-800">{profile.business_phone || '--'}</p>
                                </div>
                            </div>

                            <div className="mb-8">
                                <label className="text-[9px] font-black text-black block mb-1.5">Registry Description</label>
                                <p className="text-xs text-black font-bold leading-relaxed">{profile.description || "Leading the regional supply chain with precision and scale."}</p>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button onClick={() => navigate('/logistic/settings')} className="flex-1 py-3 bg-emerald-600 text-white font-black text-[10px] rounded-sm hover:bg-emerald-700 transition-all uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20">Edit Registry Parameters</button>
                                <button className="px-6 py-3 border border-slate-300 text-black font-black text-[10px] rounded-sm hover:bg-slate-100 transition-all uppercase tracking-widest">Global Protocol</button>
                            </div>
                        </div>
                    </div>
                )}

                {activeSection === 'settings' && (
                    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-right-2 duration-500 space-y-8">
                        {/* Profile Settings */}
                        <div className="bg-white rounded-sm border border-slate-300 shadow-2xl overflow-hidden">
                            <div className="p-8 border-b border-slate-50 bg-slate-50/10">
                                <h2 className="text-lg font-black tracking-tight text-black">Account Settings</h2>
                                <p className="text-[10px] text-black mt-1">Manage your company profile details</p>
                            </div>

                            <form className="p-8 space-y-6" onSubmit={async (e) => {
                                e.preventDefault();
                                const formData = new FormData(e.target as HTMLFormElement);
                                const updates = {
                                    company_name: formData.get('company_name') as string,
                                    description: formData.get('description') as string,
                                    business_phone: formData.get('business_phone') as string,
                                };
                                try {
                                    const { error } = await supabase.from('logistics_profiles').update(updates).eq('user_id', user?.id);
                                    if (error) throw error;
                                    alert('Settings saved successfully.');
                                    fetchLogisticsData();
                                } catch (err: any) { alert(err.message); }
                            }}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-black block ml-1">Company Name</label>
                                        <input name="company_name" defaultValue={profile.company_name} className="w-full bg-white border border-slate-300 rounded-sm px-4 py-3 text-xs font-black outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-black" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-black block ml-1">Phone Number</label>
                                        <input name="business_phone" defaultValue={profile.business_phone || ''} className="w-full bg-white border border-slate-300 rounded-sm px-4 py-3 text-xs font-black outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-black" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-black block ml-1">Description</label>
                                    <textarea name="description" defaultValue={profile.description || ''} className="w-full bg-white border border-slate-300 rounded-sm px-4 py-3 text-xs font-black outline-none h-32 resize-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-black" />
                                </div>
                                <div className="pt-6 border-t border-slate-50 flex gap-4">
                                    <button type="submit" className="flex-1 bg-emerald-600 text-white font-black py-4 rounded-sm text-xs uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-[0.98]">Save Changes</button>
                                </div>
                            </form>
                        </div>

                        {/* Password Change Section */}
                        <div className="bg-white rounded-sm border border-slate-300 shadow-2xl overflow-hidden">
                            <div className="p-8 border-b border-slate-50 bg-rose-50/10">
                                <h2 className="text-lg font-black tracking-tight text-black">Security Settings</h2>
                                <p className="text-[10px] text-black mt-1">Change your login password</p>
                            </div>
                            <form onSubmit={handlePasswordChange} className="p-8 space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-black block ml-1">New Password</label>
                                        <input type="password" name="new_password" required className="w-full bg-white border border-slate-300 rounded-sm px-4 py-3 text-xs font-black outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-black" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-black block ml-1">Confirm Password</label>
                                        <input type="password" name="confirm_password" required className="w-full bg-white border border-slate-300 rounded-sm px-4 py-3 text-xs font-black outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-black" />
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-slate-900 text-white font-black py-4 rounded-sm text-xs uppercase tracking-[0.2em] shadow-lg hover:bg-black transition-all active:scale-[0.98]">Update Password</button>
                            </form>
                        </div>
                    </div>
                )}

                {activeSection === 'notifications' && (
                    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-right-2 duration-500 grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Trigger Form */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-sm border border-slate-300 shadow-2xl overflow-hidden">
                                <div className="p-6 border-b border-slate-50 bg-slate-50/10">
                                    <h2 className="text-sm font-black tracking-tight text-black uppercase tracking-widest">Broadcast Signal</h2>
                                </div>
                                <form onSubmit={handleSendNotification} className="p-6 space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-black block ml-1">Alert Title</label>
                                        <input
                                            value={notificationForm.title}
                                            onChange={e => setNotificationForm({ ...notificationForm, title: e.target.value })}
                                            required
                                            className="w-full bg-white border border-slate-300 rounded-sm px-4 py-3 text-xs font-black outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-black"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-black block ml-1">Target Audience</label>
                                        <select
                                            value={notificationForm.target}
                                            onChange={e => setNotificationForm({ ...notificationForm, target: e.target.value })}
                                            className="w-full bg-white border border-slate-300 rounded-sm px-4 py-3 text-xs font-black outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-black appearance-none"
                                        >
                                            <option value="all">Global Broadcast</option>
                                            <option value="drivers">Fleet Operators</option>
                                            <option value="partners">Logistics Partners</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-black block ml-1">Signal Type</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['info', 'alert', 'success'].map(type => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setNotificationForm({ ...notificationForm, type })}
                                                    className={`py-2 text-[9px] font-black uppercase tracking-wider border rounded-sm transition-all ${notificationForm.type === type
                                                        ? 'bg-slate-900 text-white border-slate-900'
                                                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                                                        }`}
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-black block ml-1">Message Content</label>
                                        <textarea
                                            value={notificationForm.message}
                                            onChange={e => setNotificationForm({ ...notificationForm, message: e.target.value })}
                                            required
                                            className="w-full bg-white border border-slate-300 rounded-sm px-4 py-3 text-xs font-black outline-none h-32 resize-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-black"
                                        />
                                    </div>
                                    <button type="submit" className="w-full bg-emerald-600 text-white font-black py-4 rounded-sm text-[10px] uppercase tracking-[0.2em] shadow-lg hover:bg-emerald-700 transition-all active:scale-[0.98]">Transmit Signal</button>
                                </form>
                            </div>
                        </div>

                        {/* Notification History */}
                        <div className="lg:col-span-2 space-y-4">
                            {notifications.length === 0 ? (
                                <div className="bg-white rounded-sm border border-dashed border-slate-300 p-12 text-center">
                                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Wallet className="h-5 w-5 text-slate-300" />
                                    </div>
                                    <h3 className="text-sm font-black text-black uppercase tracking-widest">No Active Signals</h3>
                                    <p className="text-[10px] text-slate-400 mt-2">Broadcast history will appear here</p>
                                </div>
                            ) : (
                                notifications.map((note) => (
                                    <div key={note.id} className="bg-white rounded-sm border border-slate-200 p-6 shadow-sm hover:border-emerald-500 transition-all group relative overflow-hidden">
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${note.type === 'alert' ? 'bg-rose-500' : note.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                                            }`}></div>
                                        <div className="flex items-start justify-between mb-2 pl-2">
                                            <div>
                                                <h3 className="text-sm font-black text-black tracking-tight">{note.title}</h3>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(note.created_at).toLocaleDateString()} • {note.target}</span>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${note.type === 'alert' ? 'bg-rose-500/10 text-rose-600' : note.type === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-blue-500/10 text-blue-600'
                                                }`}>{note.status}</span>
                                        </div>
                                        <p className="text-xs text-slate-600 pl-2 leading-relaxed">{note.message}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeSection === 'orders' && (
                    <div className="bg-white rounded-sm border border-slate-300 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="p-6 border-b border-slate-50 bg-slate-50/10 flex items-center justify-between gap-4">
                            <div>
                                <h3 className="text-xs font-black text-black tracking-[0.2em] uppercase">Archive & Active Logs</h3>
                                <p className="text-[8px] text-slate-500 mt-1">Status of all delivery requests</p>
                            </div>
                            <span className="hidden sm:inline-block px-2 py-1 bg-slate-100 rounded text-[9px] font-black text-black whitespace-nowrap">Vector Protocol History</span>
                        </div>
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left min-w-[800px]">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-8 py-5 font-black text-black text-[10px]">Registry Ref</th>
                                        <th className="px-8 py-5 font-black text-black text-[10px]">End Point Vector</th>
                                        <th className="px-8 py-5 font-black text-black text-[10px]">Operator Node</th>
                                        <th className="px-8 py-5 font-black text-black text-[10px]">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {deliveries.length === 0 ? (
                                        <tr><td colSpan={4} className="p-20 text-center text-black font-bold uppercase tracking-widest text-xs">Awaiting data injection...</td></tr>
                                    ) : (
                                        deliveries.map((d) => (
                                            <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-8 py-6 font-mono font-black text-emerald-600 tracking-tighter text-sm">#{d.tracking_number}</td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center">
                                                            <MapPin className="h-4 w-4 text-slate-400" />
                                                        </div>
                                                        <span className="font-black text-black max-w-[250px] truncate text-xs">{d.delivery_address}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 text-[10px] font-black border border-slate-200">
                                                            {d.driver?.driver_name.charAt(0) || 'U'}
                                                        </div>
                                                        <span className="font-black text-black text-xs">{d.driver?.driver_name || 'Unassigned'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2 ${d.delivery_status === 'delivered' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                                                        }`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${d.delivery_status === 'delivered' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></div>
                                                        {d.delivery_status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals - Enhanced aesthetics */}
            {showDriverModal && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-sm w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-300">
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/10">
                            <h2 className="text-[10px] font-black text-black uppercase tracking-[0.2em]">{editingDriver ? 'Update Driver' : 'Register Driver'}</h2>
                            <button onClick={() => setShowDriverModal(false)} className="p-2 text-slate-600 hover:text-rose-500 transition-colors"><X className="h-5 w-5" /></button>
                        </div>
                        <form onSubmit={handleSaveDriver} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-black ml-1">Driver Name</label>
                                <input name="driver_name" defaultValue={editingDriver?.driver_name} required className="w-full bg-white border border-slate-300 rounded-sm px-4 py-3 text-xs font-black outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-black" placeholder="Full Name" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-black ml-1">Phone Number</label>
                                    <input name="phone_number" defaultValue={editingDriver?.phone_number} required className="w-full bg-white border border-slate-300 rounded-sm px-4 py-3 text-xs font-black outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-black" placeholder="+263..." />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-black ml-1">Vehicle Type</label>
                                    <select name="vehicle_type" defaultValue={editingDriver?.vehicle_type} className="w-full bg-white border border-slate-300 rounded-sm px-4 py-3 text-xs font-black outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-black appearance-none cursor-pointer">
                                        <option value="motorcycle">Motorcycle</option>
                                        <option value="van">Van</option>
                                        <option value="truck">Truck</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-black ml-1">Vehicle Number</label>
                                <input name="vehicle_number" defaultValue={editingDriver?.vehicle_number} required className="w-full bg-white border border-slate-300 rounded-sm px-4 py-3 text-xs font-black outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-black" placeholder="Plate / ID" />
                            </div>
                            <button type="submit" className="w-full bg-emerald-600 text-white font-black py-4 rounded-sm text-[10px] uppercase tracking-[0.2em] shadow-lg hover:bg-emerald-700 transition-all mt-4">Save Driver</button>
                        </form>
                    </div>
                </div>
            )}

            {showMethodModal && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-sm w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-300">
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-emerald-500/5">
                            <h2 className="text-[10px] font-black text-black uppercase tracking-[0.2em]">Shipping Rate Configuration</h2>
                            <button onClick={() => setShowMethodModal(false)} className="p-2 text-slate-600 hover:text-rose-500 transition-colors"><X className="h-5 w-5" /></button>
                        </div>
                        <form onSubmit={handleSaveMethod} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-black ml-1">Method Name</label>
                                <input name="display_name" defaultValue={editingMethod?.display_name} required className="w-full bg-white border border-slate-300 rounded-sm px-4 py-3 text-xs font-black outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-black" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-black ml-1">Base Rate ($)</label>
                                    <input name="base_cost" type="number" step="0.01" defaultValue={editingMethod?.base_cost} required className="w-full bg-white border border-slate-300 rounded-sm px-4 py-3 text-xs font-black outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-black" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1.5">
                                        <label className="text-[7px] font-black text-black ml-1">Min Days</label>
                                        <input name="delivery_time_min" type="number" defaultValue={editingMethod?.delivery_time_min} required className="w-full bg-white border border-slate-300 rounded-sm px-3 py-3 text-xs font-black outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-black" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[7px] font-black text-black ml-1">Max Days</label>
                                        <input name="delivery_time_max" type="number" defaultValue={editingMethod?.delivery_time_max} required className="w-full bg-white border border-slate-300 rounded-sm px-3 py-3 text-xs font-black outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-black" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-black ml-1">Description</label>
                                <textarea name="description" defaultValue={editingMethod?.description} className="w-full bg-white border border-slate-300 rounded-sm px-4 py-3 text-xs font-black outline-none h-24 resize-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-black" />
                            </div>
                            <button type="submit" className="w-full bg-emerald-600 text-white font-black py-4 rounded-sm text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all mt-4">Save Rate</button>
                        </form>
                    </div>
                </div>
            )}

            {showZoneModal && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-sm w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-300">
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-emerald-500/5">
                            <h2 className="text-[10px] font-black text-black uppercase tracking-[0.2em]">{editingZone ? 'Configure Zone' : 'New Definition'}</h2>
                            <button onClick={() => setShowZoneModal(false)} className="p-2 text-slate-600 hover:text-rose-500 transition-colors"><X className="h-5 w-5" /></button>
                        </div>
                        <form onSubmit={handleSaveZone} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-black ml-1">Zone Identifier</label>
                                <input name="name" defaultValue={editingZone?.name} required className="w-full bg-white border border-slate-300 rounded-sm px-4 py-3 text-xs font-black outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-black" placeholder="e.g. Inner City" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-black ml-1">Included Regions (Comma Separated)</label>
                                <textarea name="regions" defaultValue={editingZone?.regions.join(', ')} className="w-full bg-white border border-slate-300 rounded-sm px-4 py-3 text-xs font-black outline-none h-32 resize-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-black" placeholder="Harare CBD, Avenues, Milton Park..." />
                            </div>
                            <button type="submit" className="w-full bg-emerald-600 text-white font-black py-4 rounded-sm text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all mt-4">Save Configuration</button>
                        </form>
                    </div>
                </div>
            )}
        </LogisticLayout>
    );
}

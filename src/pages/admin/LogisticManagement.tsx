import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { Search, Truck, Plus, Edit, Trash2, Eye, X, AlertCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface LogisticDriver {
    id: string;
    profile_id: string;
    driver_name: string;
    phone_number: string;
    vehicle_type: string;
    vehicle_number: string;
    is_available: boolean;
    status: string;
    created_at: string;
    profile?: {
        email: string;
        is_active: boolean;
    }
}

interface LogisticFormData {
    email: string;
    password?: string;
    driver_name: string;
    phone_number: string;
    vehicle_type: string;
    vehicle_number: string;
    status: string;
    is_active: boolean;
}

export function LogisticManagement() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [drivers, setDrivers] = useState<LogisticDriver[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<LogisticDriver | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [formData, setFormData] = useState<LogisticFormData>({
        email: '',
        password: '',
        driver_name: '',
        phone_number: '',
        vehicle_type: 'motorcycle',
        vehicle_number: '',
        status: 'pending',
        is_active: true,
    });

    useEffect(() => {
        fetchDrivers();
    }, [filterStatus]);

    const fetchDrivers = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('delivery_drivers')
                .select(`
          *,
          profile:profiles!delivery_drivers_profile_id_fkey(email, is_active)
        `)
                .order('created_at', { ascending: false });

            if (filterStatus !== 'all') {
                query = query.eq('status', filterStatus);
            }

            const { data, error } = await query;

            if (error) throw error;
            setDrivers((data as unknown as LogisticDriver[]) || []);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Create auth user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password || 'Logistic123!', // fallback if empty, better to enforce
                options: {
                    data: {
                        full_name: formData.driver_name,
                        role: 'logistic',
                    },
                },
            });

            if (authError) {
                if (authError.message.includes('rate limit')) {
                    throw new Error('Email rate limit exceeded. Please wait a while before adding more drivers or use the Supabase Dashboard.');
                }
                throw authError;
            }

            if (authData.user) {
                // 2. Profile is automatically created by trigger or should be handled if not
                // We'll update the profile fields just in case
                // 2. Ensure Profile Exists (Upsert)
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: authData.user.id,
                        email: formData.email,
                        full_name: formData.driver_name,
                        phone: formData.phone_number,
                        is_active: formData.is_active,
                        role: 'logistic',
                    }, { onConflict: 'id' });

                if (profileError) throw profileError;

                // 3. Create delivery_driver record using RPC
                const { error: driverError } = await supabase.rpc('register_logistic_driver', {
                    p_profile_id: authData.user.id,
                    p_driver_name: formData.driver_name,
                    p_phone_number: formData.phone_number,
                    p_vehicle_type: formData.vehicle_type,
                    p_vehicle_number: formData.vehicle_number
                });

                if (!driverError) {
                    // Status update separately if needed, as RPC sets it to 'pending' by default
                    if (formData.status !== 'pending') {
                        await supabase.from('delivery_drivers').update({ status: formData.status }).eq('profile_id', authData.user.id);
                    }
                }

                if (driverError) throw driverError;

                // 4. Create wallet
                await supabase.from('wallets').insert({
                    user_id: authData.user.id,
                    balance: 0
                });
            }

            setMessage({ type: 'success', text: 'Logistic driver created successfully' });
            handleCloseModal();
            fetchDrivers();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to create driver' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDriver) return;
        setLoading(true);

        try {
            // 1. Update Profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.driver_name,
                    phone: formData.phone_number,
                    is_active: formData.is_active,
                })
                .eq('id', selectedDriver.profile_id);

            if (profileError) throw profileError;

            // 2. Update Driver info
            const { error: driverError } = await supabase
                .from('delivery_drivers')
                .update({
                    driver_name: formData.driver_name,
                    phone_number: formData.phone_number,
                    vehicle_type: formData.vehicle_type,
                    vehicle_number: formData.vehicle_number,
                    status: formData.status,
                })
                .eq('id', selectedDriver.id);

            if (driverError) throw driverError;

            setMessage({ type: 'success', text: 'Driver updated successfully' });
            handleCloseModal();
            fetchDrivers();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to update driver' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (driver: LogisticDriver) => {
        if (!confirm(`Are you sure you want to delete driver ${driver.driver_name}?`)) return;
        setLoading(true);

        try {
            // Delete user ( cascade might handle it but let's be explicit if needed)
            // Note: Admin might need special permissions or use supebase client with service role
            const { error } = await supabase.from('delivery_drivers').delete().eq('id', driver.id);
            if (error) throw error;

            setMessage({ type: 'success', text: 'Driver deleted successfully' });
            fetchDrivers();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to delete driver' });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (driver: LogisticDriver) => {
        setSelectedDriver(driver);
        setIsEditing(true);
        setFormData({
            email: driver.profile?.email || '',
            driver_name: driver.driver_name,
            phone_number: driver.phone_number,
            vehicle_type: driver.vehicle_type,
            vehicle_number: driver.vehicle_number,
            status: driver.status,
            is_active: driver.profile?.is_active ?? true,
        });
        setShowModal(true);
    };

    const handleView = (driver: LogisticDriver) => {
        setSelectedDriver(driver);
        setShowViewModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setShowViewModal(false);
        setSelectedDriver(null);
        setIsEditing(false);
        setFormData({
            email: '',
            password: '',
            driver_name: '',
            phone_number: '',
            vehicle_type: 'motorcycle',
            vehicle_number: '',
            status: 'pending',
            is_active: true,
        });
    };

    const filteredDrivers = drivers.filter(d =>
        d.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.phone_number.includes(searchTerm)
    );

    const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
    const textPrimary = isDark ? 'text-gray-100' : 'text-gray-900';
    const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
    const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

    return (
        <AdminLayout>
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className={`text-3xl font-bold ${textPrimary}`}>Logistic Management</h1>
                        <p className={textSecondary}>Manage delivery drivers and their fleet status</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-green-600 text-white rounded-lg hover:from-cyan-700 hover:to-green-700 transition"
                    >
                        <Plus className="h-5 w-5" />
                        <span>Add Driver</span>
                    </button>
                </div>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${message.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>{message.text}</span>
                    <button onClick={() => setMessage(null)} className="ml-auto">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            <div className={`${cardBg} rounded-lg shadow-sm p-6 mb-6`}>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="relative flex-1">
                        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${textSecondary} h-5 w-5`} />
                        <input
                            type="text"
                            placeholder="Search by name, email or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'}`}
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className={`px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'}`}
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending Verification</option>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className={`${cardBg} rounded-lg shadow-sm overflow-hidden`}>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className={isDark ? 'bg-gray-700' : 'bg-gray-50'}>
                            <tr>
                                <th className={`px-6 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Driver</th>
                                <th className={`px-6 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Vehicle</th>
                                <th className={`px-6 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Status</th>
                                <th className={`px-6 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Availability</th>
                                <th className={`px-6 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                            {filteredDrivers.map((driver) => (
                                <tr key={driver.id} className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className={`text-sm font-medium ${textPrimary}`}>{driver.driver_name}</div>
                                            <div className={`text-sm ${textSecondary}`}>{driver.profile?.email}</div>
                                            <div className={`text-xs ${textSecondary}`}>{driver.phone_number}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <Truck className="h-4 w-4 mr-2 text-slate-400" />
                                            <div>
                                                <div className={`text-sm font-medium ${textPrimary} capitalize`}>{driver.vehicle_type}</div>
                                                <div className={`text-xs ${textSecondary}`}>{driver.vehicle_number}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${driver.status === 'active' ? 'bg-green-100 text-green-800' :
                                            driver.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {driver.status.charAt(0).toUpperCase() + driver.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className={`w-2 h-2 rounded-full mr-2 ${driver.is_available ? 'bg-green-500' : 'bg-gray-300'}`} />
                                            <span className={`text-sm ${textSecondary}`}>{driver.is_available ? 'Online' : 'Offline'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-2">
                                            <button onClick={() => handleView(driver)} className="text-blue-600 hover:text-blue-900"><Eye className="h-5 w-5" /></button>
                                            <button onClick={() => handleEdit(driver)} className="text-cyan-600 hover:text-cyan-900"><Edit className="h-5 w-5" /></button>
                                            <button onClick={() => handleDelete(driver)} className="text-red-600 hover:text-red-900"><Trash2 className="h-5 w-5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className={`${cardBg} rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
                        <div className={`p-6 border-b ${borderColor} flex items-center justify-between`}>
                            <h2 className={`text-2xl font-bold ${textPrimary}`}>{isEditing ? 'Edit Driver' : 'Add New Driver'}</h2>
                            <button onClick={handleCloseModal} className={`${textSecondary} hover:text-gray-600 focus:outline-none`}><X className="h-6 w-6" /></button>
                        </div>

                        <form onSubmit={isEditing ? handleUpdate : handleCreate} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className={`block text-sm font-medium ${textPrimary} mb-1`}>Email *</label>
                                    <input
                                        type="email"
                                        required
                                        disabled={isEditing}
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'}`}
                                        placeholder="e.g. driver@email.com"
                                    />
                                </div>
                                {!isEditing && (
                                    <div>
                                        <label className={`block text-sm font-medium ${textPrimary} mb-1`}>Password *</label>
                                        <input
                                            type="password"
                                            required
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'}`}
                                            minLength={6}
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className={`block text-sm font-medium ${textPrimary} mb-1`}>Full Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.driver_name}
                                        onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                                        className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'}`}
                                        placeholder="e.g. Driver Name"
                                    />
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium ${textPrimary} mb-1`}>Phone Number *</label>
                                    <input
                                        type="tel"
                                        required
                                        value={formData.phone_number}
                                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                        className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'}`}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium ${textPrimary} mb-1`}>Vehicle Type</label>
                                    <select
                                        value={formData.vehicle_type}
                                        onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                                        className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'}`}
                                    >
                                        <option value="motorcycle">Motorcycle</option>
                                        <option value="car">Car</option>
                                        <option value="van">Van</option>
                                        <option value="truck">Truck</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium ${textPrimary} mb-1`}>License Plate</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.vehicle_number}
                                        onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                                        className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'}`}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium ${textPrimary} mb-1`}>Account Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'}`}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="active">Active</option>
                                        <option value="suspended">Suspended</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center mb-6">
                                <input
                                    type="checkbox"
                                    id="driver_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="rounded text-cyan-600 focus:ring-cyan-500 h-4 w-4"
                                />
                                <label htmlFor="driver_active" className={`ml-2 text-sm ${textPrimary}`}>User Profile Active</label>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button type="button" onClick={handleCloseModal} className={`px-4 py-2 border ${borderColor} rounded-lg hover:bg-gray-100 transition`}>Cancel</button>
                                <button type="submit" disabled={loading} className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-green-600 text-white rounded-lg hover:from-cyan-700 hover:to-green-700 transition disabled:opacity-50">
                                    {loading ? 'Processing...' : isEditing ? 'Update Driver' : 'Create Driver'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showViewModal && selectedDriver && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className={`${cardBg} rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
                        <div className={`p-6 border-b ${borderColor} flex items-center justify-between`}>
                            <h2 className={`text-2xl font-bold ${textPrimary}`}>Driver Details</h2>
                            <button onClick={handleCloseModal} className={`${textSecondary} hover:text-gray-600`}><X className="h-6 w-6" /></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-6 pb-6 border-b border-gray-100 flex-wrap">
                                <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center">
                                    <Truck className="h-10 w-10 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className={`text-2xl font-bold ${textPrimary}`}>{selectedDriver.driver_name}</h3>
                                    <p className={textSecondary}>{selectedDriver.profile?.email}</p>
                                    <span className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedDriver.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {selectedDriver.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p className={`text-xs font-bold ${textSecondary} uppercase`}>Phone Number</p>
                                    <p className={`text-sm font-medium ${textPrimary}`}>{selectedDriver.phone_number}</p>
                                </div>
                                <div>
                                    <p className={`text-xs font-bold ${textSecondary} uppercase`}>Vehicle Info</p>
                                    <p className={`text-sm font-medium ${textPrimary} capitalize`}>{selectedDriver.vehicle_type} • {selectedDriver.vehicle_number}</p>
                                </div>
                                <div>
                                    <p className={`text-xs font-bold ${textSecondary} uppercase`}>Availability</p>
                                    <p className={`text-sm font-medium ${selectedDriver.is_available ? 'text-green-600' : 'text-slate-500'}`}>
                                        {selectedDriver.is_available ? 'Currently Online' : 'Currently Offline'}
                                    </p>
                                </div>
                                <div>
                                    <p className={`text-xs font-bold ${textSecondary} uppercase`}>Joined</p>
                                    <p className={`text-sm font-medium ${textPrimary}`}>{new Date(selectedDriver.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

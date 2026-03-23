import { useEffect, useState } from 'react';
import {
  Truck,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  MoreVertical,
  ChevronRight,
  MapPin,
  Phone,
  User,
  Building2,
  Zap,
  AlertCircle,
  X,
  Plus
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AdminLayout } from '../../components/AdminLayout';
import { useTheme } from '../../contexts/ThemeContext';
import { Pagination } from '../../components/Pagination';

interface Delivery {
  id: string;
  tracking_number: string;
  delivery_status: string;
  delivery_address: string;
  customer_phone: string;
  created_at: string;
  driver_id: string | null;
  customer: {
    full_name: string;
    email: string;
  };
  vendor: {
    full_name: string;
  };
  driver?: {
    driver_name: string;
  }
}

interface Driver {
  id: string;
  driver_name: string;
}

export function DeliveryManagement() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const cardBg = isDark ? 'bg-slate-800' : 'bg-white';
  const borderColor = isDark ? 'border-slate-700' : 'border-slate-200';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-500';

  useEffect(() => {
    fetchDeliveries();
    fetchDrivers();
  }, [filter, currentPage, searchTerm]);

  // Reset to first page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm]);

  const fetchDeliveries = async () => {
    setLoading(true);
    let query = supabase
      .from('deliveries')
      .select(`
        id,
        tracking_number,
        delivery_status,
        delivery_address,
        customer_phone,
        created_at,
        driver_id,
        customer:profiles!customer_id(full_name, email),
        vendor:profiles!vendor_id(full_name),
        driver:delivery_drivers(driver_name)
      `, { count: 'exact' });

    if (filter !== 'all') {
      query = query.eq('delivery_status', filter);
    }

    if (searchTerm) {
      query = query.or(`tracking_number.ilike.%${searchTerm}%,delivery_address.ilike.%${searchTerm}%`);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

    if (!error) {
      setDeliveries((data as any) || []);
      setTotalItems(count || 0);
    }
    setLoading(false);
  };

  const fetchDrivers = async () => {
    const { data } = await supabase
      .from('delivery_drivers')
      .select('id, driver_name');
    setDrivers(data || []);
  };

  const handleAssignDriver = async () => {
    if (!selectedDelivery || !selectedDriverId) return;

    const { error } = await supabase
      .from('deliveries')
      .update({
        driver_id: selectedDriverId,
        delivery_status: 'assigned'
      })
      .eq('id', selectedDelivery.id);

    if (!error) {
      setShowAssignModal(false);
      fetchDeliveries();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'in_transit': return <Truck className="h-4 w-4" />;
      case 'picked_up': return <Package className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColors = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'in_transit': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'picked_up': return 'bg-violet-500/10 text-violet-600 border-violet-500/20';
      case 'pending': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'cancelled': return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    }
  };

  const stats = {
    total: totalItems,
    pending: deliveries.filter(d => d.delivery_status === 'pending').length, // This might be slightly inaccurate for the whole DB but okay for local context
    in_transit: deliveries.filter(d => ['in_transit', 'picked_up'].includes(d.delivery_status)).length,
    delivered: deliveries.filter(d => d.delivery_status === 'delivered').length,
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <h1 className={`text-xl font-bold tracking-tight ${textPrimary}`}>Delivery Tracker</h1>
            </div>
            <p className={`${textSecondary} text-xs font-medium`}>Monitoring and logistics intelligence dashboard.</p>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {['all', 'pending', 'in_transit', 'delivered'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${filter === s
                  ? 'bg-white dark:bg-slate-700 text-cyan-600 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Shipments', value: stats.total, icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
            { label: 'Waitlist', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
            { label: 'Live Transit', value: stats.in_transit, icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Success Ops', value: stats.delivered, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          ].map((stat, i) => (
            <div key={i} className={`${cardBg} p-4 rounded-xl border ${borderColor} shadow-sm group hover:scale-[1.01] transition-all`}>
              <div className={`w-8 h-8 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
              <h4 className={`text-xl font-bold ${textPrimary} tracking-tight`}>{stat.value}</h4>
            </div>
          ))}
        </div>

        {/* Search & Action */}
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${textSecondary} h-4 w-4`} />
          <input
            type="text"
            placeholder="Search by ID, Customer, or Address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 ${cardBg} border ${borderColor} rounded-lg focus:ring-2 focus:ring-cyan-500/10 outline-none font-medium text-xs ${textPrimary} placeholder:text-slate-400 shadow-sm`}
          />
        </div>

        {/* Table/List View */}
        <div className={`${cardBg} rounded-xl border ${borderColor} shadow-sm overflow-hidden`}>
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-cyan-600/20 border-t-cyan-600 rounded-full animate-spin"></div>
              <p className="text-xs font-bold text-slate-400">Fetching Live Stream...</p>
            </div>
          ) : deliveries.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                <Truck className="h-6 w-6 text-slate-300" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-gray-100 text-sm">No matching deliveries</h3>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className={`${isDark ? 'bg-slate-700/50' : 'bg-slate-50/50'} border-b ${borderColor}`}>
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status & Tracking</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entity Pair</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Courier Assignment</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${borderColor}`}>
                  {deliveries.map((delivery) => (
                    <tr key={delivery.id} className="hover:bg-cyan-500/5 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${getStatusColors(delivery.delivery_status)}`}>
                            {getStatusIcon(delivery.delivery_status)}
                          </div>
                          <div>
                            <p className="font-mono text-[10px] font-bold text-cyan-600 tracking-tighter">#{delivery.tracking_number}</p>
                            <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${getStatusColors(delivery.delivery_status)}`}>
                              {delivery.delivery_status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-slate-400" />
                            <p className={`text-xs font-bold ${textPrimary}`}>{delivery.customer.full_name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3 w-3 text-slate-400" />
                            <p className={`text-[10px] font-bold ${textSecondary}`}>{delivery.vendor.full_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {delivery.driver ? (
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center">
                              <User className="h-3.5 w-3.5 text-slate-400" />
                            </div>
                            <div>
                              <p className={`text-xs font-bold ${textPrimary}`}>{delivery.driver.driver_name}</p>
                              <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Authorized Courier</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-rose-500/50 italic text-[10px] font-bold">
                            <AlertCircle className="h-3 w-3" />
                            Unassigned
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                            <MoreVertical className="h-3.5 w-3.5 text-slate-400" />
                          </button>
                          {delivery.delivery_status === 'pending' && (
                            <button
                              onClick={() => {
                                setSelectedDelivery(delivery);
                                setShowAssignModal(true);
                              }}
                              className="px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all shadow-sm"
                            >
                              Dispatch
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-center p-8 border-t border-slate-200 dark:border-slate-700">
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className={`${cardBg} rounded-xl shadow-2xl max-w-sm w-full p-6 border ${borderColor}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center text-cyan-600">
                  <Zap className="h-4 w-4 flash" />
                </div>
                <h3 className={`text-lg font-bold tracking-tight ${textPrimary}`}>Dispatch Assignment</h3>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border ${borderColor}">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Target Package</p>
                <p className={`text-xs font-bold ${textPrimary}`}>#{selectedDelivery?.tracking_number}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <MapPin className="h-3 w-3 text-slate-400" />
                  <p className="text-[9px] text-slate-500 truncate">{selectedDelivery?.delivery_address}</p>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5 ml-0.5">Courier Personnel</label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${borderColor} outline-none focus:ring-1 focus:ring-cyan-500/20 ${isDark ? 'bg-slate-800 text-gray-100' : 'bg-white'} font-bold text-xs`}
                >
                  <option value="">Select an available driver...</option>
                  {drivers.map(driver => (
                    <option key={driver.id} value={driver.id}>{driver.driver_name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2.5 mt-6">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg text-xs font-bold border ${borderColor} hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignDriver}
                  disabled={!selectedDriverId}
                  className="flex-1 px-4 py-2.5 bg-cyan-600 text-white rounded-lg text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

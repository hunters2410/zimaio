import { useEffect, useState } from 'react';
import { Truck, Package, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');

  useEffect(() => {
    fetchDeliveries();
    fetchDrivers();
  }, [filter]);

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
        customer:profiles!deliveries_customer_id_fkey(full_name, email),
        vendor:profiles!deliveries_vendor_id_fkey(full_name),
        driver:delivery_drivers!deliveries_driver_id_fkey(driver_name)
      `)
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('delivery_status', filter);
    }

    const { data } = await query;
    setDeliveries((data as any) || []);
    setLoading(false);
  };

  const fetchDrivers = async () => {
    const { data } = await supabase
      .from('delivery_drivers')
      .select('id, driver_name')
      .eq('status', 'active');
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
  // ... icons and helpers stay same from previous view_file ...
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_transit':
      case 'picked_up':
        return <Truck className="h-5 w-5 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-700';
      case 'in_transit':
      case 'picked_up':
        return 'bg-blue-100 text-blue-700';
      case 'pending':
      case 'assigned':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const stats = {
    total: deliveries.length,
    pending: deliveries.filter(d => d.delivery_status === 'pending').length,
    in_transit: deliveries.filter(d => ['in_transit', 'picked_up'].includes(d.delivery_status)).length,
    delivered: deliveries.filter(d => d.delivery_status === 'delivered').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-2">Delivery Management</h1>
          <p className="text-green-100">Monitor and manage all deliveries</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Deliveries</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Package className="h-12 w-12 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-12 w-12 text-yellow-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Transit</p>
                <p className="text-3xl font-bold text-blue-600">{stats.in_transit}</p>
              </div>
              <Truck className="h-12 w-12 text-blue-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Delivered</p>
                <p className="text-3xl font-bold text-green-600">{stats.delivered}</p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">All Deliveries</h2>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="picked_up">Picked Up</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            </div>
          ) : deliveries.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p>No deliveries found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Tracking</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Vendor</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Driver</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {deliveries.map((delivery) => (
                    <tr key={delivery.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {getStatusIcon(delivery.delivery_status)}
                          <span className="ml-3 font-mono text-sm">{delivery.tracking_number}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{delivery.customer.full_name}</p>
                          <p className="text-sm text-gray-500">{delivery.customer_phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-900">{delivery.vendor.full_name}</p>
                      </td>
                      <td className="px-6 py-4">
                        {delivery.driver ? (
                          <div className="flex items-center text-green-600">
                            <Truck className="h-4 w-4 mr-1" />
                            <span className="text-sm font-medium">{delivery.driver.driver_name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 italic">Not Assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(delivery.delivery_status)}`}>
                          {formatStatus(delivery.delivery_status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {delivery.delivery_status === 'pending' && (
                          <button
                            onClick={() => {
                              setSelectedDelivery(delivery);
                              setShowAssignModal(true);
                            }}
                            className="text-cyan-600 hover:text-cyan-700 text-sm font-bold flex items-center gap-1"
                          >
                            <Plus className="h-4 w-4" /> Assign Driver
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Assign Driver</h3>
              <button onClick={() => setShowAssignModal(false)}><X className="h-6 w-6 text-gray-400" /></button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Select an available driver for tracking <b>#{selectedDelivery?.tracking_number}</b>
            </p>

            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl mb-6 focus:ring-2 focus:ring-cyan-500 outline-none"
            >
              <option value="">Select a driver...</option>
              {drivers.map(driver => (
                <option key={driver.id} value={driver.id}>{driver.driver_name}</option>
              ))}
            </select>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignDriver}
                disabled={!selectedDriverId}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-600 to-green-600 text-white rounded-xl font-bold disabled:opacity-50"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

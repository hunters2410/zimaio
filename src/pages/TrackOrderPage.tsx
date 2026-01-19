import { useState } from 'react';
import { Search, Package, Truck, CheckCircle, MapPin, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DeliveryInfo {
  id: string;
  tracking_number: string;
  delivery_status: string;
  delivery_address: string;
  customer_phone: string;
  created_at: string;
  pickup_time: string | null;
  delivery_time: string | null;
  delivery_notes: string | null;
  order: {
    total_amount: number;
    order_status: string;
  };
  vendor: {
    full_name: string;
    phone: string;
  };
}

interface TrackingHistory {
  id: string;
  status: string;
  location: string | null;
  notes: string | null;
  created_at: string;
}

export function TrackOrderPage() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [delivery, setDelivery] = useState<DeliveryInfo | null>(null);
  const [trackingHistory, setTrackingHistory] = useState<TrackingHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async () => {
    if (!trackingNumber.trim()) {
      setError('Please enter a tracking number');
      return;
    }

    setLoading(true);
    setError('');
    setDelivery(null);
    setTrackingHistory([]);

    try {
      const { data: deliveryData, error: deliveryError } = await supabase
        .from('deliveries')
        .select(`
          id,
          tracking_number,
          delivery_status,
          delivery_address,
          customer_phone,
          created_at,
          pickup_time,
          delivery_time,
          delivery_notes,
          order:orders(total_amount, order_status),
          vendor:profiles!deliveries_vendor_id_fkey(full_name, phone)
        `)
        .eq('tracking_number', trackingNumber.trim())
        .maybeSingle();

      if (deliveryError) throw deliveryError;

      if (!deliveryData) {
        setError('No delivery found with this tracking number');
        setLoading(false);
        return;
      }

      setDelivery(deliveryData as any);

      const { data: historyData, error: historyError } = await supabase
        .from('delivery_tracking_history')
        .select('*')
        .eq('delivery_id', deliveryData.id)
        .order('created_at', { ascending: false });

      if (historyError) throw historyError;

      setTrackingHistory(historyData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to track order');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'in_transit':
      case 'picked_up':
        return <Truck className="h-6 w-6 text-blue-500" />;
      default:
        return <Package className="h-6 w-6 text-gray-400" />;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-4">Track Your Order</h1>
          <p className="text-green-100">Enter your tracking number to see delivery status</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
                placeholder="Enter tracking number (e.g., TRK123456789)"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={handleTrack}
                disabled={loading}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition flex items-center space-x-2 disabled:opacity-50"
              >
                <Search className="h-5 w-5" />
                <span>{loading ? 'Tracking...' : 'Track'}</span>
              </button>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}
          </div>
        </div>

        {delivery && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Delivery Status</h2>
                  <p className="text-sm text-gray-600">Tracking: {delivery.tracking_number}</p>
                </div>
                <span className={`px-4 py-2 rounded-full font-semibold ${getStatusColor(delivery.delivery_status)}`}>
                  {formatStatus(delivery.delivery_status)}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Delivery Address
                  </h3>
                  <p className="text-gray-900">{delivery.delivery_address}</p>
                  <p className="text-sm text-gray-600 mt-1">{delivery.customer_phone}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Vendor</h3>
                  <p className="text-gray-900">{delivery.vendor.full_name}</p>
                  <p className="text-sm text-gray-600 mt-1">{delivery.vendor.phone}</p>
                </div>

                {delivery.pickup_time && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Picked Up
                    </h3>
                    <p className="text-gray-900">{formatDate(delivery.pickup_time)}</p>
                  </div>
                )}

                {delivery.delivery_time && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Delivered
                    </h3>
                    <p className="text-gray-900">{formatDate(delivery.delivery_time)}</p>
                  </div>
                )}
              </div>

              {delivery.delivery_notes && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Delivery Notes</h3>
                  <p className="text-gray-900">{delivery.delivery_notes}</p>
                </div>
              )}
            </div>

            {trackingHistory.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Tracking History</h2>
                <div className="space-y-4">
                  {trackingHistory.map((item, index) => (
                    <div key={item.id} className="flex">
                      <div className="flex flex-col items-center mr-4">
                        {getStatusIcon(item.status)}
                        {index < trackingHistory.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-300 my-2"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900">{formatStatus(item.status)}</h3>
                          <span className="text-sm text-gray-500">{formatDate(item.created_at)}</span>
                        </div>
                        {item.location && (
                          <p className="text-sm text-gray-600">
                            <MapPin className="h-3 w-3 inline mr-1" />
                            {item.location}
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-sm text-gray-700 mt-1">{item.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Search, Truck, CheckCircle, MapPin, Clock } from 'lucide-react';
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
  driver: {
    driver_name: string;
    phone_number: string;
    vehicle_type: string;
    vehicle_number: string;
  } | null;
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
      const { data, error } = await supabase.rpc('get_delivery_details', {
        p_tracking_number: trackingNumber.trim()
      });

      if (error) throw error;

      if (!data) {
        setError('No delivery found with this tracking number');
        setLoading(false);
        return;
      }

      setDelivery(data.delivery);
      setTrackingHistory(data.history || []);
    } catch (err: any) {
      console.error('Tracking Error:', err);
      setError(err.message || 'Failed to track order');
    } finally {
      setLoading(false);
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50';
      case 'in_transit':
      case 'picked_up':
        return 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 border-cyan-100 dark:border-cyan-800/50';
      case 'pending':
      case 'assigned':
        return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800/50';
      case 'cancelled':
        return 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-800/50';
      default:
        return 'bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-400 border-slate-100 dark:border-slate-800';
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950 text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-5xl font-black uppercase tracking-tighter mb-4">Track Logistics</h1>
          <p className="text-cyan-400 font-bold uppercase tracking-[0.3em] text-[10px]">Real-time Satellite Order Monitoring</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto mb-16">
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl shadow-slate-900/10 p-2 md:p-3 border-2 border-slate-50 dark:border-slate-700">
            <div className="flex flex-col md:flex-row gap-2">
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
                placeholder="Transit ID (e.g. TRK...)"
                className="flex-1 px-6 py-4 bg-transparent dark:text-white font-bold placeholder-slate-400 outline-none"
              />
              <button
                onClick={handleTrack}
                disabled={loading}
                className="px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                <Search className="h-4 w-4" />
                <span>{loading ? 'Decrypting...' : 'Scan'}</span>
              </button>
            </div>
          </div>
          {error && (
            <div className="mt-6 p-4 bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-100 dark:border-rose-800/50 rounded-2xl text-rose-700 dark:text-rose-400 text-xs font-black uppercase text-center tracking-widest animate-in slide-in-from-top-4">
              {error}
            </div>
          )}
        </div>

        {delivery && (
          <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border-2 border-slate-50 dark:border-slate-700 shadow-xl overflow-hidden p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">Manifest Summary</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
                    Transit ID: {delivery.tracking_number}
                  </p>
                </div>
                <span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border-2 shadow-sm ${getStatusColor(delivery.delivery_status)}`}>
                  {formatStatus(delivery.delivery_status)}
                </span>
              </div>

              <div className="grid md:grid-cols-3 gap-10">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-cyan-500" />
                      Destination
                    </h3>
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase leading-relaxed">{delivery.delivery_address}</p>
                    <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">{delivery.customer_phone}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Origin Vendor</h3>
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase">{delivery.vendor.full_name}</p>
                    <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">{delivery.vendor.phone}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {delivery.driver && (
                    <div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Truck className="h-3 w-3 text-cyan-500" />
                        Logistics Envoy
                      </h3>
                      <p className="text-sm font-black text-slate-900 dark:text-white uppercase">{delivery.driver.driver_name}</p>
                      <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">{delivery.driver.vehicle_type} • {delivery.driver.vehicle_number}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-12 pt-10 border-t-2 border-slate-50 dark:border-slate-700 grid md:grid-cols-2 gap-8">
                {delivery.pickup_time && (
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border-2 border-slate-100 dark:border-slate-800">
                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Clock className="h-3 w-3" /> dispatch logs
                    </h3>
                    <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">{formatDate(delivery.pickup_time)}</p>
                  </div>
                )}
                {delivery.delivery_time && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-3xl border-2 border-emerald-100 dark:border-emerald-800/50">
                    <h3 className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <CheckCircle className="h-3 w-3" /> arrival logs
                    </h3>
                    <p className="text-xs font-black text-emerald-700 dark:text-emerald-300 uppercase">{formatDate(delivery.delivery_time)}</p>
                  </div>
                )}
              </div>
            </div>

            {trackingHistory.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border-2 border-slate-50 dark:border-slate-700 shadow-xl p-8 md:p-12 overflow-hidden">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-10">Neural History Feed</h2>
                <div className="relative">
                  <div className="absolute left-3 top-0 bottom-0 w-1 bg-slate-100 dark:bg-slate-700 rounded-full"></div>
                  <div className="space-y-10">
                    {trackingHistory.map((item) => (
                      <div key={item.id} className="relative pl-12">
                        <div className="absolute left-0 top-1 p-1 bg-white dark:bg-slate-800 rounded-full z-10">
                          <div className={`w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${item.status === 'delivered' ? 'bg-emerald-500' : 'bg-cyan-500'}`}></div>
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{formatStatus(item.status)}</h3>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formatDate(item.created_at)}</span>
                        </div>
                        {item.location && (
                          <p className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <MapPin className="h-2.5 w-2.5" />
                            {item.location}
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">{item.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

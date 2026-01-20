import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Check,
  Zap,
  XCircle
} from 'lucide-react';

export function VendorPackageManagement() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<any[]>([]);
  const [currentPackageId, setCurrentPackageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Packages
      const { data: pkgs, error: pkgError } = await supabase
        .from('vendor_packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (pkgError) throw pkgError;
      setPackages(pkgs || []);

      // 2. Fetch User & Vendor
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: vendor } = await supabase
        .from('vendor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (vendor) {
        setVendorId(user.id);

        // 3. Fetch Subscription
        const { data: subscription } = await supabase
          .from('vendor_subscriptions')
          .select('package_id')
          .eq('vendor_id', vendor.id)
          .maybeSingle();

        if (subscription) {
          setCurrentPackageId(subscription.package_id);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPackageColor = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('starter')) return 'emerald';
    if (lower.includes('pro')) return 'blue';
    if (lower.includes('elite')) return 'purple';
    return 'gray';
  };

  const getFeatures = (pkg: any) => {
    const features = [];
    if (pkg.product_limit >= 999999) features.push('Unlimited Products');
    else features.push(`Up to ${pkg.product_limit} Products`);

    if (pkg.has_priority_support) features.push('24/7 Dedicated Support');
    else features.push('Standard Support');

    if (pkg.has_analytics_access) features.push('Advanced Analytics');
    if (pkg.has_ads_access) features.push('Ads Access');
    if (pkg.has_pos_access) features.push('POS Access');
    if (pkg.has_wallet_management) features.push('Wallet Management');
    if (pkg.has_withdraw_management) features.push('Fast Withdrawals');
    if (pkg.has_promotion_access) features.push('Product Promotions');

    return features;
  };

  const handleUpgrade = async (packageId: string) => {
    if (packageId === currentPackageId) return;

    const selectedPkg = packages.find(p => p.id === packageId);
    if (!selectedPkg) return;

    // Check if Paid Package
    if (selectedPkg.price_monthly > 0) {
      navigate(`/vendor/payment?packageId=${packageId}&plan=${selectedPkg.name}`);
      return;
    }

    // Free Package Logic
    setUpdating(packageId);
    try {
      const { error } = await supabase
        .from('vendor_subscriptions')
        .upsert({
          vendor_id: vendorId!,
          package_id: packageId,
          status: 'active',
          billing_cycle: 'monthly'
        }, { onConflict: 'vendor_id' });

      if (error) throw error;

      setCurrentPackageId(packageId);
      setMessage({ type: 'success', text: `Successfully switched to ${selectedPkg.name}.` });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        <p className="text-gray-500 text-sm font-medium">Syncing packages...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Vendor Packages</h2>
          <p className="text-xs text-gray-500 mt-1">Select the plan that best fits your business growth.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-100">
          <Zap className="w-3 h-3" />
          {packages.find(p => p.id === currentPackageId)?.price_monthly === 0 ? (
            <span>Lifetime Access</span>
          ) : (
            <span>Next Billing: {new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString()}</span>
          )}
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl flex items-center justify-between ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5" />
            <span className="text-sm font-bold">{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-gray-600">
            <XCircle />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {packages.map((pkg) => {
          const isCurrent = currentPackageId === pkg.id;
          const color = getPackageColor(pkg.name);
          const features = getFeatures(pkg);

          return (
            <div
              key={pkg.id}
              className={`relative bg-white rounded-[32px] border transition-all duration-500 overflow-hidden flex flex-col p-8 ${isCurrent
                ? 'border-emerald-500 ring-4 ring-emerald-500/10 shadow-xl'
                : 'border-gray-100 hover:border-emerald-200 hover:shadow-2xl hover:shadow-gray-200/50'
                }`}
            >
              {pkg.sort_order === 2 && (
                <div className="absolute top-0 right-0 bg-emerald-600 text-white px-6 py-2 rounded-bl-3xl text-[10px] font-black uppercase tracking-widest">
                  Best Value
                </div>
              )}

              {isCurrent && (
                <div className="mb-6 flex">
                  <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">Current active plan</span>
                </div>
              )}

              <div className="mb-8">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{pkg.name.split(' ')[0]}</p>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">{pkg.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-gray-900 tabular-nums">${pkg.price_monthly}</span>
                  <span className="text-gray-400 text-sm font-bold uppercase tracking-widest">/ Month</span>
                </div>
              </div>

              <div className="space-y-4 mb-10 flex-1">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">What's included:</p>
                {features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isCurrent ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-50 text-gray-300'}`}>
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </div>
                    <span className="text-xs font-bold text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                disabled={isCurrent || (updating === pkg.id)}
                onClick={() => handleUpgrade(pkg.id)}
                className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${isCurrent
                  ? 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-100'
                  : color === 'blue'
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200 active:scale-95'
                    : 'bg-gray-900 text-white hover:bg-black shadow-lg shadow-gray-200 active:scale-95'
                  }`}
              >
                {updating === pkg.id ? 'Processing...' : isCurrent ? 'Active Plan' : 'Select Plan'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}



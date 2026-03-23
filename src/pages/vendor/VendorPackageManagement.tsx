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
  const [subscription, setSubscription] = useState<any>(null);
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
        const { data: sub } = await supabase
          .from('vendor_subscriptions')
          .select('*, package:vendor_packages(*)')
          .eq('vendor_id', user.id)
          .maybeSingle();

        if (sub) {
          setSubscription(sub);
          setCurrentPackageId(sub.package_id);
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
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500/20 border-t-emerald-600 shadow-xl"></div>
        <p className="text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-[10px]">Syncing packages...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Vendor Packages</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Select the plan that best fits your business growth.</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all shadow-sm ${subscription?.status === 'expired'
          ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800 animate-pulse'
          : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'}`}>
          <Zap className="w-3 h-3" />
          {packages.find(p => p.id === currentPackageId)?.price_monthly === 0 ? (
            <span>Lifetime Access</span>
          ) : (
            <span>
              {subscription?.status === 'expired' ? 'Subscription Expired' : 'Next Billing'}: {subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : 'N/A'}
            </span>
          )}
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-[20px] flex items-center justify-between animate-in fade-in slide-in-from-top-2 border ${message.type === 'success'
          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'
          : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800'
          }`}>
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5" />
            <span className="text-[11px] font-black uppercase tracking-widest">{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors text-slate-400 dark:text-slate-500">
            <XCircle className="w-5 h-5" />
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
              className={`relative bg-white dark:bg-slate-900 rounded-[32px] border transition-all duration-500 overflow-hidden flex flex-col p-8 ${isCurrent
                ? 'border-emerald-500 ring-4 ring-emerald-500/10 shadow-xl'
                : 'border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-purple-500/5'
                }`}
            >
              {pkg.sort_order === 2 && (
                <div className="absolute top-0 right-0 bg-emerald-600 text-white px-6 py-2 rounded-bl-3xl text-[10px] font-black uppercase tracking-widest">
                  Best Value
                </div>
              )}

              {isCurrent && (
                <div className="mb-6 flex">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${subscription?.status === 'expired'
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800'
                    : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'
                    }`}>
                    {subscription?.status === 'expired' ? 'Plan Expired' : 'Current active plan'}
                  </span>
                </div>
              )}

              <div className="mb-8">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{pkg.name.split(' ')[0]}</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{pkg.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900 dark:text-white tabular-nums">${pkg.price_monthly}</span>
                  <span className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">/ Month</span>
                </div>
              </div>

              <div className="space-y-4 mb-10 flex-1">
                <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">What's included:</p>
                {features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border border-transparent ${isCurrent
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-800'
                      : 'bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 border-slate-100 dark:border-slate-800'
                      }`}>
                      <Check className="w-2.5 h-2.5" strokeWidth={4} />
                    </div>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                disabled={isCurrent && subscription?.status !== 'expired' || (updating === pkg.id)}
                onClick={() => handleUpgrade(pkg.id)}
                className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 ${isCurrent && subscription?.status !== 'expired'
                    ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-100 dark:border-slate-800'
                    : color === 'purple' || color === 'blue'
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-600/20'
                      : 'bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-950 dark:hover:bg-slate-600 shadow-xl shadow-slate-900/10'
                  }`}
              >
                {updating === pkg.id ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (isCurrent && subscription?.status === 'expired' ? 'Renew Plan' : isCurrent ? 'Active Plan' : 'Select Plan')}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}



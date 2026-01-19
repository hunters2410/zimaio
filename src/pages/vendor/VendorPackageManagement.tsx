import { useEffect, useState } from 'react';
import { Package, Check, X, CreditCard, Zap, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface VendorPackage {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  product_limit: number;
  has_ads_access: boolean;
  has_promotion_access: boolean;
  has_analytics_access: boolean;
  has_priority_support: boolean;
}

interface VendorSubscription {
  id: string;
  package_id: string;
  status: string;
  billing_cycle: string;
  current_period_start: string;
  current_period_end: string;
  package: VendorPackage;
}

export default function VendorPackageManagement() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<VendorPackage[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<VendorSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<VendorPackage | null>(null);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPaymentGateway, setSelectedPaymentGateway] = useState<'stripe' | 'paypal' | 'paynow'>('stripe');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [packagesRes, subscriptionRes] = await Promise.all([
        supabase
          .from('vendor_packages')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('vendor_subscriptions')
          .select(`
            *,
            package:vendor_packages(*)
          `)
          .eq('vendor_id', user?.id)
          .maybeSingle()
      ]);

      if (packagesRes.error) throw packagesRes.error;
      if (subscriptionRes.error) throw subscriptionRes.error;

      setPackages(packagesRes.data || []);
      setCurrentSubscription(subscriptionRes.data as VendorSubscription);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = (pkg: VendorPackage) => {
    setSelectedPackage(pkg);
    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    if (!selectedPackage || !user) return;

    try {
      setLoading(true);

      const amount = selectedBillingCycle === 'monthly' ? selectedPackage.price_monthly : selectedPackage.price_yearly;

      if (amount === 0) {
        await handleFreePackage();
        return;
      }

      const { data: transaction, error: transactionError } = await supabase
        .from('vendor_transactions')
        .insert([{
          vendor_id: user.id,
          subscription_id: currentSubscription?.id,
          package_id: selectedPackage.id,
          amount: amount,
          currency: 'USD',
          payment_gateway: selectedPaymentGateway,
          status: 'pending',
          transaction_type: currentSubscription ? 'upgrade' : 'subscription',
        }])
        .select()
        .single();

      if (transactionError) throw transactionError;

      alert(`Payment initiated via ${selectedPaymentGateway.toUpperCase()}. Transaction ID: ${transaction.id}`);

      setShowPaymentModal(false);
      await fetchData();
    } catch (error: any) {
      console.error('Error processing payment:', error);
      alert('Payment failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFreePackage = async () => {
    if (!selectedPackage || !user) return;

    try {
      const currentDate = new Date();
      const periodEnd = new Date(currentDate);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      if (currentSubscription) {
        const { error } = await supabase
          .from('vendor_subscriptions')
          .update({
            package_id: selectedPackage.id,
            status: 'active',
            billing_cycle: selectedBillingCycle,
            current_period_start: currentDate.toISOString(),
            current_period_end: periodEnd.toISOString(),
          })
          .eq('id', currentSubscription.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('vendor_subscriptions')
          .insert([{
            vendor_id: user.id,
            package_id: selectedPackage.id,
            status: 'active',
            billing_cycle: selectedBillingCycle,
            current_period_start: currentDate.toISOString(),
            current_period_end: periodEnd.toISOString(),
          }]);

        if (error) throw error;
      }

      alert('Package updated successfully!');
      setShowPaymentModal(false);
      await fetchData();
    } catch (error: any) {
      console.error('Error updating package:', error);
      alert('Failed to update package: ' + error.message);
    }
  };

  if (loading && !currentSubscription) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading packages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscription Management</h2>
        <p className="text-gray-600">
          Manage your subscription plan and upgrade to unlock more features
        </p>
      </div>

      {currentSubscription && (
        <div className="bg-gradient-to-r from-cyan-50 to-green-50 border border-cyan-200 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-xl font-bold text-gray-900">
                  {currentSubscription.package.name}
                </h3>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  currentSubscription.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {currentSubscription.status.toUpperCase()}
                </span>
              </div>
              <p className="text-gray-600 mb-3">{currentSubscription.package.description}</p>
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div>
                  <span className="font-semibold">Billing:</span> {currentSubscription.billing_cycle}
                </div>
                <div>
                  <span className="font-semibold">Renews:</span>{' '}
                  {new Date(currentSubscription.current_period_end).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">
                ${currentSubscription.billing_cycle === 'monthly'
                  ? currentSubscription.package.price_monthly
                  : currentSubscription.package.price_yearly}
              </div>
              <div className="text-sm text-gray-600">
                /{currentSubscription.billing_cycle === 'monthly' ? 'month' : 'year'}
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {packages.map((pkg) => {
            const isCurrentPackage = currentSubscription?.package_id === pkg.id;
            const canUpgrade = !isCurrentPackage;

            return (
              <div
                key={pkg.id}
                className={`bg-white border-2 rounded-lg p-6 relative ${
                  isCurrentPackage
                    ? 'border-cyan-600 shadow-lg'
                    : 'border-gray-200 hover:border-cyan-300 hover:shadow-md transition'
                }`}
              >
                {isCurrentPackage && (
                  <div className="absolute top-0 right-0 bg-cyan-600 text-white px-3 py-1 text-xs font-semibold rounded-bl-lg rounded-tr-lg">
                    Current Plan
                  </div>
                )}

                <div className="mb-4">
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h4>
                  <p className="text-sm text-gray-600 mb-4">{pkg.description}</p>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold text-gray-900">
                      ${pkg.price_monthly}
                    </span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  {pkg.price_yearly > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      or ${pkg.price_yearly}/year (save ${((pkg.price_monthly * 12) - pkg.price_yearly).toFixed(2)})
                    </div>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Products</span>
                    <span className="font-semibold">
                      {pkg.product_limit === 999999 ? 'Unlimited' : pkg.product_limit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Ads Access</span>
                    {pkg.has_ads_access ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <X className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Promotions</span>
                    {pkg.has_promotion_access ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <X className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Analytics</span>
                    {pkg.has_analytics_access ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <X className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Priority Support</span>
                    {pkg.has_priority_support ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <X className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </div>

                {canUpgrade && (
                  <button
                    onClick={() => handleUpgrade(pkg)}
                    className="w-full py-2 bg-gradient-to-r from-cyan-600 to-green-600 text-white rounded-lg font-semibold hover:from-cyan-700 hover:to-green-700 transition"
                  >
                    {pkg.price_monthly === 0 ? 'Switch to Free' : 'Upgrade'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showPaymentModal && selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900">
                {selectedPackage.price_monthly === 0 ? 'Switch Package' : 'Upgrade Package'}
              </h3>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">{selectedPackage.name}</h4>
                <p className="text-sm text-gray-600 mb-3">{selectedPackage.description}</p>
              </div>

              {selectedPackage.price_monthly > 0 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Billing Cycle
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setSelectedBillingCycle('monthly')}
                        className={`p-3 border-2 rounded-lg text-center transition ${
                          selectedBillingCycle === 'monthly'
                            ? 'border-cyan-600 bg-cyan-50'
                            : 'border-gray-200 hover:border-cyan-300'
                        }`}
                      >
                        <div className="font-semibold">Monthly</div>
                        <div className="text-2xl font-bold text-gray-900">
                          ${selectedPackage.price_monthly}
                        </div>
                        <div className="text-xs text-gray-600">/month</div>
                      </button>
                      <button
                        onClick={() => setSelectedBillingCycle('yearly')}
                        className={`p-3 border-2 rounded-lg text-center transition ${
                          selectedBillingCycle === 'yearly'
                            ? 'border-cyan-600 bg-cyan-50'
                            : 'border-gray-200 hover:border-cyan-300'
                        }`}
                      >
                        <div className="font-semibold">Yearly</div>
                        <div className="text-2xl font-bold text-gray-900">
                          ${selectedPackage.price_yearly}
                        </div>
                        <div className="text-xs text-green-600">
                          Save ${((selectedPackage.price_monthly * 12) - selectedPackage.price_yearly).toFixed(2)}
                        </div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <div className="space-y-2">
                      <button
                        onClick={() => setSelectedPaymentGateway('stripe')}
                        className={`w-full p-4 border-2 rounded-lg flex items-center space-x-3 transition ${
                          selectedPaymentGateway === 'stripe'
                            ? 'border-cyan-600 bg-cyan-50'
                            : 'border-gray-200 hover:border-cyan-300'
                        }`}
                      >
                        <CreditCard className="h-6 w-6 text-gray-600" />
                        <div className="text-left">
                          <div className="font-semibold">Stripe</div>
                          <div className="text-xs text-gray-600">Credit/Debit Card</div>
                        </div>
                      </button>
                      <button
                        onClick={() => setSelectedPaymentGateway('paypal')}
                        className={`w-full p-4 border-2 rounded-lg flex items-center space-x-3 transition ${
                          selectedPaymentGateway === 'paypal'
                            ? 'border-cyan-600 bg-cyan-50'
                            : 'border-gray-200 hover:border-cyan-300'
                        }`}
                      >
                        <Zap className="h-6 w-6 text-gray-600" />
                        <div className="text-left">
                          <div className="font-semibold">PayPal</div>
                          <div className="text-xs text-gray-600">Fast & Secure</div>
                        </div>
                      </button>
                      <button
                        onClick={() => setSelectedPaymentGateway('paynow')}
                        className={`w-full p-4 border-2 rounded-lg flex items-center space-x-3 transition ${
                          selectedPaymentGateway === 'paynow'
                            ? 'border-cyan-600 bg-cyan-50'
                            : 'border-gray-200 hover:border-cyan-300'
                        }`}
                      >
                        <TrendingUp className="h-6 w-6 text-gray-600" />
                        <div className="text-left">
                          <div className="font-semibold">PayNow</div>
                          <div className="text-xs text-gray-600">Singapore Payment</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="bg-cyan-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>
                        ${selectedBillingCycle === 'monthly'
                          ? selectedPackage.price_monthly
                          : selectedPackage.price_yearly}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-green-600 text-white rounded-lg hover:from-cyan-700 hover:to-green-700 transition disabled:opacity-50"
              >
                {loading ? 'Processing...' : selectedPackage.price_monthly === 0 ? 'Confirm' : 'Pay Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

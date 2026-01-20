import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Package, CheckCircle, TrendingUp, Users, DollarSign, Check, ChevronDown, Search } from 'lucide-react';

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
  is_default: boolean;
}

export function VendorSignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [shopName, setShopName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<VendorPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [acceptedVendorTerms, setAcceptedVendorTerms] = useState(false);
  const [acceptedVendorPrivacy, setAcceptedVendorPrivacy] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPackages();
    fetchContracts();
  }, []);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      setPackages(data || []);
      const defaultPkg = data?.find(pkg => pkg.is_default);
      if (defaultPkg) {
        setSelectedPackage(defaultPkg.id);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const fetchContracts = async () => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .in('contract_type', ['vendor_terms', 'vendor_privacy'])
        .eq('is_active', true);

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!selectedPackage) {
      setError('Please select a package');
      setLoading(false);
      return;
    }

    if (!acceptedVendorTerms || !acceptedVendorPrivacy) {
      setError('Please accept both the Vendor Terms & Conditions and Privacy Policy');
      setLoading(false);
      return;
    }

    const { error: signUpError, data } = await signUp(email, password, fullName, 'vendor');

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data?.user) {
      try {
        const selectedPkg = packages.find(pkg => pkg.id === selectedPackage);
        const currentDate = new Date();
        const periodEnd = new Date(currentDate);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        const { error: subscriptionError } = await supabase
          .from('vendor_subscriptions')
          .insert([{
            vendor_id: data.user.id,
            package_id: selectedPackage,
            status: selectedPkg?.price_monthly === 0 ? 'active' : 'pending',
            billing_cycle: 'monthly',
            current_period_start: currentDate.toISOString(),
            current_period_end: periodEnd.toISOString(),
          }]);

        if (subscriptionError) {
          console.error('Error creating subscription:', subscriptionError);
        }

        const vendorTermsContract = contracts.find(c => c.contract_type === 'vendor_terms');
        const vendorPrivacyContract = contracts.find(c => c.contract_type === 'vendor_privacy');

        if (vendorTermsContract && vendorPrivacyContract) {
          await supabase.from('contract_acceptances').insert([
            {
              user_id: data.user.id,
              contract_id: vendorTermsContract.id,
              ip_address: '',
              user_agent: navigator.userAgent,
            },
            {
              user_id: data.user.id,
              contract_id: vendorPrivacyContract.id,
              ip_address: '',
              user_agent: navigator.userAgent,
            },
          ]);
        }

        navigate('/vendor/dashboard');
      } catch (error) {
        console.error('Error during signup:', error);
        navigate('/vendor/dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-cyan-600 to-green-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <Package className="h-16 w-16 mx-auto mb-4" />
          <h1 className="text-5xl font-bold mb-4">Start Selling on ZimAIO</h1>
          <p className="text-xl text-cyan-50 max-w-2xl mx-auto">
            Join thousands of successful vendors and grow your business with our platform
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Why Sell on ZimAIO?</h2>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-cyan-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-cyan-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Reach Millions of Customers</h3>
                  <p className="text-gray-600">
                    Access a large customer base actively looking for products like yours.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-cyan-100 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-cyan-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Grow Your Business</h3>
                  <p className="text-gray-600">
                    Powerful tools and analytics to help you understand and grow your sales.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-cyan-100 p-3 rounded-lg">
                  <DollarSign className="h-6 w-6 text-cyan-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Flexible Payment Options</h3>
                  <p className="text-gray-600">
                    Multiple payment gateways and quick payouts to your wallet.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-cyan-100 p-3 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-cyan-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Easy to Get Started</h3>
                  <p className="text-gray-600">
                    Simple onboarding process with step-by-step guidance.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-cyan-50 rounded-lg border border-cyan-200">
              <h3 className="font-semibold text-gray-900 mb-4">Getting Started</h3>
              <ol className="space-y-2 text-sm text-gray-600">
                <li>1. Create your vendor account</li>
                <li>2. Set up your shop profile</li>
                <li>3. Submit KYC documents for verification</li>
                <li>4. List your products</li>
                <li>5. Start receiving orders</li>
              </ol>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Vendor Account</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <div className="relative group z-20">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Package *
                  </label>

                  <div
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full bg-white border border-gray-300 rounded-lg p-3 cursor-pointer flex items-center justify-between hover:border-cyan-500 transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900">
                        {packages.find(p => p.id === selectedPackage)?.name || 'Select Package'}
                      </span>
                      <span className={`text-xs font-semibold ${packages.find(p => p.id === selectedPackage)?.price_monthly === 0 ? 'text-green-600' : 'text-gray-500'}`}>
                        {(() => {
                          const pkg = packages.find(p => p.id === selectedPackage);
                          if (!pkg) return 'Choose a plan';
                          return pkg.price_monthly === 0 ? 'Lifetime Free Access' : `$${pkg.price_monthly}/mo`;
                        })()}
                      </span>
                    </div>
                    <ChevronDown size={20} className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden z-50">
                      <div className="p-3 border-b border-gray-100">
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-md border border-gray-200">
                          <Search size={16} className="text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search packages..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm w-full text-gray-700 placeholder-gray-400"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>

                      <div className="max-h-60 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-gray-200">
                        {packages.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(pkg => (
                          <div
                            key={pkg.id}
                            onClick={() => {
                              setSelectedPackage(pkg.id);
                              setIsDropdownOpen(false);
                            }}
                            className={`p-3 rounded-lg cursor-pointer flex items-center justify-between transition-colors ${selectedPackage === pkg.id ? 'bg-cyan-50 text-cyan-700' : 'hover:bg-gray-50 text-gray-700'}`}
                          >
                            <div>
                              <p className="text-sm font-bold">{pkg.name}</p>
                              <p className="text-xs opacity-80">
                                {pkg.price_monthly === 0 ? 'Free' : `$${pkg.price_monthly}/mo`} • {pkg.product_limit === 999999 ? 'Unlmtd' : pkg.product_limit} Prds
                              </p>
                            </div>
                            {selectedPackage === pkg.id && <Check size={16} />}
                          </div>
                        ))}
                        {packages.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                          <div className="p-4 text-center text-sm text-gray-500">No packages found</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-900 mb-2">Vendor Agreements *</p>

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    required
                    checked={acceptedVendorTerms}
                    onChange={(e) => setAcceptedVendorTerms(e.target.checked)}
                    className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 mt-1"
                  />
                  <label className="ml-2 text-sm text-gray-600">
                    I agree to the{' '}
                    <Link to="/vendor-terms" target="_blank" className="text-cyan-600 hover:text-cyan-700 font-semibold underline">
                      Vendor Terms & Conditions
                    </Link>
                  </label>
                </div>

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    required
                    checked={acceptedVendorPrivacy}
                    onChange={(e) => setAcceptedVendorPrivacy(e.target.checked)}
                    className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 mt-1"
                  />
                  <label className="ml-2 text-sm text-gray-600">
                    I have read and accept the{' '}
                    <Link to="/vendor-privacy" target="_blank" className="text-cyan-600 hover:text-cyan-700 font-semibold underline">
                      Vendor Privacy Policy
                    </Link>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-green-600 text-white rounded-lg font-semibold hover:from-cyan-700 hover:to-green-700 transition disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create Vendor Account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-cyan-600 hover:text-cyan-700 font-semibold">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

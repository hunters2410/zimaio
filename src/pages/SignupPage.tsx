import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { supabase } from '../lib/supabase';
import { Package } from 'lucide-react';
import { PuzzleCaptcha } from '../components/PuzzleCaptcha';

export function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('customer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isHuman, setIsHuman] = useState(false);
  const [acceptedCustomerTerms, setAcceptedCustomerTerms] = useState(false);
  const [acceptedCustomerPrivacy, setAcceptedCustomerPrivacy] = useState(false);
  const [contractAcceptance, setContractAcceptance] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);
  const { signUp } = useAuth();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .in('contract_type', ['customer_terms', 'customer_privacy'])
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

    if (!isHuman) {
      setError('Please verify that you are a human');
      setLoading(false);
      return;
    }

    if (role === 'customer' && (!acceptedCustomerTerms || !acceptedCustomerPrivacy)) {
      setError('Please accept both the Customer Terms & Conditions and Privacy Policy');
      setLoading(false);
      return;
    }

    const { error, data } = await signUp(email, password, fullName, role);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      if (data?.user && role === 'customer') {
        const customerTermsContract = contracts.find(c => c.contract_type === 'customer_terms');
        const customerPrivacyContract = contracts.find(c => c.contract_type === 'customer_privacy');

        if (customerTermsContract && customerPrivacyContract) {
          await supabase.from('contract_acceptances').insert([
            {
              user_id: data.user.id,
              contract_id: customerTermsContract.id,
              ip_address: '',
              user_agent: navigator.userAgent,
            },
            {
              user_id: data.user.id,
              contract_id: customerPrivacyContract.id,
              ip_address: '',
              user_agent: navigator.userAgent,
            },
          ]);
        }
      }
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-green-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img
              src={settings.site_logo}
              alt={settings.site_name}
              className="h-12 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'; // Hide if fails
              }}
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Join {settings.site_name} today</p>
        </div>

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
              placeholder="collen hunters"
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
              placeholder="you@example.com"
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
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              I want to
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="customer">Shop as a Customer</option>
              <option value="vendor">Sell as a Vendor</option>
            </select>
          </div>

          {role === 'customer' && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-900 mb-2">Customer Agreements *</p>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  required
                  checked={acceptedCustomerTerms}
                  onChange={(e) => setAcceptedCustomerTerms(e.target.checked)}
                  className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 mt-1"
                />
                <label className="ml-2 text-sm text-gray-600">
                  I agree to the{' '}
                  <Link to="/contract/customer_terms" target="_blank" className="text-cyan-600 hover:text-cyan-700 font-semibold underline">
                    Customer Terms & Conditions
                  </Link>
                </label>
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  required
                  checked={acceptedCustomerPrivacy}
                  onChange={(e) => setAcceptedCustomerPrivacy(e.target.checked)}
                  className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 mt-1"
                />
                <label className="ml-2 text-sm text-gray-600">
                  I have read and accept the{' '}
                  <Link to="/contract/customer_privacy" target="_blank" className="text-cyan-600 hover:text-cyan-700 font-semibold underline">
                    Customer Privacy Policy
                  </Link>
                </label>
              </div>
            </div>
          )}

          <div className="mb-6">
            <PuzzleCaptcha onVerify={setIsHuman} />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-green-600 text-white rounded-lg font-semibold hover:from-cyan-700 hover:to-green-700 transition disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-600 hover:text-cyan-700 font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

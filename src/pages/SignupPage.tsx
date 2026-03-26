import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { supabase } from '../lib/supabase';
import { dispatchTrigger } from '../lib/eventDispatcher';
import { PuzzleCaptcha } from '../components/PuzzleCaptcha';

export function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('customer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isHuman, setIsHuman] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
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
        .in('contract_type', ['terms_and_conditions', 'privacy_policy'])
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

    if (role === 'customer' && (!acceptedTerms || !acceptedPrivacy)) {
      setError('Please accept both the Terms & Conditions and Privacy Policy');
      setLoading(false);
      return;
    }

    const { error, data } = await signUp(email, password, fullName, role);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      if (data?.user && role === 'customer') {
        const termsContract = contracts.find(c => c.contract_type === 'terms_and_conditions');
        const privacyContract = contracts.find(c => c.contract_type === 'privacy_policy');

        if (termsContract && privacyContract) {
          await supabase.from('contract_acceptances').insert([
            {
              user_id: data.user.id,
              contract_id: termsContract.id,
              ip_address: '',
              user_agent: navigator.userAgent,
            },
            {
              user_id: data.user.id,
              contract_id: privacyContract.id,
              ip_address: '',
              user_agent: navigator.userAgent,
            },
          ]);
        }
      }

      // Dispatch "user_registered" to the new universal trigger system
      dispatchTrigger('user_registered', {
        email: email,
        customer_name: fullName.split(' ')[0] || fullName,
        user_name: fullName.split(' ')[0] || fullName,
      });

      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-green-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl dark:shadow-slate-950/40 p-8 border border-gray-100 dark:border-slate-700">
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create Account</h1>
          <p className="text-gray-600 dark:text-gray-400">Join {settings.site_name} today</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
              placeholder="collen hunters"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>


          {role === 'customer' && (
            <div className="space-y-3 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Agreements *</p>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  required
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="rounded border-gray-300 dark:border-slate-600 text-cyan-600 focus:ring-cyan-500 bg-white dark:bg-slate-700 mt-1"
                />
                <label className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  I agree to the{' '}
                  <Link to="/contract/terms_and_conditions" target="_blank" className="text-cyan-600 hover:text-cyan-700 font-semibold underline">
                    Terms & Conditions
                  </Link>
                </label>
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  required
                  checked={acceptedPrivacy}
                  onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                  className="rounded border-gray-300 dark:border-slate-600 text-cyan-600 focus:ring-cyan-500 bg-white dark:bg-slate-700 mt-1"
                />
                <label className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  I have read and accept the{' '}
                  <Link to="/contract/privacy_policy" target="_blank" className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-semibold underline">
                    Privacy Policy
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
          <p className="text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

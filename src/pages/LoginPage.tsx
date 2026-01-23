import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { Package } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Get the latest profile data to redirect correctly
      const { data: { user } } = await import('../lib/supabase').then(m => m.supabase.auth.getUser());

      if (user) {
        const { data: profile } = await import('../lib/supabase').then(m =>
          m.supabase.from('profiles').select('role').eq('id', user.id).single()
        );

        if (profile) {
          switch (profile.role) {
            case 'admin':
              navigate('/admin/dashboard');
              break;
            case 'vendor':
              navigate('/vendor/dashboard');
              break;
            case 'customer':
              navigate('/customer/dashboard');
              break;
            case 'logistic':
              navigate('/logistic/dashboard');
              break;
            default:
              navigate('/');
          }
          return;
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
                e.currentTarget.src = '/zimaio_mineral_edition,_no_background_v1.2.png';
              }}
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your ZimAIO account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500" />
              <span className="ml-2 text-sm text-gray-600">Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-sm text-cyan-600 hover:text-cyan-700">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-gradient-to-r from-cyan-600 to-green-600 text-white rounded-lg font-semibold hover:from-cyan-700 hover:to-green-700 transition disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-4">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="text-cyan-600 hover:text-cyan-700 font-semibold">
              Sign up
            </Link>
          </p>
          <div className="pt-4 border-t border-gray-100">
            <Link to="/logistic-signup" className="text-sm text-green-600 hover:text-green-700 font-bold flex items-center justify-center gap-2">
              <Package className="h-4 w-4" /> Sign Up As Logistic
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

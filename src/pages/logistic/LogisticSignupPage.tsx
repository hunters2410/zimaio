import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSiteSettings } from '../../contexts/SiteSettingsContext';
import { supabase } from '../../lib/supabase';
import { Truck, Shield, Clock, MapPin, CheckCircle } from 'lucide-react';
import { PuzzleCaptcha } from '../../components/PuzzleCaptcha';

export function LogisticSignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [vehicleType, setVehicleType] = useState('motorcycle');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isHuman, setIsHuman] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
    const [contracts, setContracts] = useState<any[]>([]);
    const { settings } = useSiteSettings();

    useEffect(() => {
        const fetchContracts = async () => {
            const { data } = await supabase.from('contracts')
                .select('*')
                .in('contract_type', ['logistic_terms', 'logistic_privacy'])
                .eq('is_active', true);
            setContracts(data || []);
        };
        fetchContracts();
    }, []);

    const { signUp } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!isHuman) {
            setError('Please verify that you are a human');
            setLoading(false);
            return;
        }

        if (!acceptedTerms || !acceptedPrivacy) {
            setError('Please accept both the Terms & Conditions and Privacy Policy');
            setLoading(false);
            return;
        }

        // Sign up user
        const { error: signUpError, data } = await signUp(email, password, fullName, 'logistic');

        if (signUpError) {
            setError(signUpError.message);
            setLoading(false);
            return;
        }

        if (data?.user) {
            const termsContract = contracts.find(c => c.contract_type === 'logistic_terms');
            const privacyContract = contracts.find(c => c.contract_type === 'logistic_privacy');

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
            navigate('/logistic/dashboard');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
            {/* Left Side - Visual */}
            <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950"></div>

                {/* Abstract Background Effects */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse delay-1000"></div>

                <div className="relative z-10 w-full h-full flex flex-col justify-center px-16 text-white">
                    <div className="mb-16">
                        <div className="w-20 h-20 bg-emerald-500/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-8 border border-emerald-500/20 shadow-lg shadow-emerald-900/20">
                            <Truck className="h-10 w-10 text-emerald-400" />
                        </div>
                        <h1 className="text-5xl font-bold mb-6 tracking-tight leading-tight">Drive the Future <br /><span className="text-emerald-400">of Logistics</span></h1>
                        <p className="text-xl text-slate-300 leading-relaxed max-w-lg">
                            Join the premier logistics network connecting vendors to customers with efficiency and reliability.
                        </p>
                    </div>

                    <div className="space-y-8">
                        <div className="flex items-start gap-4 group">
                            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center shrink-0 border border-white/10 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 transition-all">
                                <Clock className="h-6 w-6 text-emerald-200" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-white group-hover:text-emerald-300 transition-colors">Flexible Schedule</h3>
                                <p className="text-slate-400">Choose when you want to work. Be your own boss and manage your time.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 group">
                            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center shrink-0 border border-white/10 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 transition-all">
                                <Shield className="h-6 w-6 text-emerald-200" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-white group-hover:text-emerald-300 transition-colors">Secure Income</h3>
                                <p className="text-slate-400">Reliable weekly payouts directly to your wallet with transparent earnings.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 group">
                            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center shrink-0 border border-white/10 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 transition-all">
                                <MapPin className="h-6 w-6 text-emerald-200" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-white group-hover:text-emerald-300 transition-colors">Local Deliveries</h3>
                                <p className="text-slate-400">Optimize your routes within the city. Less travel time, more deliveries.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
                <div className="max-w-md w-full py-8">
                    {/* LOGO */}
                    <div className="flex flex-col items-center justify-center mb-10">
                        <img
                            src={settings.site_logo}
                            alt={settings.site_name}
                            className="h-16 w-auto object-contain drop-shadow-sm mb-4 hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                                e.currentTarget.src = '/zimaio_mineral_edition,_no_background_v1.2.png';
                            }}
                        />
                        <div className="h-1 w-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
                    </div>

                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Partner Registration</h2>
                        <p className="text-slate-500 dark:text-slate-400">Register your shipping company to join the network.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium flex items-center gap-3 animate-shake">
                            <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1 tracking-wider">Company Name</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none shadow-sm"
                                placeholder="Enter Logistics Company Name"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1 tracking-wider">Email Address (Business)</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none shadow-sm"
                                placeholder="email@example.com"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1 tracking-wider">Business Phone Number</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none shadow-sm"
                                placeholder="+1234567890"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1 tracking-wider">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none shadow-sm"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>

                        <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Partner Agreements *</p>

                            <div className="flex items-start">
                                <input
                                    type="checkbox"
                                    required
                                    checked={acceptedTerms}
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                    className="mt-1 w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                                <label className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                                    I agree to the{' '}
                                    <Link to="/contract/logistic_terms" target="_blank" className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline">
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
                                    className="mt-1 w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                                <label className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                                    I have read the{' '}
                                    <Link to="/contract/logistic_privacy" target="_blank" className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline">
                                        Privacy Policy
                                    </Link>
                                </label>
                            </div>
                        </div>

                        <div className="mb-4">
                            <PuzzleCaptcha onVerify={setIsHuman} />
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-2.5 text-sm rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2 transform active:scale-[0.98]"
                            >
                                {loading ? 'Processing...' : 'Register Company'}
                                <CheckCircle className="h-5 w-5" />
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            Already have a partner account?{' '}
                            <Link to="/login" className="text-emerald-600 font-bold hover:text-emerald-700 hover:underline transition-color">
                                Sign In As Logistic
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

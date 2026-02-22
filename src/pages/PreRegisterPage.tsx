import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { CheckCircle, AlertCircle } from 'lucide-react';

export function PreRegisterPage() {
    const { settings } = useSiteSettings();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [cityArea, setCityArea] = useState('');
    const [interest, setInterest] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const interests = [
        'Electronics',
        'Fashion',
        'Groceries',
        'Home & Garden',
        'Beauty',
        'Becoming a vendor'
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { error: insertError } = await supabase
                .from('customer_pre_registrations')
                .insert([
                    {
                        full_name: fullName,
                        email,
                        company_name: companyName,
                        mobile_number: mobileNumber,
                        city_area: cityArea,
                        interests: interest ? [interest] : []
                    }
                ]);

            if (insertError) throw insertError;

            setSuccess(true);
        } catch (err: any) {
            console.error('Error pre-registering:', err);
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-[#fcfcfc] dark:bg-slate-950 flex items-center justify-center p-4 font-sans antialiased">
                <div className="max-w-sm w-full bg-white dark:bg-slate-900 rounded-lg shadow-sm p-6 text-center border border-gray-100 dark:border-slate-800">
                    <div className="flex justify-center mb-4">
                        <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Registration Successful</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 font-medium">
                        Thank you for pre-registering. We will notify you at <span className="text-gray-900 dark:text-white font-bold">{email}</span> as soon as we launch!
                    </p>
                    <button
                        onClick={() => setSuccess(false)}
                        className="w-full py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded text-xs font-bold hover:opacity-90 transition-opacity"
                    >
                        Done
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fcfcfc] dark:bg-slate-950 flex flex-col items-center justify-center p-4 font-sans antialiased">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-lg border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden p-6 sm:p-8">
                <div className="text-center mb-6">
                    <div className="flex justify-center mb-4">
                        <img
                            src={settings.site_logo}
                            alt={settings.site_name}
                            className="h-16 w-auto object-contain"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Customer Pre-Registration</h1>
                    <p className="text-[11px] font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wider">Secure early access to ZimAIO</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded flex items-center gap-2">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        <p className="text-[11px] font-medium">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-tighter mb-1.5 ml-0.5">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded text-xs text-gray-900 dark:text-white focus:border-cyan-500 focus:outline-none transition-colors"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-tighter mb-1.5 ml-0.5">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded text-xs text-gray-900 dark:text-white focus:border-cyan-500 focus:outline-none transition-colors"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-tighter mb-1.5 ml-0.5">
                                Mobile Number
                            </label>
                            <input
                                type="tel"
                                value={mobileNumber}
                                onChange={(e) => setMobileNumber(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded text-xs text-gray-900 dark:text-white focus:border-cyan-500 focus:outline-none transition-colors"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-tighter mb-1.5 ml-0.5">
                                    City / Area
                                </label>
                                <input
                                    type="text"
                                    value={cityArea}
                                    onChange={(e) => setCityArea(e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded text-xs text-gray-900 dark:text-white focus:border-cyan-500 focus:outline-none transition-colors"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-tighter mb-1.5 ml-0.5">
                                    Company Name
                                </label>
                                <input
                                    type="text"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded text-xs text-gray-900 dark:text-white focus:border-cyan-500 focus:outline-none transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-tighter mb-1.5 ml-0.5">
                                Main Interest
                            </label>
                            <select
                                value={interest}
                                onChange={(e) => setInterest(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded text-xs text-gray-900 dark:text-white focus:border-cyan-500 focus:outline-none transition-colors outline-none"
                            >
                                <option value="">N/A</option>
                                {interests.map((item) => (
                                    <option key={item} value={item}>{item}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-4 py-2.5 bg-gradient-to-r from-cyan-600 to-green-600 hover:from-cyan-700 hover:to-green-700 text-white rounded font-bold text-[11px] uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-cyan-500/10"
                    >
                        {loading ? 'Submitting...' : 'Registration'}
                    </button>
                </form>

                <p className="mt-6 text-center text-[10px] text-gray-400 font-medium font-mono uppercase tracking-tighter">
                    © {new Date().getFullYear()} {settings.site_name} · Exclusive Launch
                </p>
            </div>
        </div>
    );
}

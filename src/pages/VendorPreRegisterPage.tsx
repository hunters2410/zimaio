import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { CheckCircle, AlertCircle } from 'lucide-react';

export function VendorPreRegisterPage() {
    const { settings } = useSiteSettings();
    const [businessName, setBusinessName] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [productCategory, setProductCategory] = useState('');
    const [city, setCity] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const categories = [
        'Electronics',
        'Fashion & Apparel',
        'Groceries & Food',
        'Home & Furniture',
        'Health & Beauty',
        'Automotive',
        'Other'
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { error: insertError } = await supabase
                .from('vendor_pre_registrations')
                .insert([
                    {
                        business_name: businessName,
                        contact_person: contactPerson,
                        phone: phone,
                        email: email,
                        product_category: productCategory,
                        city: city
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
            <div className="min-h-screen bg-[#fcfcfc] dark:bg-slate-950 flex items-center justify-center p-4 font-roboto antialiased">
                <div className="max-w-sm w-full bg-white dark:bg-slate-900 rounded-lg shadow-sm p-6 text-center border border-gray-100 dark:border-slate-800">
                    <div className="flex justify-center mb-4">
                        <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Registration Successful</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 font-medium">
                        Thank you for pre-registering your business, <span className="text-gray-900 dark:text-white font-bold">{businessName}</span>. We will notify you at <span className="text-gray-900 dark:text-white font-bold">{email}</span> with follow-up instructions for full onboarding!
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
        <div className="min-h-screen bg-[#fcfcfc] dark:bg-slate-950 flex flex-col items-center justify-center p-4 font-roboto antialiased">
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
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Vendor Pre-Registration</h1>
                    <p className="text-[11px] font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wider">Become a ZimAIO Seller</p>
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
                                Business Name
                            </label>
                            <input
                                type="text"
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded text-xs text-gray-900 dark:text-white focus:border-cyan-500 focus:outline-none transition-colors"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-tighter mb-1.5 ml-0.5">
                                Contact Person
                            </label>
                            <input
                                type="text"
                                value={contactPerson}
                                onChange={(e) => setContactPerson(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded text-xs text-gray-900 dark:text-white focus:border-cyan-500 focus:outline-none transition-colors"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-tighter mb-1.5 ml-0.5">
                                Phone
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
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

                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-tighter mb-1.5 ml-0.5">
                                    Product Category
                                </label>
                                <select
                                    value={productCategory}
                                    onChange={(e) => setProductCategory(e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded text-xs text-gray-900 dark:text-white focus:border-cyan-500 focus:outline-none transition-colors outline-none"
                                    required
                                >
                                    <option value="">Select a category</option>
                                    {categories.map((item) => (
                                        <option key={item} value={item}>{item}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-tighter mb-1.5 ml-0.5">
                                    City
                                </label>
                                <input
                                    type="text"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded text-xs text-gray-900 dark:text-white focus:border-cyan-500 focus:outline-none transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        <div className="mt-4 space-y-2">
                            <div className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800/50 p-3 rounded border border-gray-100 dark:border-slate-800 leading-relaxed">
                                <span className="font-bold text-gray-700 dark:text-gray-300">Note:</span> We will ask for certain company documents when you fully register to verify. Bank/EcoCash account details will also be requested later during full onboarding.
                            </div>
                            <div className="text-[11px] font-medium text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/10 p-3 rounded border border-cyan-100 dark:border-cyan-900/30 leading-relaxed">
                                <div className="flex items-start gap-2">
                                    <div className="mt-0.5">🚀</div>
                                    <div>
                                        <span className="font-bold">Special Offer:</span> Pre-Register and get <span className="font-bold">3 months free</span> of the most premium package. Register whenever after launch and get <span className="font-bold">2 months</span> of the middle package.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-4 py-2.5 bg-gradient-to-r from-cyan-600 to-green-600 hover:from-cyan-700 hover:to-green-700 text-white rounded font-bold text-[11px] uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-cyan-500/10"
                    >
                        {loading ? 'Submitting...' : 'Vendor Registration'}
                    </button>
                </form>

                <p className="mt-6 text-center text-[10px] text-gray-400 font-medium font-roboto uppercase tracking-tighter">
                    © {new Date().getFullYear()} {settings.site_name} · Exclusive Launch
                </p>
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
    ShieldCheck,
    Upload,
    CheckCircle,
    AlertCircle,
    FileText,
    User,
    Store,
    Clock,
    ArrowRight
} from 'lucide-react';

export function VendorKYC() {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [kycData, setKycData] = useState<any>(null);
    const [status, setStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchKYCStatus();
    }, [profile]);

    const fetchKYCStatus = async () => {
        if (!profile?.id) return;
        try {
            const { data } = await supabase
                .from('vendor_profiles')
                .select('kyc_status, kyc_details')
                .eq('user_id', profile.id)
                .maybeSingle();

            if (data) {
                setStatus(data.kyc_status as any || 'none');
                setKycData(data.kyc_details);
            }
        } catch (err) {
            console.error('Error fetching KYC:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);

        const formData = new FormData(e.target as HTMLFormElement);
        const details = {
            full_name: formData.get('full_name'),
            id_number: formData.get('id_number'),
            business_reg: formData.get('business_reg'),
            tax_number: formData.get('tax_number'),
            address: formData.get('address'),
            submitted_at: new Date().toISOString()
        };

        try {
            const { error } = await supabase
                .from('vendor_profiles')
                .update({
                    kyc_status: 'pending',
                    kyc_details: details,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', profile?.id);

            if (error) throw error;

            setStatus('pending');
            setKycData(details);
            setMessage({ type: 'success', text: 'KYC documents submitted successfully for review.' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-gray-100">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Business Verification</h2>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Trust & Security • Identity Management • Compliance</p>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] border transition-all shadow-sm ${status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    status === 'pending' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        status === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                            'bg-gray-50 text-gray-500 border-gray-100'
                    }`}>
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${status === 'approved' ? 'bg-emerald-500' :
                        status === 'pending' ? 'bg-blue-500' :
                            status === 'rejected' ? 'bg-red-500' :
                                'bg-gray-400'
                        }`} />
                    {status === 'none' ? 'Verification Required' : status}
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl flex items-center justify-between animate-in zoom-in duration-300 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-800 border border-red-100'}`}>
                    <div className="flex items-center gap-3">
                        {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span className="text-xs font-black uppercase tracking-tight">{message.text}</span>
                    </div>
                </div>
            )}

            {status === 'approved' ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center space-y-6 shadow-sm">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
                        <ShieldCheck size={32} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Identity Verified</h3>
                        <p className="text-gray-500 max-w-sm mx-auto font-bold text-sm">Your business has cleared all compliance checks. You now have priority access to all gateway features.</p>
                    </div>
                </div>
            ) : status === 'pending' ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center space-y-6 shadow-sm">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto text-blue-600 animate-pulse">
                        <Clock size={32} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Review in Progress</h3>
                        <p className="text-gray-500 max-w-sm mx-auto font-bold tracking-tight text-sm">Our compliance officers are verifying your documents. This typically takes 24 business hours.</p>
                    </div>

                    <div className="pt-8 border-t border-gray-50 max-w-md mx-auto">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Transmission Snapshot</h4>
                        <div className="space-y-2 text-left bg-gray-50 p-6 rounded-xl border border-gray-100">
                            {[
                                { label: 'Primary Contact', value: kycData?.full_name },
                                { label: 'ID/Passport', value: kycData?.id_number },
                                { label: 'Entity ID', value: kycData?.business_reg }
                            ].map((item, idx) => (
                                <div key={idx} className="flex flex-col gap-1">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.label}</span>
                                    <span className="text-xs font-black text-gray-900">{item.value || 'N/A'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm transition-all">
                    <div className="p-6 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600 border border-gray-100">
                            <FileText size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-gray-900 tracking-tighter uppercase">Legal Disclosure</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Submit authentic documents to enable withdrawals.</p>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Representative Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            name="full_name"
                                            required
                                            placeholder="Legal Representative Name"
                                            className="w-full bg-gray-50 border-gray-200 border focus:border-blue-500 focus:bg-white rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold transition-all outline-none placeholder:font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Government ID Number</label>
                                    <div className="relative group">
                                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            name="id_number"
                                            required
                                            placeholder="National ID / Passport #"
                                            className="w-full bg-gray-50 border-gray-200 border focus:border-blue-500 focus:bg-white rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold transition-all outline-none placeholder:font-medium"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Business Registration</label>
                                    <div className="relative group">
                                        <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            name="business_reg"
                                            required
                                            placeholder="Certificate Number"
                                            className="w-full bg-gray-50 border-gray-200 border focus:border-blue-500 focus:bg-white rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold transition-all outline-none placeholder:font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Tax Identification (TIN)</label>
                                    <div className="relative group">
                                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            name="tax_number"
                                            required
                                            placeholder="BP# / TIN#"
                                            className="w-full bg-gray-50 border-gray-200 border focus:border-blue-500 focus:bg-white rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold transition-all outline-none placeholder:font-medium"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Physical Trading Address</label>
                            <textarea
                                name="address"
                                required
                                rows={2}
                                placeholder="Headquarters physical address..."
                                className="w-full bg-gray-50 border-gray-200 border focus:border-blue-500 focus:bg-white rounded-xl p-4 text-sm font-bold transition-all outline-none resize-none placeholder:font-medium"
                            />
                        </div>

                        <div className="bg-blue-50/50 rounded-2xl border border-blue-100/50 p-6 flex flex-col items-center text-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600 border border-blue-50">
                                <Upload size={20} />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-base font-black text-gray-900 uppercase tracking-tighter">Document Transmission</h4>
                                <p className="text-xs text-gray-500 max-w-sm mx-auto font-bold">Please attach your ID scan and Business Registration in a single ZIP or high-res PDF.</p>
                            </div>
                            <input type="file" className="hidden" id="kyc-files" />
                            <label htmlFor="kyc-files" className="cursor-pointer bg-white border border-gray-200 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm text-gray-700">
                                Select Transmission
                            </label>
                        </div>
                    </div>

                    <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-6">
                        <div className="flex items-start gap-2 max-w-sm text-center sm:text-left">
                            <ShieldCheck className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                            <p className="text-[10px] font-bold text-gray-400 leading-relaxed uppercase tracking-widest">Compliance Statement: I certify that the information provided is legally binding and accurate.</p>
                        </div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full sm:w-auto bg-gray-900 text-white px-8 py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.25em] hover:bg-black transition-all shadow-lg shadow-gray-200 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                        >
                            {submitting ? 'Propagating...' : (
                                <>
                                    Verify Shop
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

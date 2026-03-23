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
    const [uploading, setUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [existingDocs, setExistingDocs] = useState<any[]>([]);

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
                setExistingDocs(data.kyc_details?.documents || []);
            }
        } catch (err) {
            console.error('Error fetching KYC:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !profile?.id) return;

        const files = Array.from(e.target.files);
        setUploading(true);
        setMessage(null);

        try {
            // Get vendor ID
            const { data: vendor } = await supabase
                .from('vendor_profiles')
                .select('id')
                .eq('user_id', profile.id)
                .single();

            if (!vendor) throw new Error('Vendor profile not found');

            const newUploadedDocs: any[] = [];
            for (const file of files) {
                const fileName = `${vendor.id}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
                const filePath = `kyc/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('shop-assets')
                    .upload(filePath, file);

                if (uploadError) {
                    console.error('Upload error:', uploadError);
                    if ((uploadError as any).statusCode === '404' || uploadError.message?.includes('not found')) {
                        throw new Error('Storage bucket "shop-assets" not found. Please create it in Supabase dashboard.');
                    }
                    throw uploadError;
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('shop-assets')
                    .getPublicUrl(filePath);

                newUploadedDocs.push({
                    name: file.name,
                    url: publicUrl,
                    path: filePath, // Saving the path as requested
                    type: file.type,
                    size: file.size,
                    submitted_at: new Date().toISOString()
                });
            }

            setExistingDocs(prev => [...prev, ...newUploadedDocs]);
            setMessage({ type: 'success', text: `${files.length} document(s) prepared successfully.` });
        } catch (err: any) {
            console.error('File upload failed:', err);
            setMessage({ type: 'error', text: `Upload failed: ${err.message}` });
        } finally {
            setUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    const removeDoc = (index: number) => {
        setExistingDocs(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);

        if (!profile?.id) return;

        try {
            const { data: vendor } = await supabase
                .from('vendor_profiles')
                .select('id')
                .eq('user_id', profile.id)
                .single();

            if (!vendor) throw new Error('Vendor profile not found');

            const formData = new FormData(e.target as HTMLFormElement);
            const details = {
                full_name: formData.get('full_name'),
                id_number: formData.get('id_number'),
                business_reg: formData.get('business_reg'),
                tax_number: formData.get('tax_number'),
                address: formData.get('address'),
                submitted_at: new Date().toISOString(),
                documents: existingDocs, // Use existingDocs which already contains uploaded URLs/paths
                storage_path: existingDocs[0]?.path ? existingDocs[0].path.split('/').slice(0, -1).join('/') : 'kyc'
            };

            const { error } = await supabase
                .from('vendor_profiles')
                .update({
                    kyc_status: 'pending',
                    kyc_details: details
                })
                .eq('user_id', profile?.id);

            if (error) throw error;

            // Notify Admins
            const { data: adminProfiles } = await supabase
                .from('profiles')
                .select('id')
                .eq('role', 'admin');

            if (adminProfiles && adminProfiles.length > 0) {
                const shopName = kycData?.shop_name || profile?.full_name || 'A Vendor';
                const adminNotifications = adminProfiles.map(admin => ({
                    user_id: admin.id,
                    type: 'info',
                    title: 'New KYC Submission',
                    message: `Shop "${shopName}" has submitted KYC documents for review.`,
                    data: { vendor_id: vendor.id, type: 'kyc_submission' },
                    is_read: false
                }));

                await supabase.from('notifications').insert(adminNotifications);
            }

            setStatus('pending');
            setKycData(details);
            setExistingDocs(existingDocs);
            setIsEditing(false);
            setMessage({ type: 'success', text: 'KYC documents submitted successfully for review.' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-500/20 border-t-emerald-600"></div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Business Verification</h2>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Trust & Security • Identity Management • Compliance</p>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] border transition-all shadow-sm ${status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' :
                    status === 'pending' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-800' :
                        status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800' :
                            'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700'
                    }`}>
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${status === 'approved' ? 'bg-emerald-500' :
                        status === 'pending' ? 'bg-blue-500' :
                            status === 'rejected' ? 'bg-red-500' :
                                'bg-slate-400 dark:bg-slate-600'
                        }`} />
                    {status === 'none' ? 'Verification Required' : status}
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-[20px] flex items-center justify-between animate-in zoom-in duration-300 border ${message.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 border-red-100 dark:border-red-800'
                    }`}>
                    <div className="flex items-center gap-3">
                        {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span className="text-[11px] font-black uppercase tracking-tight leading-none">{message.text}</span>
                    </div>
                </div>
            )}

            {status === 'approved' ? (
                <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-12 text-center space-y-6 shadow-sm group">
                    <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 shadow-inner group-hover:scale-110 transition-transform">
                        <ShieldCheck size={40} strokeWidth={2.5} />
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Identity Verified</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium text-sm">Your business has cleared all compliance checks. You now have priority access to all gateway features.</p>
                    </div>
                </div>
            ) : (status === 'pending' || status === 'rejected') && !isEditing ? (
                <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-12 text-center space-y-8 shadow-sm group">
                    <div className={`w-20 h-20 ${status === 'pending' ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 animate-pulse' : 'bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400'} rounded-[24px] flex items-center justify-center mx-auto shadow-inner group-hover:rotate-6 transition-transform`}>
                        {status === 'pending' ? <Clock size={40} strokeWidth={2.5} /> : <AlertCircle size={40} strokeWidth={2.5} />}
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                            {status === 'pending' ? 'Review in Progress' : 'Verification Rejected'}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium tracking-tight text-sm leading-relaxed">
                            {status === 'pending'
                                ? 'Our compliance officers are verifying your documents. This typically takes 24 business hours.'
                                : kycData?.rejection_reason || 'Information provided was insufficient or invalid. Please update and resubmit.'}
                        </p>
                    </div>

                    <div className="pt-10 border-t border-slate-50 dark:border-slate-800/50 max-w-3xl mx-auto grid md:grid-cols-2 gap-10">
                        <div className="space-y-6 text-left">
                            <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Transmission Snapshot</h4>
                            <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-inner">
                                {[
                                    { label: 'Primary Contact', value: kycData?.full_name },
                                    { label: 'ID/Passport', value: kycData?.id_number },
                                    { label: 'Entity ID', value: kycData?.business_reg },
                                    { label: 'Tax ID (BP#)', value: kycData?.tax_number }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex flex-col gap-1">
                                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{item.label}</span>
                                        <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums tracking-tight">{item.value || 'N/A'}</span>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="w-full py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black dark:hover:bg-slate-600 transition-all shadow-xl shadow-slate-900/10 active:scale-95 flex items-center justify-center gap-2"
                            >
                                <ArrowRight className="w-3 h-3 rotate-180" />
                                Edit KYC Details
                            </button>
                        </div>

                        <div className="space-y-4 text-left">
                            <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 text-left">Submitted Documents</h4>
                            <div className="space-y-2.5">
                                {existingDocs.length > 0 ? existingDocs.map((doc, idx) => (
                                    <a
                                        key={idx}
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-purple-500 dark:hover:border-purple-500 transition-all group shadow-sm hover:shadow-lg hover:shadow-purple-500/5"
                                    >
                                        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-all">
                                            <FileText size={18} />
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <p className="text-[11px] font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">{doc.name}</p>
                                            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">{(doc.size / 1024).toFixed(1)} KB • Digital Asset</p>
                                        </div>
                                    </a>
                                )) : (
                                    <div className="p-16 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[32px] flex flex-col items-center justify-center text-slate-300 dark:text-slate-700">
                                        <FileText size={48} className="mb-4 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No Documents Found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm transition-all">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center gap-5 bg-slate-50/50 dark:bg-slate-800/20">
                        <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center text-blue-600 dark:text-blue-400 border border-slate-100 dark:border-slate-700">
                            <FileText size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Legal Disclosure</h3>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2 leading-none">Submit authentic documents to enable withdrawals.</p>
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Representative Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            name="full_name"
                                            required
                                            defaultValue={kycData?.full_name}
                                            placeholder="Legal Representative Name"
                                            className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 border focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-sm font-bold text-slate-900 dark:text-white transition-all outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Government ID Number</label>
                                    <div className="relative group">
                                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            name="id_number"
                                            required
                                            defaultValue={kycData?.id_number}
                                            placeholder="National ID / Passport #"
                                            className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 border focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-sm font-bold text-slate-900 dark:text-white transition-all outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Business Registration</label>
                                    <div className="relative group">
                                        <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            name="business_reg"
                                            required
                                            defaultValue={kycData?.business_reg}
                                            placeholder="Certificate Number"
                                            className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 border focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-sm font-bold text-slate-900 dark:text-white transition-all outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Tax Identification (TIN)</label>
                                    <div className="relative group">
                                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            name="tax_number"
                                            required
                                            defaultValue={kycData?.tax_number}
                                            placeholder="BP# / TIN#"
                                            className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 border focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-sm font-bold text-slate-900 dark:text-white transition-all outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Physical Trading Address</label>
                            <textarea
                                name="address"
                                required
                                rows={3}
                                defaultValue={kycData?.address}
                                placeholder="Headquarters physical address..."
                                className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 border focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 rounded-[20px] p-5 text-sm font-bold text-slate-900 dark:text-white transition-all outline-none resize-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
                            />
                        </div>

                        <div className="bg-blue-50/30 dark:bg-blue-900/10 rounded-[32px] border border-blue-100/50 dark:border-blue-800/50 p-8 flex flex-col items-center text-center gap-6 shadow-inner group">
                            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-[20px] shadow-sm flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-50 dark:border-blue-900 group-hover:scale-110 transition-transform">
                                <Upload size={28} strokeWidth={2.5} />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">Document Transmission</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-bold uppercase tracking-tight">Upload ID scan, Business Registration, and Tax certificate.</p>
                            </div>
                            <input
                                type="file"
                                className="hidden"
                                id="kyc-files"
                                multiple
                                onChange={handleFileChange}
                                disabled={uploading}
                                accept=".pdf,.zip,.jpg,.jpeg,.png"
                            />
                            <label htmlFor="kyc-files" className={`cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm text-slate-700 dark:text-slate-300 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {uploading ? 'Uploading...' : 'Select Documents'}
                            </label>

                            {existingDocs.length > 0 && (
                                <div className="w-full mt-2 space-y-2.5">
                                    <h5 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-left px-2">Uploaded Assets ({existingDocs.length})</h5>
                                    {existingDocs.map((doc, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl group/doc shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl group-hover/doc:bg-blue-600 group-hover/doc:text-white transition-all">
                                                    <FileText size={18} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase truncate max-w-[200px]">{doc.name}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">{(doc.size / 1024).toFixed(1)} KB • {doc.path || 'Managed'}</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeDoc(idx)}
                                                className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                            >
                                                <AlertCircle size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {uploading && (
                                <div className="w-full mt-4 flex items-center justify-center p-6 bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl border border-dashed border-blue-200 dark:border-blue-800 animate-in fade-in">
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent mr-3"></div>
                                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">Transmitting to Secure Storage...</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-8 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-8">
                        <div className="flex items-start gap-5">
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="px-8 py-4 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-white dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-400 active:scale-95 shadow-sm"
                                >
                                    Cancel Edit
                                </button>
                            )}
                            <div className="flex items-start gap-3 max-w-sm text-center sm:text-left">
                                <ShieldCheck className="w-5 h-5 text-slate-300 dark:text-slate-600 shrink-0 mt-0.5" />
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 leading-relaxed uppercase tracking-[0.1em]">Compliance Statement: I certify that the information provided is legally binding and accurate.</p>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={submitting || uploading || existingDocs.length === 0}
                            className="w-full sm:w-auto bg-slate-900 dark:bg-slate-700 text-white px-12 py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.25em] hover:bg-black dark:hover:bg-slate-600 transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                        >
                            {submitting ? 'Propagating Documents...' : (
                                <>
                                    {isEditing ? 'Update & Re-Submit' : 'Verify Shop Identity'}
                                    <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

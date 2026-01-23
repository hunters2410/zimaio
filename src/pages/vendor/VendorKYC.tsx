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
            ) : (status === 'pending' || status === 'rejected') && !isEditing ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center space-y-6 shadow-sm">
                    <div className={`w-16 h-16 ${status === 'pending' ? 'bg-blue-100 text-blue-600 animate-pulse' : 'bg-red-100 text-red-600'} rounded-2xl flex items-center justify-center mx-auto shadow-inner`}>
                        {status === 'pending' ? <Clock size={32} /> : <AlertCircle size={32} />}
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">
                            {status === 'pending' ? 'Review in Progress' : 'Verification Rejected'}
                        </h3>
                        <p className="text-gray-500 max-w-sm mx-auto font-bold tracking-tight text-sm">
                            {status === 'pending'
                                ? 'Our compliance officers are verifying your documents. This typically takes 24 business hours.'
                                : kycData?.rejection_reason || 'Information provided was insufficient or invalid. Please update and resubmit.'}
                        </p>
                    </div>

                    <div className="pt-8 border-t border-gray-50 max-w-2xl mx-auto grid md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 text-left">Transmission Snapshot</h4>
                            <div className="space-y-2 text-left bg-gray-50 p-6 rounded-xl border border-gray-100">
                                {[
                                    { label: 'Primary Contact', value: kycData?.full_name },
                                    { label: 'ID/Passport', value: kycData?.id_number },
                                    { label: 'Entity ID', value: kycData?.business_reg },
                                    { label: 'Tax ID (BP#)', value: kycData?.tax_number }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex flex-col gap-1">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.label}</span>
                                        <span className="text-xs font-black text-gray-900">{item.value || 'N/A'}</span>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="w-full py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-sm"
                            >
                                Edit KYC Details
                            </button>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 text-left">Submitted Documents</h4>
                            <div className="space-y-2">
                                {existingDocs.length > 0 ? existingDocs.map((doc, idx) => (
                                    <a
                                        key={idx}
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-blue-500 transition-colors group"
                                    >
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <FileText size={16} />
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <p className="text-xs font-black text-gray-900 truncate uppercase tracking-tighter">{doc.name}</p>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase">{(doc.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    </a>
                                )) : (
                                    <div className="p-10 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center text-gray-300">
                                        <FileText size={32} className="mb-2 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No Documents Found</p>
                                    </div>
                                )}
                            </div>
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
                                            defaultValue={kycData?.full_name}
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
                                            defaultValue={kycData?.id_number}
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
                                            defaultValue={kycData?.business_reg}
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
                                            defaultValue={kycData?.tax_number}
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
                                defaultValue={kycData?.address}
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
                                <p className="text-xs text-gray-500 max-w-sm mx-auto font-bold uppercase tracking-tight">Upload ID scan, Business Registration, and Tax certificate.</p>
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
                            <label htmlFor="kyc-files" className={`cursor-pointer bg-white border border-gray-200 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm text-gray-700 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {uploading ? 'Uploading...' : 'Select Documents'}
                            </label>

                            {existingDocs.length > 0 && (
                                <div className="w-full mt-4 space-y-2">
                                    <h5 className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-left mb-2">Uploaded Assets ({existingDocs.length})</h5>
                                    {existingDocs.map((doc, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl group">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                    <FileText size={16} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-[10px] font-black text-gray-700 uppercase truncate max-w-[200px]">{doc.name}</p>
                                                    <p className="text-[8px] font-bold text-gray-400 uppercase">{(doc.size / 1024).toFixed(1)} KB • {doc.path || 'Managed'}</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeDoc(idx)}
                                                className="p-1 hover:text-red-500 transition-colors"
                                            >
                                                <AlertCircle size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {uploading && (
                                <div className="w-full mt-4 flex items-center justify-center py-4 bg-blue-50/30 rounded-xl border border-dashed border-blue-200">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mr-2"></div>
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Transmitting to Secure Storage...</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-6 bg-white border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-6">
                        <div className="flex items-start gap-4">
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="px-6 py-4 border border-gray-200 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                                >
                                    Cancel Edit
                                </button>
                            )}
                            <div className="flex items-start gap-2 max-w-sm text-center sm:text-left">
                                <ShieldCheck className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                                <p className="text-[10px] font-bold text-gray-400 leading-relaxed uppercase tracking-widest">Compliance Statement: I certify that the information provided is legally binding and accurate.</p>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={submitting || uploading || existingDocs.length === 0}
                            className="w-full sm:w-auto bg-gray-900 text-white px-10 py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.25em] hover:bg-black transition-all shadow-lg shadow-gray-200 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                        >
                            {submitting ? 'Propagating Documents...' : (
                                <>
                                    {isEditing ? 'Update & Re-Submit' : 'Verify Shop Identity'}
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

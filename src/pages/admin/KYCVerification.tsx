import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { CheckCircle, XCircle, Eye, FileText, Search, Clock, AlertCircle } from 'lucide-react';

interface KYCVerification {
  id: string; // This is vendor_profile.id
  user_id: string;
  shop_name: string;
  document_type: string;
  document_number: string;
  document_url: string | null;
  verification_status: string;
  submitted_at: string;
  vendor_email: string;
  vendor_name: string;
  kyc_details: any;
}

export function KYCVerification() {
  const [verifications, setVerifications] = useState<KYCVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<KYCVerification | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vendor_profiles')
      .select(`
        id,
        user_id,
        shop_name,
        kyc_status,
        kyc_details,
        created_at,
        profiles!vendor_profiles_user_id_fkey(email, full_name)
      `)
      .neq('kyc_status', 'none')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching KYC:', error);
      setVerifications([]);
    } else {
      const formatted = (data || []).map((v: any) => ({
        id: v.id,
        user_id: v.user_id,
        shop_name: v.shop_name,
        document_type: 'Business Documents',
        document_number: v.kyc_details?.id_number || v.kyc_details?.tax_number || 'N/A',
        document_url: v.kyc_details?.document_url || null,
        verification_status: v.kyc_status,
        submitted_at: v.kyc_details?.submitted_at || v.created_at,
        vendor_email: v.profiles?.email || 'N/A',
        vendor_name: v.profiles?.full_name || v.shop_name,
        kyc_details: v.kyc_details
      }));
      setVerifications(formatted);
    }
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    setLoading(true);
    const verification = verifications.find(v => v.id === id);

    const { error } = await supabase
      .from('vendor_profiles')
      .update({
        kyc_status: 'approved',
        is_verified: true,
        is_approved: true
      })
      .eq('id', id);

    if (error) {
      alert('Error approving KYC: ' + error.message);
    } else {
      // Notify vendor
      if (verification) {
        await supabase.from('notifications').insert({
          user_id: verification.user_id,
          type: 'success',
          title: 'KYC Verification Approved',
          message: `Congratulations! Your business verification for "${verification.shop_name}" has been approved. You can now start trading.`,
          is_read: false
        });
      }

      fetchVerifications();
      setSelectedVerification(null);
    }
    setLoading(false);
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setLoading(true);
    const verification = verifications.find(v => v.id === id);

    const { error } = await supabase
      .from('vendor_profiles')
      .update({
        kyc_status: 'rejected',
        is_verified: false,
        kyc_details: {
          ...selectedVerification?.kyc_details,
          rejection_reason: rejectionReason,
          rejected_at: new Date().toISOString()
        }
      })
      .eq('id', id);

    if (error) {
      alert('Error rejecting KYC: ' + error.message);
    } else {
      // Notify vendor
      if (verification) {
        await supabase.from('notifications').insert({
          user_id: verification.user_id,
          type: 'error',
          title: 'KYC Verification Rejected',
          message: `Your business verification for "${verification.shop_name}" was rejected. Reason: ${rejectionReason}. Please update your details and resubmit.`,
          is_read: false
        });
      }

      fetchVerifications();
      setSelectedVerification(null);
      setRejectionReason('');
    }
    setLoading(false);
  };

  const filteredVerifications = verifications.filter(v =>
    v.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.vendor_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.shop_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && verifications.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">KYC Verification</h1>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">Audit and validate vendor documents</p>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by vendor, email, or shop name..."
            className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-100 rounded-2xl focus:border-green-500 transition-all outline-none font-medium shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b-2 border-gray-100">
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Vendor Details</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Shop & ID</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Submitted At</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-gray-50">
              {filteredVerifications.length > 0 ? filteredVerifications.map((verification) => (
                <tr key={verification.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-gray-900 uppercase tracking-tight">{verification.vendor_name}</span>
                      <span className="text-xs font-bold text-gray-400">{verification.vendor_email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-green-700 uppercase tracking-tighter">{verification.shop_name}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">ID: {verification.document_number}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock size={14} className="text-gray-400" />
                      <span className="text-xs font-bold">{new Date(verification.submitted_at).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${verification.verification_status === 'pending'
                      ? 'bg-yellow-50 text-yellow-700 border-yellow-100'
                      : verification.verification_status === 'approved'
                        ? 'bg-green-50 text-green-700 border-green-100'
                        : 'bg-red-50 text-red-700 border-red-100'
                      }`}>
                      <div className={`w-1 h-1 rounded-full mr-1.5 ${verification.verification_status === 'pending' ? 'bg-yellow-500' :
                        verification.verification_status === 'approved' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                      {verification.verification_status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedVerification(verification)}
                        className="flex items-center px-4 py-2 text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Auditing
                      </button>
                      {verification.verification_status === 'pending' && (
                        <button
                          onClick={() => handleApprove(verification.id)}
                          className="flex items-center px-4 py-2 text-[10px] font-black uppercase tracking-widest text-green-600 bg-green-50 border border-green-100 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Verify
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-300">
                      <Search size={48} className="mb-3 opacity-20" />
                      <p className="text-xs font-black uppercase tracking-[0.2em]">No Matches Found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedVerification && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl border border-white/20">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 border border-green-100">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Business Audit</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Verifying Information for {selectedVerification.shop_name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Legal Representative</label>
                  <p className="text-sm font-black text-gray-900">{selectedVerification.vendor_name}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Identification Type</label>
                  <p className="text-sm font-black text-gray-900 uppercase">{selectedVerification.document_type.replace(/_/g, ' ')}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Transmission Date</label>
                  <p className="text-sm font-black text-gray-900">{new Date(selectedVerification.submitted_at).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Identification Number</label>
                  <p className="text-sm font-black text-gray-900">{selectedVerification.document_number}</p>
                </div>
              </div>
            </div>

            <div className="mb-8 p-6 bg-gray-50/50 rounded-2xl border-2 border-gray-100">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Verification Artifacts</label>

              {selectedVerification.kyc_details?.documents?.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {selectedVerification.kyc_details.documents.map((doc: any, idx: number) => (
                    <a
                      key={idx}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-green-500 transition-all group shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-green-50 text-green-600 rounded-xl group-hover:bg-green-600 group-hover:text-white transition-colors">
                          <FileText size={18} />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-black text-gray-900 truncate max-w-[250px] uppercase tracking-tighter">{doc.name}</p>
                          <p className="text-[9px] text-gray-400 font-bold">{(doc.size / 1024).toFixed(1)} KB • Path: {doc.path || 'N/A'}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-green-600 uppercase tracking-widest bg-green-50 px-4 py-2 rounded-xl border border-green-100">Auditing Asset</span>
                    </a>
                  ))}
                </div>
              ) : selectedVerification.document_url ? (
                <a
                  href={selectedVerification.document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl text-blue-600 hover:border-blue-500 transition-all shadow-sm"
                >
                  <FileText className="h-6 w-6" />
                  <span className="text-xs font-black uppercase tracking-widest">Verify Primary Transmission</span>
                </a>
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <AlertCircle size={24} className="mx-auto mb-2 opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No Artifacts Found</p>
                </div>
              )}
            </div>

            <div className="mb-8">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Compliance Commentary</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full px-5 py-4 bg-gray-50/50 border-2 border-gray-100 rounded-2xl focus:border-red-500 transition-all outline-none text-sm font-medium placeholder:text-gray-300"
                placeholder="Declare reason if rejecting application..."
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t-2 border-gray-50">
              <button
                onClick={() => {
                  setSelectedVerification(null);
                  setRejectionReason('');
                }}
                className="order-3 sm:order-1 px-8 py-4 border-2 border-gray-100 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
              >
                Cancel Audit
              </button>
              <button
                onClick={() => handleReject(selectedVerification.id)}
                className="order-2 px-8 py-4 bg-red-50 text-red-600 border-2 border-red-100 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-lg shadow-red-500/10 flex items-center justify-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
              <button
                onClick={() => handleApprove(selectedVerification.id)}
                className="order-1 px-8 py-4 bg-green-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 active:scale-95"
              >
                <CheckCircle className="h-4 w-4" />
                Approve Entity
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

const Shield = ({ className, size }: { className?: string, size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size || 24}
    height={size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
  </svg>
);
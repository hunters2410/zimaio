import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { CheckCircle, XCircle, Eye, FileText, Search, Clock, AlertCircle } from 'lucide-react';
import { dispatchTrigger } from '../../lib/eventDispatcher';
import { Pagination } from '../../components/Pagination';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchVerifications();
  }, [currentPage, searchQuery]);

  const fetchVerifications = async () => {
    setLoading(true);
    let query = supabase
      .from('vendor_profiles')
      .select(`
        id,
        user_id,
        shop_name,
        kyc_status,
        kyc_details,
        created_at,
        profiles!vendor_profiles_user_id_fkey(email, full_name)
      `, { count: 'exact' })
      .neq('kyc_status', 'none');

    if (searchQuery) {
      query = query.ilike('shop_name', `%${searchQuery}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

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
      setTotalItems(count || 0);
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

        // Trigger automated email
        dispatchTrigger('vendor_approved', {
          email: verification.vendor_email,
          vendor_name: verification.vendor_name || verification.shop_name,
          shop_name: verification.shop_name
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
          <h1 className="text-xl font-bold text-gray-900 tracking-tight uppercase">KYC Verification</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Audit and validate vendor documents</p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search vendor, email, or shop..."
            className="w-full pl-10 pr-4 py-2 bg-white border-2 border-gray-100 rounded-xl focus:border-green-500 transition-all outline-none text-sm font-medium shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vendor</th>
                <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Shop & ID</th>
                <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Submitted</th>
                <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-gray-50">
              {filteredVerifications.length > 0 ? filteredVerifications.map((verification) => (
                <tr key={verification.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-5 py-3">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-900 uppercase tracking-tight">{verification.vendor_name}</span>
                      <span className="text-[10px] text-gray-400">{verification.vendor_email}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-green-700 uppercase tracking-tighter">{verification.shop_name}</span>
                      <span className="text-[9px] text-gray-400 font-mono mt-0.5">#{verification.document_number}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock size={12} />
                      <span className="text-xs">{new Date(verification.submitted_at).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border ${verification.verification_status === 'pending'
                      ? 'bg-yellow-50 text-yellow-700 border-yellow-100'
                      : verification.verification_status === 'approved'
                        ? 'bg-green-50 text-green-700 border-green-100'
                        : 'bg-red-50 text-red-700 border-red-100'
                      }`}>
                      {verification.verification_status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedVerification(verification)}
                        className="px-3 py-1 text-[10px] font-bold uppercase text-blue-600 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                      >
                        Auditing
                      </button>
                      {verification.verification_status === 'pending' && (
                        <button
                          onClick={() => handleApprove(verification.id)}
                          className="px-3 py-1 text-[10px] font-bold uppercase text-green-600 bg-green-50 border border-green-100 rounded-lg hover:bg-green-600 hover:text-white transition-all shadow-sm"
                        >
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

      <div className="mt-4">
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {selectedVerification && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full shadow-2xl border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 border border-green-100">
                  <Shield size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tighter">Business Audit</h2>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{selectedVerification.shop_name}</p>
                </div>
              </div>
              <button onClick={() => setSelectedVerification(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="space-y-3">
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Legal Rep / Shop</label>
                  <p className="text-xs font-bold text-gray-900">{selectedVerification.vendor_name}</p>
                  <p className="text-[10px] text-green-700 font-bold">{selectedVerification.shop_name}</p>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">ID Type & Number</label>
                  <p className="text-xs font-bold text-gray-900 uppercase">{selectedVerification.document_type.replace(/_/g, ' ')}</p>
                  <p className="text-[10px] text-gray-500 font-mono">#{selectedVerification.document_number}</p>
                </div>
              </div>
              <div className="space-y-3 text-right sm:text-left">
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Audit Status</label>
                  <span className="text-xs font-bold text-yellow-600 uppercase italic">{selectedVerification.verification_status}</span>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Submission Date</label>
                  <p className="text-xs font-bold text-gray-900">{new Date(selectedVerification.submitted_at).toLocaleDateString()}</p>
                  <p className="text-[9px] text-gray-400">{new Date(selectedVerification.submitted_at).toLocaleTimeString()}</p>
                </div>
              </div>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">Verification Assets</label>

              {selectedVerification.kyc_details?.documents?.length > 0 ? (
                <div className="space-y-2">
                  {selectedVerification.kyc_details.documents.map((doc: any, idx: number) => (
                    <a
                      key={idx}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-green-500 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <FileText size={16} className="text-gray-400 group-hover:text-green-600" />
                        <div className="text-left">
                          <p className="text-[11px] font-bold text-gray-900 truncate max-w-[180px] uppercase tracking-tighter">{doc.name}</p>
                        </div>
                      </div>
                      <span className="text-[8px] font-bold text-green-600 uppercase bg-green-50 px-2 py-1 rounded-md border border-green-100">View Asset</span>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400">
                  <p className="text-[9px] font-bold uppercase tracking-widest italic">No Assets Provided</p>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Compliance Notes (Internal)</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-emerald-500 transition-all outline-none text-xs font-medium"
                placeholder="Reason for rejection (if applicable)..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-50">
              <button
                onClick={() => handleApprove(selectedVerification.id)}
                className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/20"
              >
                Approve
              </button>
              <button
                onClick={() => handleReject(selectedVerification.id)}
                className="px-5 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all"
              >
                Reject
              </button>
              <button
                onClick={() => {
                  setSelectedVerification(null);
                  setRejectionReason('');
                }}
                className="px-5 py-2 text-gray-400 text-xs font-bold uppercase tracking-widest hover:text-gray-600 transition-all"
              >
                Cancel
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
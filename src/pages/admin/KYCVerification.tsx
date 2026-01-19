import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { CheckCircle, XCircle, Eye, FileText } from 'lucide-react';

interface KYCVerification {
  id: string;
  vendor_id: string;
  document_type: string;
  document_number: string;
  document_url: string | null;
  verification_status: string;
  submitted_at: string;
  vendor_email: string;
  vendor_name: string;
}

export function KYCVerification() {
  const [verifications, setVerifications] = useState<KYCVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<KYCVerification | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    const { data } = await supabase
      .from('kyc_verifications')
      .select(`
        *,
        profiles!kyc_verifications_vendor_id_fkey(email, full_name)
      `)
      .order('submitted_at', { ascending: false });

    const formatted = (data || []).map((v: any) => ({
      ...v,
      vendor_email: v.profiles?.email || 'N/A',
      vendor_name: v.profiles?.full_name || 'N/A'
    }));

    setVerifications(formatted);
    setLoading(false);
  };

  const handleApprove = async (id: string, vendorId: string) => {
    await supabase
      .from('kyc_verifications')
      .update({
        verification_status: 'approved',
        verified_at: new Date().toISOString(),
        verified_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', id);

    await supabase
      .from('vendor_profiles')
      .update({ kyc_status: 'approved', is_verified: true })
      .eq('user_id', vendorId);

    fetchVerifications();
    setSelectedVerification(null);
  };

  const handleReject = async (id: string, vendorId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    await supabase
      .from('kyc_verifications')
      .update({
        verification_status: 'rejected',
        verified_at: new Date().toISOString(),
        verified_by: (await supabase.auth.getUser()).data.user?.id,
        rejection_reason: rejectionReason
      })
      .eq('id', id);

    await supabase
      .from('vendor_profiles')
      .update({ kyc_status: 'rejected' })
      .eq('user_id', vendorId);

    fetchVerifications();
    setSelectedVerification(null);
    setRejectionReason('');
  };

  if (loading) {
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">KYC Verification</h1>
        <p className="text-gray-600">Review and verify vendor identity documents</p>
      </div>

      <div className="grid gap-4">
        {verifications.map((verification) => (
          <div
            key={verification.id}
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {verification.vendor_name}
                  </h3>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      verification.verification_status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : verification.verification_status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {verification.verification_status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{verification.vendor_email}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Document Type:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {verification.document_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Document Number:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {verification.document_number}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Submitted:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {new Date(verification.submitted_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {verification.verification_status === 'pending' && (
                  <>
                    <button
                      onClick={() => setSelectedVerification(verification)}
                      className="flex items-center px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Review
                    </button>
                    <button
                      onClick={() => handleApprove(verification.id, verification.vendor_id)}
                      className="flex items-center px-4 py-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {verifications.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg">
            No KYC verifications to review at this time.
          </div>
        )}
      </div>

      {selectedVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Review KYC Document</h2>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor Name
                </label>
                <p className="text-gray-900">{selectedVerification.vendor_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Type
                </label>
                <p className="text-gray-900">
                  {selectedVerification.document_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
              </div>
              {selectedVerification.document_url && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document
                  </label>
                  <a
                    href={selectedVerification.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:underline"
                  >
                    <FileText className="h-5 w-5 mr-2" />
                    View Document
                  </a>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason (if rejecting)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter reason for rejection..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedVerification(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedVerification.id, selectedVerification.vendor_id)}
                className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </button>
              <button
                onClick={() => handleApprove(selectedVerification.id, selectedVerification.vendor_id)}
                className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
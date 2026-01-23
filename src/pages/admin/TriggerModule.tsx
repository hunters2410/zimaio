import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Bell, Plus, Edit2, Trash2, Save, X, Zap } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';

interface Trigger {
  id: string;
  name: string;
  event_type: string;
  action_type: string;
  conditions: any;
  actions: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const eventTypes = [
  { value: 'order_placed', label: 'Order Placed' },
  { value: 'order_shipped', label: 'Order Shipped' },
  { value: 'order_delivered', label: 'Order Delivered' },
  { value: 'payment_received', label: 'Payment Received' },
  { value: 'payment_failed', label: 'Payment Failed' },
  { value: 'user_registered', label: 'User Registered' },
  { value: 'vendor_approved', label: 'Vendor Approved' },
  { value: 'product_out_of_stock', label: 'Product Out of Stock' },
  { value: 'refund_requested', label: 'Refund Requested' }
];

const actionTypes = [
  { value: 'send_email', label: 'Send Email' },
  { value: 'send_sms', label: 'Send SMS' },
  { value: 'send_notification', label: 'Send Notification' },
  { value: 'webhook', label: 'Call Webhook' },
  { value: 'update_status', label: 'Update Status' }
];

export default function TriggerModule() {
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    event_type: '',
    action_type: '',
    conditions: '{}',
    actions: '{}',
    is_active: true
  });

  useEffect(() => {
    loadTriggers();
  }, []);

  const loadTriggers = async () => {
    try {
      const { data, error } = await supabase.from('event_triggers').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setTriggers(data || []);
    } catch (e) {
      console.error('Error loading triggers:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const conditions = JSON.parse(formData.conditions);
      const actions = JSON.parse(formData.actions);
      const payload = { ...formData, conditions, actions };
      if (editingId) {
        const { error } = await supabase.from('event_triggers').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('event_triggers').insert([payload]);
        if (error) throw error;
      }
      resetForm();
      loadTriggers();
    } catch (e) {
      console.error('Error saving trigger:', e);
      alert('Failed to save trigger');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this trigger?')) return;
    try {
      const { error } = await supabase.from('event_triggers').delete().eq('id', id);
      if (error) throw error;
      loadTriggers();
    } catch (e) {
      console.error('Error deleting trigger:', e);
      alert('Failed to delete trigger');
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      const { error } = await supabase.from('event_triggers').update({ is_active: !current, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      loadTriggers();
    } catch (e) {
      console.error('Error toggling status:', e);
    }
  };

  const handleEdit = (trigger: Trigger) => {
    setEditingId(trigger.id);
    setFormData({
      name: trigger.name,
      event_type: trigger.event_type,
      action_type: trigger.action_type,
      conditions: JSON.stringify(trigger.conditions || {}, null, 2),
      actions: JSON.stringify(trigger.actions || {}, null, 2),
      is_active: trigger.is_active
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ name: '', event_type: '', action_type: '', conditions: '{}', actions: '{}', is_active: true });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center">
              <Zap className="w-6 h-6 mr-2 text-blue-600" />
              Trigger Module
            </h1>
            <p className="text-slate-600 mt-1">Automate actions based on events</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </button>
        </div>

        {showForm && (
          <div className="bg-gray-50 rounded p-4 border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingId ? 'Edit Trigger' : 'Add Trigger'}
              </h2>
              <button onClick={resetForm} className="text-slate-500 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-0.5">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Send email on order placement"
                    className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-0.5">Event Type *</label>
                  <select
                    value={formData.event_type}
                    onChange={e => setFormData({ ...formData, event_type: e.target.value })}
                    required
                    className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  >
                    <option value="">Select Event</option>
                    {eventTypes.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-0.5">Action Type *</label>
                  <select
                    value={formData.action_type}
                    onChange={e => setFormData({ ...formData, action_type: e.target.value })}
                    required
                    className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  >
                    <option value="">Select Action</option>
                    {actionTypes.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-0.5">Conditions (JSON)</label>
                <textarea
                  rows={3}
                  value={formData.conditions}
                  onChange={e => setFormData({ ...formData, conditions: e.target.value })}
                  placeholder='{"min_amount":100,"status":"paid"}'
                  className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-white font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-0.5">Actions (JSON)</label>
                <textarea
                  rows={3}
                  value={formData.actions}
                  onChange={e => setFormData({ ...formData, actions: e.target.value })}
                  placeholder='{"template":"order_confirmation","recipient":"customer_email"}'
                  className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-white font-mono text-sm"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-3 h-3 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Active</span>
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={resetForm} className="px-3 py-1 text-slate-700 hover:bg-slate-100 rounded transition-colors text-sm">
                  Cancel
                </button>
                <button type="submit" className="flex items-center px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm">
                  <Save className="w-4 h-4 mr-1" />
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-gray-50 rounded shadow overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase">Event</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase">Action</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {triggers.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2"><span className="text-sm font-medium text-slate-900">{t.name}</span></td>
                    <td className="px-4 py-2"><span className="text-sm text-slate-700">{eventTypes.find(e => e.value === t.event_type)?.label || t.event_type}</span></td>
                    <td className="px-4 py-2"><span className="text-sm text-slate-700">{actionTypes.find(a => a.value === t.action_type)?.label || t.action_type}</span></td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleToggleActive(t.id, t.is_active)}
                        className={`px-2 py-0.5 text-xs rounded-full ${t.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                      >
                        {t.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => handleEdit(t)} className="p-1 text-blue-600 hover:bg-blue-50 rounded mr-2">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(t.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {triggers.length === 0 && (
            <div className="text-center py-8 text-slate-500">No triggers configured. Add your first trigger.</div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

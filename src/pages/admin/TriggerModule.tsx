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

  async function loadTriggers() {
    try {
      const { data, error } = await supabase
        .from('event_triggers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTriggers(data || []);
    } catch (error) {
      console.error('Error loading triggers:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      let conditions, actions;
      try {
        conditions = JSON.parse(formData.conditions);
        actions = JSON.parse(formData.actions);
      } catch {
        alert('Invalid JSON format in conditions or actions');
        return;
      }

      const payload = {
        name: formData.name,
        event_type: formData.event_type,
        action_type: formData.action_type,
        conditions,
        actions,
        is_active: formData.is_active
      };

      if (editingId) {
        const { error } = await supabase
          .from('event_triggers')
          .update({
            ...payload,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('event_triggers')
          .insert([payload]);

        if (error) throw error;
      }

      resetForm();
      loadTriggers();
    } catch (error) {
      console.error('Error saving trigger:', error);
      alert('Failed to save trigger');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this trigger?')) return;

    try {
      const { error } = await supabase
        .from('event_triggers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadTriggers();
    } catch (error) {
      console.error('Error deleting trigger:', error);
      alert('Failed to delete trigger');
    }
  }

  async function handleToggleActive(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('event_triggers')
        .update({
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      loadTriggers();
    } catch (error) {
      console.error('Error toggling trigger status:', error);
    }
  }

  function handleEdit(trigger: Trigger) {
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
  }

  function resetForm() {
    setFormData({
      name: '',
      event_type: '',
      action_type: '',
      conditions: '{}',
      actions: '{}',
      is_active: true
    });
    setEditingId(null);
    setShowForm(false);
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center">
            <Zap className="w-8 h-8 mr-3 text-blue-600" />
            Trigger Module
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Automate actions based on events
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Trigger
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {editingId ? 'Edit Trigger' : 'Add New Trigger'}
            </h2>
            <button
              onClick={resetForm}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Trigger Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Send email on order placement"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Event Type *
                </label>
                <select
                  value={formData.event_type}
                  onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                >
                  <option value="">Select Event</option>
                  {eventTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Action Type *
                </label>
                <select
                  value={formData.action_type}
                  onChange={(e) => setFormData({ ...formData, action_type: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                >
                  <option value="">Select Action</option>
                  {actionTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Conditions (JSON)
              </label>
              <textarea
                value={formData.conditions}
                onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                rows={4}
                placeholder='{"min_amount": 100, "status": "paid"}'
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white font-mono text-sm"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Define conditions that must be met for this trigger to execute
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Actions (JSON)
              </label>
              <textarea
                value={formData.actions}
                onChange={(e) => setFormData({ ...formData, actions: e.target.value })}
                rows={4}
                placeholder='{"template": "order_confirmation", "recipient": "customer_email"}'
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white font-mono text-sm"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Define the actions to execute when this trigger fires
              </p>
            </div>

            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">Active</span>
              </label>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {triggers.map((trigger) => (
          <div
            key={trigger.id}
            className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {trigger.name}
                  </h3>
                  <button
                    onClick={() => handleToggleActive(trigger.id, trigger.is_active)}
                    className={`px-2 py-1 text-xs rounded-full ${
                      trigger.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}
                  >
                    {trigger.is_active ? 'Active' : 'Inactive'}
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Event:</span>
                    <span className="ml-2 text-slate-700 dark:text-slate-300 font-medium">
                      {eventTypes.find(t => t.value === trigger.event_type)?.label || trigger.event_type}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Action:</span>
                    <span className="ml-2 text-slate-700 dark:text-slate-300 font-medium">
                      {actionTypes.find(t => t.value === trigger.action_type)?.label || trigger.action_type}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(trigger)}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(trigger.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {triggers.length === 0 && !showForm && (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg">
          <Bell className="w-12 h-12 mx-auto text-slate-400 mb-4" />
          <p className="text-slate-500 dark:text-slate-400">
            No triggers configured. Add your first trigger to automate actions.
          </p>
        </div>
      )}
      </div>
    </AdminLayout>
  );
}

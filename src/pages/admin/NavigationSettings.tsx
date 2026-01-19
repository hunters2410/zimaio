import { useEffect, useState } from 'react';
import { Menu, Package, Plus, Edit2, Trash2, Save, X, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface NavigationItem {
  id: string;
  label: string;
  url: string;
  icon: string | null;
  order_position: number;
  is_active: boolean;
}

export function NavigationSettings() {
  const [items, setItems] = useState<NavigationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    label: '',
    url: '',
    icon: '',
    is_active: true
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data } = await supabase
      .from('navigation_menu_items')
      .select('*')
      .order('order_position');

    if (data) {
      setItems(data);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.order_position)) : 0;

    const { error } = await supabase
      .from('navigation_menu_items')
      .insert({
        ...formData,
        order_position: maxOrder + 1
      });

    if (!error) {
      setFormData({ label: '', url: '', icon: '', is_active: true });
      setShowAddForm(false);
      fetchItems();
    }
  };

  const handleUpdate = async (id: string, updates: Partial<NavigationItem>) => {
    const { error } = await supabase
      .from('navigation_menu_items')
      .update(updates)
      .eq('id', id);

    if (!error) {
      fetchItems();
      setEditingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this navigation item?')) return;

    const { error } = await supabase
      .from('navigation_menu_items')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchItems();
    }
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const index = items.findIndex(i => i.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;

    const newItems = [...items];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];

    const updates = newItems.map((item, idx) => ({
      id: item.id,
      order_position: idx + 1
    }));

    for (const update of updates) {
      await supabase
        .from('navigation_menu_items')
        .update({ order_position: update.order_position })
        .eq('id', update.id);
    }

    fetchItems();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-2">Navigation Menu Settings</h1>
          <p className="text-green-100">Manage top navigation bar items</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Menu Items</h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
            >
              <Plus className="h-5 w-5" />
              <span>Add Item</span>
            </button>
          </div>

          {showAddForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Add New Navigation Item</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Label</label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., CATEGORIES"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">URL</label>
                  <input
                    type="text"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., /categories"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Icon (optional)</label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">No Icon</option>
                    <option value="Menu">Menu Icon</option>
                    <option value="Package">Package Icon</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-green-500 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>
              </div>
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={handleAdd}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                >
                  <Save className="h-4 w-4" />
                  <span>Save</span>
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-green-300 transition"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex flex-col space-y-1">
                    <button
                      onClick={() => handleReorder(item.id, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleReorder(item.id, 'down')}
                      disabled={index === items.length - 1}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-3 flex-1">
                    {item.icon === 'Menu' && <Menu className="h-5 w-5 text-gray-600" />}
                    {item.icon === 'Package' && <Package className="h-5 w-5 text-gray-600" />}
                    <div>
                      <div className="font-semibold text-gray-900">{item.label}</div>
                      <div className="text-sm text-gray-500">{item.url}</div>
                    </div>
                  </div>
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleUpdate(item.id, { is_active: !item.is_active })}
                    className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition"
                    title={item.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {item.is_active ? 'Hide' : 'Show'}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

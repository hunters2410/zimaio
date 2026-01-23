import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { paymentService } from '../../services/paymentService';
import { CreditCard, Plus, Edit, Trash2, Power, PowerOff, Save, X, AlertCircle, CheckCircle, Grid3x3, List, Search } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import type { PaymentGateway, PaymentInstruction } from '../../types/payment';

type ViewMode = 'grid' | 'list';

export function PaymentGateways() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingGateway, setEditingGateway] = useState<PaymentGateway | null>(null);
  const [showAddManual, setShowAddManual] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editInstructions, setEditInstructions] = useState<PaymentInstruction[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');

  const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
  const textPrimary = isDark ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

  useEffect(() => {
    fetchGateways();
  }, []);

  const fetchGateways = async () => {
    setLoading(true);
    try {
      const data = await paymentService.getAllGateways();
      setGateways(data);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (gateway: PaymentGateway) => {
    setEditingGateway({
      ...gateway,
      configuration: gateway.configuration || {}
    });

    if (gateway.gateway_type === 'manual') {
      try {
        const instructions = await paymentService.getInstructions(gateway.id);
        setEditInstructions(instructions);
      } catch (error: any) {
        setMessage({ type: 'error', text: error.message });
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGateway) return;

    setLoading(true);
    try {
      await paymentService.updateGateway(editingGateway.id, {
        display_name: editingGateway.display_name,
        description: editingGateway.description,
        is_active: editingGateway.is_active,
        configuration: editingGateway.configuration,
        instructions: editingGateway.instructions,
        logo_url: editingGateway.logo_url,
      });

      if (editingGateway.gateway_type === 'manual' && editInstructions.length > 0) {
        await paymentService.saveInstructions(editingGateway.id, editInstructions);
      }

      setMessage({ type: 'success', text: 'Payment gateway updated successfully' });
      setEditingGateway(null);
      setEditInstructions([]);
      fetchGateways();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (gateway: PaymentGateway) => {
    // Optimistic Update
    const oldGateways = [...gateways];
    setGateways(gateways.map(g =>
      g.id === gateway.id ? { ...g, is_active: !g.is_active } : g
    ));

    try {
      await paymentService.updateGateway(gateway.id, {
        is_active: !gateway.is_active,
      });
      setMessage({
        type: 'success',
        text: `${gateway.display_name} ${gateway.is_active ? 'disabled' : 'enabled'} successfully`,
      });
      fetchGateways(); // Re-sync with server
    } catch (error: any) {
      setGateways(oldGateways); // Rollback on error
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleDelete = async (gateway: PaymentGateway) => {
    if (!confirm(`Are you sure you want to delete ${gateway.display_name}?`)) return;

    try {
      await paymentService.deleteGateway(gateway.id);
      setMessage({ type: 'success', text: 'Payment gateway deleted successfully' });
      fetchGateways();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleAddManualGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    try {
      await paymentService.createManualGateway({
        gateway_name: formData.get('gateway_name') as string,
        gateway_type: 'manual',
        display_name: formData.get('display_name') as string,
        description: formData.get('description') as string,
        is_active: false,
        is_default: false,
        configuration: {},
        supported_currencies: ['USD', 'ZWL'],
        instructions: formData.get('instructions') as string,
        logo_url: formData.get('logo_url') as string,
        sort_order: gateways.length + 1,
      });

      setMessage({ type: 'success', text: 'Manual payment gateway added successfully' });
      setShowAddManual(false);
      fetchGateways();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const updateConfigField = (key: string, value: string) => {
    if (!editingGateway) return;
    setEditingGateway({
      ...editingGateway,
      configuration: {
        ...editingGateway.configuration,
        [key]: value,
      },
    });
  };

  const addInstructionStep = () => {
    setEditInstructions([
      ...editInstructions,
      {
        id: `temp-${Date.now()}`,
        gateway_id: editingGateway!.id,
        step_number: editInstructions.length + 1,
        title: '',
        description: '',
        created_at: new Date().toISOString(),
      },
    ]);
  };

  const updateInstructionStep = (index: number, field: 'title' | 'description', value: string) => {
    const updated = [...editInstructions];
    updated[index] = { ...updated[index], [field]: value };
    setEditInstructions(updated);
  };

  const removeInstructionStep = (index: number) => {
    const updated = editInstructions.filter((_, i) => i !== index);
    updated.forEach((inst, i) => {
      inst.step_number = i + 1;
    });
    setEditInstructions(updated);
  };

  const getGatewayIcon = (type: string) => {
    switch (type) {
      case 'paynow':
        return '💳';
      case 'paypal':
        return '🅿️';
      case 'stripe':
        return '💠';
      case 'cash':
        return '💵';
      default:
        return '🏦';
    }
  };

  const filteredGateways = gateways.filter(gateway =>
    gateway.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    gateway.gateway_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    gateway.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && gateways.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-cyan-600" />
            <div>
              <h1 className={`text-2xl font-bold ${textPrimary}`}>Payment Gateways</h1>
              <p className={`text-sm ${textSecondary}`}>Configure payment methods for your store</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${textSecondary}`} />
              <input
                type="text"
                placeholder="Search gateways..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-9 pr-4 py-1.5 text-sm border ${borderColor} rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 ${isDark ? 'bg-gray-800 text-gray-100' : 'bg-white'
                  } w-full md:w-64`}
              />
            </div>
            <div className={`flex items-center border ${borderColor} rounded-lg p-1`}>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition ${viewMode === 'grid'
                  ? 'bg-cyan-600 text-white'
                  : `${textSecondary} hover:bg-gray-100 dark:hover:bg-gray-700`
                  }`}
                title="Grid view"
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition ${viewMode === 'list'
                  ? 'bg-cyan-600 text-white'
                  : `${textSecondary} hover:bg-gray-100 dark:hover:bg-gray-700`
                  }`}
                title="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={() => setShowAddManual(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gradient-to-r from-cyan-600 to-green-600 text-white rounded-lg hover:from-cyan-700 hover:to-green-700 transition"
            >
              <Plus className="h-4 w-4" />
              Add Gateway
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg flex items-start space-x-2 text-sm ${message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
            : 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
            }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredGateways.map((gateway) => (
            <div
              key={gateway.id}
              className={`${cardBg} rounded-2xl shadow-sm border ${borderColor} p-6 transition-all hover:shadow-xl hover:-translate-y-1 group duration-300 relative overflow-hidden`}
            >
              <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
                <span className="text-6xl grayscale">{getGatewayIcon(gateway.gateway_type)}</span>
              </div>

              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="flex items-center gap-4">
                  <span className="text-4xl shadow-sm bg-gray-50 dark:bg-gray-700/50 rounded-xl p-2">{getGatewayIcon(gateway.gateway_type)}</span>
                  <div>
                    <h3 className={`text-lg font-bold ${textPrimary} tracking-tight`}>{gateway.display_name}</h3>
                    {gateway.is_active ? (
                      <span className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-100/50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center mt-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className={`text-xs ${textSecondary} mb-6 line-clamp-2 min-h-[2.5em] relative z-10 font-medium leading-relaxed`}>
                {gateway.description}
              </p>

              <div className="flex items-center gap-3 mt-auto relative z-10">
                <button
                  onClick={() => handleEdit(gateway)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition dark:bg-gray-700/50 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Configure
                </button>
                <button
                  onClick={() => handleToggleActive(gateway)}
                  className={`flex items-center justify-center p-2.5 rounded-xl transition ${gateway.is_active
                    ? 'bg-emerald-50 text-emerald-600 hover:bg-red-50 hover:text-red-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                    : 'bg-gray-50 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 dark:bg-gray-800 dark:text-gray-500'
                    }`}
                  title={gateway.is_active ? "Disable Gateway" : "Enable Gateway"}
                >
                  {gateway.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                </button>
                {gateway.gateway_type === 'manual' && (
                  <button
                    onClick={() => handleDelete(gateway)}
                    className="p-2.5 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition dark:hover:bg-red-900/30"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredGateways.map((gateway) => (
            <div
              key={gateway.id}
              className={`${cardBg} rounded-xl shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-gray-700 p-5 transition-all hover:shadow-lg group flex items-center gap-6 relative overflow-hidden`}
            >
              {/* Selection Accent */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${gateway.is_active ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>

              <div className="flex-shrink-0">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${gateway.is_active ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'}`}>
                  {getGatewayIcon(gateway.gateway_type)}
                </div>
              </div>

              <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-4">
                  <h3 className={`text-base font-bold ${textPrimary} flex items-center gap-3`}>
                    {gateway.display_name}
                    {gateway.is_default && <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">Default</span>}
                  </h3>
                  <p className={`text-xs ${textSecondary} mt-1 truncate`}>{gateway.description}</p>
                </div>

                <div className="md:col-span-4 hidden md:flex flex-wrap gap-1.5">
                  {gateway.supported_currencies.map((currency) => (
                    <span
                      key={currency}
                      className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[10px] font-bold dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
                    >
                      {currency}
                    </span>
                  ))}
                </div>

                <div className="md:col-span-2 flex items-center">
                  {gateway.is_active ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 ring-1 ring-gray-200 dark:ring-gray-700">
                      Inactive
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                <button
                  onClick={() => handleEdit(gateway)}
                  className="p-2 text-gray-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition dark:text-gray-400 dark:hover:bg-cyan-900/20"
                  title="Configure"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleToggleActive(gateway)}
                  className={`p-2 rounded-lg transition ${gateway.is_active
                    ? 'text-emerald-600 hover:bg-red-50 hover:text-red-600 dark:text-emerald-400'
                    : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:text-gray-500'
                    }`}
                  title={gateway.is_active ? "Disable" : "Enable"}
                >
                  {gateway.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                </button>
                {gateway.gateway_type === 'manual' && (
                  <button
                    onClick={() => handleDelete(gateway)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition dark:hover:bg-red-900/20"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editingGateway && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className={`${cardBg} rounded-lg shadow-xl max-w-3xl w-full my-8`}>
            <div className={`p-4 border-b ${borderColor} flex items-center justify-between`}>
              <h2 className={`text-lg font-bold ${textPrimary} flex items-center gap-2`}>
                <Edit className="h-5 w-5 text-cyan-600" />
                Configure {editingGateway.display_name}
              </h2>
              <button
                onClick={() => {
                  setEditingGateway(null);
                  setEditInstructions([]);
                }}
                className={`${textSecondary} hover:text-gray-600 transition`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className={`block text-xs font-medium ${textPrimary} mb-1.5`}>
                    Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingGateway.display_name}
                    onChange={(e) =>
                      setEditingGateway({ ...editingGateway, display_name: e.target.value })
                    }
                    className={`w-full px-3 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
                      }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-medium ${textPrimary} mb-1.5`}>
                    Description
                  </label>
                  <textarea
                    value={editingGateway.description || ''}
                    onChange={(e) =>
                      setEditingGateway({ ...editingGateway, description: e.target.value })
                    }
                    rows={2}
                    className={`w-full px-3 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
                      }`}
                  />
                </div>

                {editingGateway.gateway_type === 'paynow' && (
                  <div className="space-y-3">
                    <h3 className={`text-sm font-semibold ${textPrimary}`}>PayNow Configuration</h3>
                    <div>
                      <label className={`block text-xs font-medium ${textPrimary} mb-1.5`}>
                        Integration ID *
                      </label>
                      <input
                        type="text"
                        required
                        value={editingGateway.configuration?.integration_id || ''}
                        onChange={(e) => updateConfigField('integration_id', e.target.value)}
                        className={`w-full px-3 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
                          }`}
                        placeholder="Enter your PayNow Integration ID"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium ${textPrimary} mb-1.5`}>
                        Integration Key *
                      </label>
                      <input
                        type="password"
                        required
                        value={editingGateway.configuration?.integration_key || ''}
                        onChange={(e) => updateConfigField('integration_key', e.target.value)}
                        className={`w-full px-3 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
                          }`}
                        placeholder="Enter your PayNow Integration Key"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium ${textPrimary} mb-1.5`}>
                        Return URL *
                      </label>
                      <input
                        type="url"
                        required
                        value={editingGateway.configuration?.return_url || ''}
                        onChange={(e) => updateConfigField('return_url', e.target.value)}
                        className={`w-full px-3 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
                          }`}
                        placeholder="https://yourdomain.com/payment/return"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium ${textPrimary} mb-1.5`}>
                        Result URL *
                      </label>
                      <input
                        type="url"
                        required
                        value={editingGateway.configuration?.result_url || ''}
                        onChange={(e) => updateConfigField('result_url', e.target.value)}
                        className={`w-full px-3 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
                          }`}
                        placeholder="https://yourdomain.com/payment/result"
                      />
                    </div>
                  </div>
                )}

                {editingGateway.gateway_type === 'paypal' && (
                  <div className="space-y-3">
                    <h3 className={`text-sm font-semibold ${textPrimary}`}>PayPal Configuration</h3>
                    <div>
                      <label className={`block text-xs font-medium ${textPrimary} mb-1.5`}>
                        Client ID *
                      </label>
                      <input
                        type="text"
                        required
                        value={editingGateway.configuration?.client_id || ''}
                        onChange={(e) => updateConfigField('client_id', e.target.value)}
                        className={`w-full px-3 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
                          }`}
                        placeholder="Enter your PayPal Client ID"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium ${textPrimary} mb-1.5`}>
                        Client Secret *
                      </label>
                      <input
                        type="password"
                        required
                        value={editingGateway.configuration?.client_secret || ''}
                        onChange={(e) => updateConfigField('client_secret', e.target.value)}
                        className={`w-full px-3 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
                          }`}
                        placeholder="Enter your PayPal Client Secret"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium ${textPrimary} mb-1.5`}>Mode *</label>
                      <select
                        value={editingGateway.configuration?.mode || 'sandbox'}
                        onChange={(e) => updateConfigField('mode', e.target.value)}
                        className={`w-full px-3 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
                          }`}
                      >
                        <option value="sandbox">Sandbox (Testing)</option>
                        <option value="live">Live (Production)</option>
                      </select>
                    </div>
                  </div>
                )}

                {editingGateway.gateway_type === 'stripe' && (
                  <div className="space-y-3">
                    <h3 className={`text-sm font-semibold ${textPrimary}`}>Stripe Configuration</h3>
                    <div>
                      <label className={`block text-xs font-medium ${textPrimary} mb-1.5`}>
                        Publishable Key *
                      </label>
                      <input
                        type="text"
                        required
                        value={editingGateway.configuration?.publishable_key || ''}
                        onChange={(e) => updateConfigField('publishable_key', e.target.value)}
                        className={`w-full px-3 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
                          }`}
                        placeholder="pk_test_..."
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium ${textPrimary} mb-1.5`}>
                        Secret Key *
                      </label>
                      <input
                        type="password"
                        required
                        value={editingGateway.configuration?.secret_key || ''}
                        onChange={(e) => updateConfigField('secret_key', e.target.value)}
                        className={`w-full px-3 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
                          }`}
                        placeholder="sk_test_..."
                      />
                    </div>
                  </div>
                )}

                {editingGateway.gateway_type === 'iveri' && (
                  <div className="space-y-3">
                    <h3 className={`text-sm font-semibold ${textPrimary}`}>iVeri Configuration</h3>
                    <div>
                      <label className={`block text-xs font-medium ${textPrimary} mb-1.5`}>
                        Application ID *
                      </label>
                      <input
                        type="text"
                        required
                        value={editingGateway.configuration?.application_id || ''}
                        onChange={(e) => updateConfigField('application_id', e.target.value)}
                        className={`w-full px-3 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
                          }`}
                        placeholder="{3b80...}"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium ${textPrimary} mb-1.5`}>
                        Certificate ID *
                      </label>
                      <input
                        type="text"
                        required
                        value={editingGateway.configuration?.certificate_id || ''}
                        onChange={(e) => updateConfigField('certificate_id', e.target.value)}
                        className={`w-full px-3 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
                          }`}
                        placeholder="{4c96...}"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium ${textPrimary} mb-1.5`}>Mode *</label>
                      <select
                        value={editingGateway.configuration?.mode || 'Live'}
                        onChange={(e) => updateConfigField('mode', e.target.value)}
                        className={`w-full px-3 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
                          }`}
                      >
                        <option value="Live">Live (Production)</option>
                        <option value="Test">Test (Sandbox)</option>
                      </select>
                    </div>
                  </div>
                )}

                {editingGateway.gateway_type === 'manual' && (
                  <div className="space-y-3">
                    <h3 className={`text-sm font-semibold ${textPrimary} flex items-center justify-between`}>
                      Payment Instructions
                      <button
                        type="button"
                        onClick={addInstructionStep}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-cyan-600 text-white rounded hover:bg-cyan-700 transition"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Step
                      </button>
                    </h3>
                    {editInstructions.map((instruction, index) => (
                      <div key={instruction.id} className={`p-3 border ${borderColor} rounded`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs font-medium ${textPrimary}`}>
                            Step {instruction.step_number}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeInstructionStep(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={instruction.title}
                          onChange={(e) => updateInstructionStep(index, 'title', e.target.value)}
                          placeholder="Step title"
                          className={`w-full px-2.5 py-1.5 mb-2 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
                            }`}
                        />
                        <textarea
                          value={instruction.description}
                          onChange={(e) =>
                            updateInstructionStep(index, 'description', e.target.value)
                          }
                          placeholder="Step description"
                          rows={2}
                          className={`w-full px-2.5 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
                            }`}
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2">
                  <label className={`flex items-center gap-3 cursor-pointer group`}>
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={editingGateway.is_active}
                        onChange={(e) => setEditingGateway({ ...editingGateway, is_active: e.target.checked })}
                      />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${editingGateway.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${editingGateway.is_active ? 'translate-x-4' : ''}`}></div>
                    </div>
                    <div>
                      <span className={`block text-xs font-bold ${textPrimary} group-hover:text-cyan-600 transition-colors`}>
                        {editingGateway.is_active ? 'Gateway is Active' : 'Gateway is Inactive'}
                      </span>
                      <span className={`text-[10px] ${textSecondary}`}>
                        Toggle to enable or disable this payment method for checkouts
                      </span>
                    </div>
                  </label>
                </div>

                <div>
                  <label className={`block text-xs font-medium ${textPrimary} mb-1.5`}>
                    General Instructions
                  </label>
                  <textarea
                    value={editingGateway.instructions || ''}
                    onChange={(e) =>
                      setEditingGateway({ ...editingGateway, instructions: e.target.value })
                    }
                    rows={3}
                    className={`w-full px-3 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
                      }`}
                    placeholder="Additional instructions for users"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setEditingGateway(null);
                    setEditInstructions([]);
                  }}
                  className={`px-4 py-1.5 text-sm border ${borderColor} rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-gradient-to-r from-cyan-600 to-green-600 text-white rounded hover:from-cyan-700 hover:to-green-700 transition disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddManual && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${cardBg} rounded-lg shadow-xl max-w-xl w-full`}>
            <div className={`p-4 border-b ${borderColor} flex items-center justify-between`}>
              <h2 className={`text-lg font-bold ${textPrimary}`}>Add Manual Payment Gateway</h2>
              <button
                onClick={() => setShowAddManual(false)}
                className={`${textSecondary} hover:text-gray-600 transition`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddManualGateway} className="p-4">
              <div className="space-y-3">
                <div>
                  <label className={`block text-xs font-medium ${textPrimary} mb-1.5`}>
                    Gateway Name * (lowercase, no spaces)
                  </label>
                  <input
                    type="text"
                    name="gateway_name"
                    required
                    pattern="[a-z_]+"
                    className={`w-full px-3 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
                      }`}
                    placeholder="bank_transfer"
                  />
                </div>

                <div>
                  <label className={`block text-xs font-medium ${textPrimary} mb-1.5`}>
                    Display Name *
                  </label>
                  <input
                    type="text"
                    name="display_name"
                    required
                    className={`w-full px-3 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
                      }`}
                    placeholder="Bank Transfer"
                  />
                </div>

                <div>
                  <label className={`block text-xs font-medium ${textPrimary} mb-1.5`}>
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={2}
                    className={`w-full px-3 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
                      }`}
                    placeholder="Pay via direct bank transfer"
                  />
                </div>

                <div>
                  <label className={`block text-xs font-medium ${textPrimary} mb-1.5`}>
                    Instructions *
                  </label>
                  <textarea
                    name="instructions"
                    required
                    rows={4}
                    className={`w-full px-3 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
                      }`}
                    placeholder="To pay via bank transfer:&#10;1. Transfer to: Account Name&#10;2. Bank: Bank Name&#10;3. Account Number: 1234567890&#10;4. Reference: Your Order Number"
                  />
                </div>

                <div>
                  <label className={`block text-xs font-medium ${textPrimary} mb-1.5`}>
                    Logo URL (optional)
                  </label>
                  <input
                    type="url"
                    name="logo_url"
                    className={`w-full px-3 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
                      }`}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddManual(false)}
                  className={`px-4 py-1.5 text-sm border ${borderColor} rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-gradient-to-r from-cyan-600 to-green-600 text-white rounded hover:from-cyan-700 hover:to-green-700 transition"
                >
                  <Plus className="h-4 w-4" />
                  Add Gateway
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

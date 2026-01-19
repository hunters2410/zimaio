import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { DollarSign, Save, AlertCircle, RefreshCw, TrendingUp, Info } from 'lucide-react';

interface Currency {
  code: string;
  name: string;
  symbol: string;
  exchange_rate: number;
  is_active: boolean;
}

interface VendorCurrencyRate {
  id: string;
  vendor_id: string;
  currency_code: string;
  exchange_rate: number;
  is_active: boolean;
  updated_at: string;
}

export function VendorCurrencyManagement() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [vendorRates, setVendorRates] = useState<VendorCurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [editableRates, setEditableRates] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: vendorProfile, error: vendorError } = await supabase
        .from('vendor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (vendorError) throw vendorError;
      setVendorId(vendorProfile.id);

      const [currenciesRes, ratesRes] = await Promise.all([
        supabase
          .from('currencies')
          .select('*')
          .eq('is_active', true)
          .in('code', ['USD', 'ZWL'])
          .order('code'),
        supabase
          .from('vendor_currency_rates')
          .select('*')
          .eq('vendor_id', vendorProfile.id)
      ]);

      if (currenciesRes.error) throw currenciesRes.error;
      if (ratesRes.error) throw ratesRes.error;

      setCurrencies(currenciesRes.data || []);
      setVendorRates(ratesRes.data || []);

      const rates: Record<string, string> = {};
      (ratesRes.data || []).forEach(rate => {
        rates[rate.currency_code] = rate.exchange_rate.toString();
      });
      setEditableRates(rates);

    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRateChange = (currencyCode: string, value: string) => {
    if (currencyCode === 'USD') return;

    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setEditableRates(prev => ({
        ...prev,
        [currencyCode]: value
      }));
    }
  };

  const handleSave = async () => {
    if (!vendorId) return;

    setSaving(true);
    setMessage(null);

    try {
      for (const [currencyCode, rateStr] of Object.entries(editableRates)) {
        if (currencyCode === 'USD') continue;

        const rate = parseFloat(rateStr);
        if (isNaN(rate) || rate <= 0) {
          throw new Error(`Invalid exchange rate for ${currencyCode}`);
        }

        const existingRate = vendorRates.find(r => r.currency_code === currencyCode);

        if (existingRate) {
          const { error } = await supabase
            .from('vendor_currency_rates')
            .update({ exchange_rate: rate })
            .eq('id', existingRate.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('vendor_currency_rates')
            .insert({
              vendor_id: vendorId,
              currency_code: currencyCode,
              exchange_rate: rate,
              is_active: true
            });

          if (error) throw error;
        }
      }

      setMessage({ type: 'success', text: 'Exchange rates updated successfully' });
      fetchData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update rates' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToSystem = async (currencyCode: string) => {
    if (currencyCode === 'USD') return;

    const systemCurrency = currencies.find(c => c.code === currencyCode);
    if (!systemCurrency) return;

    setEditableRates(prev => ({
      ...prev,
      [currencyCode]: systemCurrency.exchange_rate.toString()
    }));
  };

  const calculateConversion = (fromCode: string, toCode: string, amount: number = 1) => {
    if (fromCode === toCode) return amount;

    const fromRate = parseFloat(editableRates[fromCode] || '1');
    const toRate = parseFloat(editableRates[toCode] || '1');

    const usdAmount = amount / fromRate;
    return (usdAmount * toRate).toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <DollarSign className="h-6 w-6 text-cyan-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Currency Management</h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Set your custom exchange rates for product pricing
        </p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">About Exchange Rates</p>
          <ul className="list-disc list-inside space-y-1">
            <li>USD is the base currency and always has a rate of 1.0</li>
            <li>Set your own ZWL exchange rate based on your pricing strategy</li>
            <li>Rates are applied to all your products automatically</li>
            <li>You can update rates at any time</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {currencies.map(currency => {
          const currentRate = editableRates[currency.code] || currency.exchange_rate.toString();
          const vendorRate = vendorRates.find(r => r.currency_code === currency.code);
          const systemRate = currency.exchange_rate;
          const isUSD = currency.code === 'USD';

          return (
            <div key={currency.code} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-cyan-500 to-green-500 text-white text-lg font-bold rounded-lg p-3">
                    {currency.symbol}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {currency.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{currency.code}</p>
                  </div>
                </div>
                {isUSD && (
                  <span className="px-2 py-1 bg-cyan-100 text-cyan-800 text-xs font-medium rounded-full">
                    Base Currency
                  </span>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Exchange Rate (1 USD = ? {currency.code})
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={currentRate}
                    onChange={(e) => handleRateChange(currency.code, e.target.value)}
                    disabled={isUSD}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                      isUSD
                        ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
                        : 'bg-white dark:bg-gray-800'
                    } border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100`}
                    placeholder="Enter rate"
                  />
                  {!isUSD && (
                    <button
                      onClick={() => handleResetToSystem(currency.code)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-cyan-600 transition"
                      title="Reset to system rate"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {!isUSD && (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <span className="text-gray-600 dark:text-gray-400">System Rate:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {systemRate}
                    </span>
                  </div>
                  {vendorRate && (
                    <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                      <span className="text-gray-600 dark:text-gray-400">Your Current Rate:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {vendorRate.exchange_rate}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between p-2 bg-cyan-50 dark:bg-cyan-900/20 rounded">
                    <span className="text-gray-600 dark:text-gray-400">Last Updated:</span>
                    <span className="font-medium text-cyan-700 dark:text-cyan-400">
                      {vendorRate
                        ? new Date(vendorRate.updated_at).toLocaleDateString()
                        : 'Not set'
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-cyan-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Conversion Examples
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gradient-to-br from-cyan-50 to-green-50 dark:from-cyan-900/20 dark:to-green-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">USD to ZWL</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              $100 = Z${calculateConversion('USD', 'ZWL', 100)}
            </p>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-50 to-cyan-50 dark:from-green-900/20 dark:to-cyan-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">ZWL to USD</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Z$1000 = ${calculateConversion('ZWL', 'USD', 1000)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-green-600 text-white rounded-lg hover:from-cyan-700 hover:to-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-5 w-5" />
          <span>{saving ? 'Saving...' : 'Save Exchange Rates'}</span>
        </button>
      </div>
    </div>
  );
}

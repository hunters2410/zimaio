import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface Currency {
  code: string;
  name: string;
  symbol: string;
  exchange_rate: number;
}

interface CurrencyContextType {
  currency: string;
  currencies: Currency[];
  setCurrency: (currency: string) => void;
  formatPrice: (price: number, productCurrency?: string) => string;
  convertPrice: (price: number, fromCurrency: string, toCurrency: string) => number;
  getCurrencySymbol: (currencyCode: string) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<string>('USD');
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  useEffect(() => {
    const savedCurrency = localStorage.getItem('preferredCurrency');
    if (savedCurrency && ['USD', 'ZWL'].includes(savedCurrency)) {
      setCurrencyState(savedCurrency);
    }

    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    const { data } = await supabase
      .from('currencies')
      .select('*')
      .eq('is_active', true)
      .in('code', ['USD', 'ZWL'])
      .order('code');

    if (data) {
      setCurrencies(data);
    }
  };

  const setCurrency = (newCurrency: string) => {
    if (!['USD', 'ZWL'].includes(newCurrency)) {
      newCurrency = 'USD';
    }
    setCurrencyState(newCurrency);
    localStorage.setItem('preferredCurrency', newCurrency);
  };

  const getCurrencySymbol = (currencyCode: string): string => {
    const curr = currencies.find(c => c.code === currencyCode);
    return curr?.symbol || '$';
  };

  const convertPrice = (price: number, fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) {
      return price;
    }

    const fromRate = currencies.find(c => c.code === fromCurrency)?.exchange_rate || 1;
    const toRate = currencies.find(c => c.code === toCurrency)?.exchange_rate || 1;

    const usdAmount = price / fromRate;
    return usdAmount * toRate;
  };

  const formatPrice = (price: number, productCurrency: string = 'USD'): string => {
    const convertedPrice = convertPrice(price, productCurrency, currency);
    const symbol = getCurrencySymbol(currency);

    return `${symbol}${convertedPrice.toFixed(2)}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, currencies, setCurrency, formatPrice, convertPrice, getCurrencySymbol }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

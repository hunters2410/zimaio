import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface VATSettings {
    is_enabled: boolean;
    default_rate: number;
    commission_enabled: boolean;
    commission_rate: number;
}

interface SettingsContextType {
    settings: VATSettings | null;
    calculatePrice: (basePrice: number) => {
        commission: number;
        vat: number;
        total: number;
    };
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<VATSettings | null>(null);

    useEffect(() => {
        fetchSettings();

        // Subscribe to realtime changes
        const subscription = supabase
            .channel('vat_settings_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'vat_settings' },
                () => {
                    fetchSettings();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchSettings = async () => {
        const { data, error } = await supabase
            .from('vat_settings')
            .select('*')
            .maybeSingle();

        if (error) {
            console.error('Error fetching VAT settings:', error);
            return;
        }

        if (data) {
            setSettings({
                is_enabled: data.is_enabled,
                default_rate: data.default_rate,
                commission_enabled: data.commission_enabled,
                commission_rate: data.commission_rate
            });
        }
    };

    const calculatePrice = (basePrice: number) => {
        if (!settings) return { commission: 0, vat: 0, total: basePrice };

        const commRate = settings.commission_rate || 10.00;

        const commission = settings.commission_enabled
            ? basePrice * (commRate / 100)
            : 0;

        const priceWithComm = basePrice + commission;

        const vat = settings.is_enabled
            ? priceWithComm * (settings.default_rate / 100)
            : 0;

        return {
            commission,
            vat,
            total: priceWithComm + vat
        };
    };

    return (
        <SettingsContext.Provider value={{ settings, calculatePrice }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}

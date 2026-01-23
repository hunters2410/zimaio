import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface SiteSettings {
    site_name: string;
    site_tagline: string;
    site_logo: string;
    footer_text: string;
    support_email: string;
    sales_email: string;
    contact_phone: string;
    office_address: string;
    facebook_url: string;
    twitter_url: string;
    instagram_url: string;
    font_family: string;
    maintenance_mode: string;
    ga_id: string;
}

interface SiteSettingsContextType {
    settings: SiteSettings;
    loading: boolean;
    refreshSettings: () => Promise<void>;
}

const defaultSettings: SiteSettings = {
    site_name: 'ZimAIO Marketplace',
    site_tagline: 'Everything you need, all in one place',
    site_logo: '/zimaio_mineral_edition,_no_background_v1.2.png',
    footer_text: '© 2026 ZimAIO. All rights reserved.',
    support_email: 'support@zimaio.com',
    sales_email: 'sales@zimaio.com',
    contact_phone: '+263 77 123 4567',
    office_address: '123 Samora Machel Ave, Harare',
    facebook_url: 'https://facebook.com/zimaio',
    twitter_url: 'https://twitter.com/zimaio',
    instagram_url: 'https://instagram.com/zimaio',
    font_family: 'Inter',
    maintenance_mode: 'false',
    ga_id: ''
};

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('site_settings')
                .select('setting_key, setting_value');

            if (error) throw error;

            if (data) {
                const settingsObj: any = { ...defaultSettings };
                data.forEach((item) => {
                    settingsObj[item.setting_key] = item.setting_value;
                });
                setSettings(settingsObj);
            }
        } catch (error) {
            console.error('Error fetching site settings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();

        // Subscribe to changes
        const subscription = supabase
            .channel('site_settings_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, () => {
                fetchSettings();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const refreshSettings = async () => {
        await fetchSettings();
    };

    return (
        <SiteSettingsContext.Provider value={{ settings, loading, refreshSettings }}>
            {children}
        </SiteSettingsContext.Provider>
    );
}

export function useSiteSettings() {
    const context = useContext(SiteSettingsContext);
    if (context === undefined) {
        throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
    }
    return context;
}

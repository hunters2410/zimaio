import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { Construction, Mail, Phone } from 'lucide-react';

export function MaintenancePage() {
    const { settings } = useSiteSettings();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 max-w-lg w-full border border-gray-100">
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-600 animate-pulse">
                    <Construction className="w-10 h-10" />
                </div>

                <h1 className="text-3xl font-black text-gray-900 mb-4 uppercase tracking-tight">
                    Under Maintenance
                </h1>

                <p className="text-gray-600 mb-8 leading-relaxed">
                    We are currently performing scheduled maintenance to improve your experience.
                    Please check back soon.
                </p>

                <div className="space-y-4">
                    {settings.support_email && (
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                            <Mail className="w-4 h-4" />
                            <span>{settings.support_email}</span>
                        </div>
                    )}
                    {settings.contact_phone && (
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                            <Phone className="w-4 h-4" />
                            <span>{settings.contact_phone}</span>
                        </div>
                    )}
                </div>

                <div className="mt-8 pt-8 border-t border-gray-100">
                    <img
                        src={settings.site_logo || "/zimaio_mineral_edition,_no_background_v1.2.png"}
                        alt="Logo"
                        className="h-8 mx-auto opacity-50 grayscale hover:grayscale-0 transition-all"
                    />
                </div>
            </div>
            <p className="mt-8 text-xs text-gray-400 font-medium uppercase tracking-widest">
                {settings.site_name} &copy; {new Date().getFullYear()}
            </p>
        </div>
    );
}

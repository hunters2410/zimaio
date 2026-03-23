import { useState, useEffect } from 'react';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { Rocket, Mail, Phone, UserPlus, Store } from 'lucide-react';
import { Link } from 'react-router-dom';

export function MaintenancePage() {
    const { settings } = useSiteSettings();
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

    useEffect(() => {
        if (!settings.maintenance_end_time) return;

        const timer = setInterval(() => {
            const end = new Date(settings.maintenance_end_time).getTime();
            const now = new Date().getTime();
            const distance = end - now;

            if (distance < 0) {
                clearInterval(timer);
                setTimeLeft(null);
                return;
            }

            setTimeLeft({
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000)
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [settings.maintenance_end_time]);

    const CountdownBox = ({ value, label }: { value: number; label: string }) => (
        <div className="flex flex-col items-center">
            <div className="bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-100 dark:border-cyan-800 rounded-xl px-4 py-2 min-w-[64px]">
                <span className="text-xl md:text-2xl font-black text-cyan-600 dark:text-cyan-400 tabular-nums">
                    {value < 10 ? `0${value}` : value}
                </span>
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">{label}</span>
        </div>
    );

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-6 font-sans antialiased">
            <div className="max-w-md w-full text-center">
                {/* Logo Section */}
                <div className="flex justify-center mb-8">
                    <img
                        src={settings.site_logo}
                        alt={settings.site_name}
                        className="h-16 md:h-20 w-auto object-contain"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                </div>

                {/* Status Indicator */}
                <div className="flex justify-center mb-6">
                    <div className="bg-cyan-50 dark:bg-cyan-900/20 p-4 rounded-full border border-cyan-100 dark:border-cyan-800 overflow-hidden relative">
                        <Rocket className="h-8 w-8 text-cyan-600 dark:text-cyan-400" />
                    </div>
                </div>

                <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">
                    Coming Soon
                </h1>

                <p className="text-sm md:text-base font-medium text-gray-500 dark:text-gray-400 mb-8 leading-relaxed max-w-sm mx-auto">
                    We're building Zimbabwe's premier online marketplace. Pre-register now to secure your spot and get early access!
                </p>

                {/* Pre-registration Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                    <Link
                        to="/pre-register"
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all text-sm uppercase tracking-widest"
                    >
                        <UserPlus className="w-4 h-4" />
                        Customer Sign Up
                    </Link>
                    <Link
                        to="/vendor-pre-register"
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:-translate-y-0.5 transition-all text-sm uppercase tracking-widest"
                    >
                        <Store className="w-4 h-4" />
                        Vendor Sign Up
                    </Link>
                </div>

                {/* Countdown Timer */}
                {timeLeft && (
                    <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        <p className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-[0.2em] mb-4">Estimated Launch In</p>
                        <div className="flex items-center justify-center gap-3">
                            {timeLeft.days > 0 && <CountdownBox value={timeLeft.days} label="Days" />}
                            <CountdownBox value={timeLeft.hours} label="Hrs" />
                            <CountdownBox value={timeLeft.minutes} label="Min" />
                            <CountdownBox value={timeLeft.seconds} label="Sec" />
                        </div>
                    </div>
                )}

                {/* Contact Info */}
                <div className="flex flex-col items-center gap-4 py-6 border-y border-gray-100 dark:border-slate-800 mb-8">
                    {settings.support_email && (
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-tight">
                            <Mail className="h-4 w-4 text-cyan-600" />
                            <span>{settings.support_email}</span>
                        </div>
                    )}
                    {settings.contact_phone && (
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-tight">
                            <Phone className="h-4 w-4 text-green-600" />
                            <span>{settings.contact_phone}</span>
                        </div>
                    )}
                </div>

                {/* Branding Accent */}
                <div className="h-1.5 w-32 mx-auto bg-gradient-to-r from-cyan-500 to-green-500 rounded-full opacity-50 mb-8"></div>

                <p className="text-[10px] font-black text-gray-400 dark:text-slate-600 uppercase tracking-[0.3em]">
                    © {new Date().getFullYear()} {settings.site_name}
                </p>
            </div>
        </div>
    );
}

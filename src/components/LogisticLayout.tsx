import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    Users,
    Zap,
    User,
    LogOut,
    Menu,
    Bell,
    Settings,
    Search,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { ReactNode, useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { supabase } from '../lib/supabase';

interface LogisticLayoutProps {
    children: ReactNode;
}

interface NavItem {
    path: string;
    label: string;
    icon: ReactNode;
    section: string;
}

const navItems: NavItem[] = [
    { path: '/logistic/dashboard', label: 'Overview', icon: <LayoutDashboard className="h-5 w-5" />, section: 'Main' },
    { path: '/logistic/fleet', label: 'Fleet Registry', icon: <Users className="h-5 w-5" />, section: 'Operations' },
    { path: '/logistic/shipping', label: 'Shipping Rates', icon: <Zap className="h-5 w-5" />, section: 'Operations' },
    { path: '/logistic/orders', label: 'Delivery Requests', icon: <Package className="h-5 w-5" />, section: 'Operations' },
    { path: '/logistic/profile', label: 'Company Profile', icon: <User className="h-5 w-5" />, section: 'Settings' },
    { path: '/logistic/notifications', label: 'System Notifications', icon: <Bell className="h-5 w-5" />, section: 'Settings' },
    { path: '/logistic/settings', label: 'System Settings', icon: <Settings className="h-5 w-5" />, section: 'Settings' },
];

export function LogisticLayout({ children }: LogisticLayoutProps) {
    const { user, profile, signOut } = useAuth();
    const { settings } = useSiteSettings();
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [companyName, setCompanyName] = useState<string>('Carrier Partner');
    // const isDark = theme === 'dark'; // Removed dark mode check

    useEffect(() => {
        const fetchCompanyName = async () => {
            if (user) {
                const { data } = await supabase
                    .from('logistics_profiles')
                    .select('company_name')
                    .eq('user_id', user.id)
                    .single();
                if (data?.company_name) {
                    setCompanyName(data.company_name);
                }
            }
        };
        fetchCompanyName();
    }, [user]);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const sections = Array.from(new Set(navItems.map(item => item.section)));

    return (
        <div className={`min-h-screen bg-white text-slate-900 flex font-sans transition-colors duration-300`}>
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 transition-all duration-500 ease-in-out transform 
                ${isSidebarOpen ? 'w-72' : 'w-20'} 
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                bg-white border-slate-200 
                border-r shadow-2xl overflow-hidden flex flex-col`}
            >
                {/* Logo Section */}
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`flex-shrink-0 transition-all duration-500 ${isSidebarOpen ? 'w-full px-2' : 'w-10 h-10'} flex items-center justify-center`}>
                            <img
                                src={settings.site_logo}
                                alt={settings.site_name}
                                className={`${isSidebarOpen ? 'h-10' : 'h-8'} w-auto object-contain`}
                                onError={(e) => {
                                    e.currentTarget.src = '/zimaio_mineral_edition,_no_background_v1.2.png';
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-8 custom-scrollbar">
                    {sections.map(section => (
                        <div key={section} className="space-y-2">
                            {isSidebarOpen && (
                                <p className="px-4 text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-4 opacity-80">
                                    {section}
                                </p>
                            )}
                            <div className="space-y-1">
                                {navItems.filter(item => item.section === section).map((item) => {
                                    const isActive = location.pathname === item.path;
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${isActive
                                                ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 scale-[1.02]'
                                                : 'text-slate-900 hover:bg-slate-100 hover:text-emerald-500'
                                                }`}
                                        >
                                            <div className={`${isActive ? 'text-white' : 'group-hover:text-emerald-500'} transition-colors duration-300`}>
                                                {item.icon}
                                            </div>
                                            {isSidebarOpen && <span className="font-bold text-sm tracking-tight">{item.label}</span>}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-slate-200">
                    <div className={`p-4 rounded-3xl bg-slate-50 transition-all`}>
                        {isSidebarOpen && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-[10px] font-black text-slate-700 font-black uppercase tracking-widest">System Online</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col transition-all duration-500 ease-in-out ${isSidebarOpen ? 'lg:pl-72' : 'lg:pl-20'}`}>
                {/* Header */}
                <header className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-colors duration-300 bg-white/80 border-slate-200`}>
                    <div className="h-20 px-8 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className={`hidden lg:flex p-2.5 rounded-xl border transition-all border-slate-300 hover:bg-slate-100 text-slate-700`}
                            >
                                {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                            </button>
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className={`lg:hidden p-2.5 rounded-xl border transition-all border-slate-300 text-slate-700`}
                            >
                                <Menu className="h-5 w-5" />
                            </button>

                            {/* Search */}
                            <div className="hidden md:flex items-center relative group">
                                <Search className="absolute left-4 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Global Logistics Search..."
                                    className={`pl-11 pr-6 py-2.5 rounded-xl text-sm font-bold border outline-none transition-all w-72 focus:w-96 bg-white border-slate-300 focus:border-emerald-500 text-slate-900 placeholder:text-slate-600`}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleSignOut}
                                className="p-3 rounded-xl border border-slate-200 hover:bg-rose-50 text-slate-600 hover:text-rose-500 transition-all"
                                title="Sign Out"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>

                            <button className={`p-3 rounded-xl border relative transition-all border-slate-200 hover:bg-slate-100 text-slate-600`}>
                                <Bell className="h-5 w-5" />
                                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white"></span>
                            </button>

                            <div className="h-10 w-px bg-slate-200 mx-2 hidden sm:block"></div>

                            <div
                                onClick={() => navigate('/logistic/profile')}
                                className="flex items-center gap-4 group cursor-pointer p-1 rounded-2xl hover:bg-slate-100 transition-all px-3"
                            >
                                <div className="text-right hidden sm:block">
                                    <p className={`text-sm font-black tracking-tight text-slate-900`}>{companyName}</p>
                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{profile?.role || 'Logistics'}</p>
                                </div>
                                <div className="w-11 h-11 bg-gradient-to-tr from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-emerald-500/20">
                                    {companyName.charAt(0) || <User className="h-6 w-6" />}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Viewport */}
                <main className="flex-1 p-8 overflow-y-auto">
                    {children}
                </main>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-40 lg:hidden animate-in fade-in duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
        </div>
    );
}

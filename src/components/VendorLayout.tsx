import { useRef, useEffect, useLayoutEffect, useState, ReactNode } from 'react';
import { VendorNotifications } from './vendor/VendorNotifications';
import { Link, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingCart,
    Archive,
    CreditCard,
    Settings,
    Menu,
    X,
    Search,
    Zap,
    Shield,
    Package,
    LogOut,
    ChevronRight,
    ChevronLeft,
    ExternalLink,
    Maximize as Scan,
    RotateCcw,
    Megaphone,
    TrendingUp,
    MessageCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { supabase } from '../lib/supabase';

interface VendorLayoutProps {
    children: ReactNode;
    activeTab: string;
    onTabChange: (tab: string) => void;
    shopName?: string;
    hasPosAccess?: boolean;
}

interface NavItem {
    id: string; // Use id instead of path for tab switching
    label: string;
    icon: ReactNode;
    section: string;
}

const navItems: NavItem[] = [
    { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, section: 'Main' },
    { id: 'pos', label: 'Point of Sale (POS)', icon: <Scan className="h-5 w-5" />, section: 'Main' },
    { id: 'messages', label: 'Customer Messages', icon: <MessageCircle className="h-5 w-5" />, section: 'Main' },
    { id: 'orders', label: 'Orders', icon: <ShoppingCart className="h-5 w-5" />, section: 'Shop Management' },
    { id: 'products', label: 'Products', icon: <Archive className="h-5 w-5" />, section: 'Shop Management' },
    { id: 'wallet', label: 'Wallet Management', icon: <CreditCard className="h-5 w-5" />, section: 'Shop Management' },
    { id: 'refunds', label: 'Refunds', icon: <RotateCcw className="h-5 w-5" />, section: 'Shop Management' },
    { id: 'ads', label: 'Ads & Marketing', icon: <Megaphone className="h-5 w-5" />, section: 'Shop Management' },
    { id: 'reports', label: 'Reports & Analytics', icon: <TrendingUp className="h-5 w-5" />, section: 'Shop Management' },
    { id: 'packages', label: 'Vendor Packages', icon: <Package className="h-5 w-5" />, section: 'Shop Management' },
    { id: 'kyc', label: 'KYC Verification', icon: <Shield className="h-5 w-5" />, section: 'Configuration' },
    { id: 'settings', label: 'Shop Settings', icon: <Settings className="h-5 w-5" />, section: 'Configuration' },
];

export function VendorLayout({ children, activeTab, onTabChange, hasPosAccess = false }: VendorLayoutProps) {
    const filteredNavItems = navItems.filter(item => {
        if (item.id === 'pos' && !hasPosAccess) return false;
        return true;
    });

    const filteredSections = Array.from(new Set(filteredNavItems.map(item => item.section)));

    const navigate = useNavigate();
    const { signOut, profile } = useAuth();
    const { settings } = useSiteSettings();
    // const { theme, toggleTheme } = useTheme(); // Theme removed
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        const saved = localStorage.getItem('vendor-sidebar-collapsed');
        return saved === 'true';
    });

    const [quickActionsOpen, setQuickActionsOpen] = useState(false);
    const [quickActionSearch, setQuickActionSearch] = useState('');
    const quickActionRef = useRef<HTMLDivElement>(null);
    const sidebarRef = useRef<HTMLElement>(null);

    // Close quick actions on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (quickActionRef.current && !quickActionRef.current.contains(event.target as Node)) {
                setQuickActionsOpen(false);
            }
        };

        if (quickActionsOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [quickActionsOpen]);

    useEffect(() => {
        localStorage.setItem('vendor-sidebar-collapsed', sidebarCollapsed.toString());
    }, [sidebarCollapsed]);

    useLayoutEffect(() => {
        const sidebar = sidebarRef.current;
        if (sidebar) {
            // Restore scroll position immediately on mount
            const savedScroll = sessionStorage.getItem('vendorSidebarScroll');
            if (savedScroll) {
                sidebar.scrollTop = parseInt(savedScroll, 10);
            }
        }
    }, []);

    const [kycStatus, setKycStatus] = useState<string | null>(null);

    useEffect(() => {
        if (profile?.id) {
            supabase
                .from('vendor_profiles')
                .select('kyc_status')
                .eq('user_id', profile.id)
                .maybeSingle()
                .then(({ data }) => {
                    if (data) setKycStatus(data.kyc_status);
                });
        }
    }, [profile?.id]);

    const saveScrollPosition = () => {
        if (sidebarRef.current) {
            sessionStorage.setItem('vendorSidebarScroll', sidebarRef.current.scrollTop.toString());
        }
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    // Filter items for dropdown
    const filteredQuickItems = navItems.filter(item =>
        item.label.toLowerCase().includes(quickActionSearch.toLowerCase()) ||
        item.section.toLowerCase().includes(quickActionSearch.toLowerCase())
    );

    const groupedQuickItems = filteredQuickItems.reduce((acc, item) => {
        if (!acc[item.section]) acc[item.section] = [];
        acc[item.section].push(item);
        return acc;
    }, {} as Record<string, NavItem[]>);

    const isDark = false; // Forced light mode
    const bgColor = 'bg-[#fcfcfc]'; // Lighter background for light mode
    const sidebarBg = 'bg-white';
    const headerBg = 'bg-white/80';
    const borderColor = 'border-slate-200';
    const textPrimary = 'text-slate-900';
    const textSecondary = 'text-slate-500';
    const hoverBg = 'hover:bg-slate-50';
    const activeItemBg = 'bg-emerald-50 text-emerald-700';

    const expandedWidth = 'w-72';
    const collapsedWidth = 'w-20';

    return (
        <div className={`min-h-screen ${bgColor} font-sans transition-colors duration-300`}>

            {/* Sidebar */}
            <aside
                ref={sidebarRef}
                className={`
          fixed top-0 left-0 bottom-0 z-50
          ${sidebarCollapsed ? collapsedWidth : expandedWidth}
          ${sidebarBg} border-r ${borderColor}
          flex flex-col
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          shadow-xl lg:shadow-none
        `}
            >
                {/* Sidebar Header */}
                <div className={`
                    h-20 flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between px-6'}
                    border-b ${borderColor}
                `}>
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`shrink-0 transition-all duration-300 ${sidebarCollapsed ? 'w-10 h-10' : 'w-40 h-12'} flex items-center justify-center`}>
                            <img
                                src={settings.site_logo}
                                alt={settings.site_name}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                    e.currentTarget.src = '/zimaio_mineral_edition,_no_background_v1.2.png';
                                }}
                            />
                        </div>
                    </div>
                    {!sidebarCollapsed && (
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-2 text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">
                    {filteredSections.map(section => (
                        <div key={section} className="mb-8">
                            {!sidebarCollapsed && (
                                <h3 className={`text-[10px] font-bold uppercase tracking-widest ${textSecondary} mb-3 px-4`}>
                                    {section}
                                </h3>
                            )}
                            <div className="space-y-1">
                                {filteredNavItems
                                    .filter(item => item.section === section)
                                    .map(item => {
                                        const isActive = activeTab === item.id;
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => {
                                                    onTabChange(item.id);
                                                    setSidebarOpen(false);
                                                    saveScrollPosition();
                                                }}
                                                className={`
                          w-full group flex items-center ${sidebarCollapsed ? 'justify-center py-3' : 'px-4 py-3'}
                          rounded-xl transition-all duration-200
                          ${isActive ? activeItemBg + ' font-semibold' : `${textSecondary} ${hoverBg}`}
                          hover:shadow-sm
                        `}
                                                title={sidebarCollapsed ? item.label : ''}
                                            >
                                                <div className={`
                          ${isActive ? '' : 'group-hover:text-slate-800 dark:group-hover:text-slate-200'}
                          transition-colors duration-200
                        `}>
                                                    {item.icon}
                                                </div>

                                                {!sidebarCollapsed && (
                                                    <span className="ml-3 text-sm truncate">{item.label}</span>
                                                )}

                                                {isActive && !sidebarCollapsed && (
                                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                )}
                                            </button>
                                        );
                                    })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Sidebar Footer */}
                <div className={`p-4 border-t ${borderColor}`}>
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className={`
              w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-center gap-3'}
              p-3 rounded-xl
              ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-50 hover:bg-gray-100'}
              transition-colors duration-200 text-slate-500 hover:text-slate-700
            `}
                    >
                        {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                        {!sidebarCollapsed && <span className="text-sm font-semibold">Collapse Sidebar</span>}
                    </button>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content Area */}
            <div className={`
        min-h-screen flex flex-col
        transition-all duration-300 ease-in-out
        ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'}
      `}>

                {/* Top Header */}
                <header className={`
          sticky top-0 z-30
          h-20 px-4 sm:px-8
          ${headerBg} backdrop-blur-md
          border-b ${borderColor}
          flex items-center justify-between
        `}>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className={`lg:hidden p-2 rounded-xl ${hoverBg} text-slate-500`}
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        {/* KYC Global Reminder */}
                        {kycStatus !== 'approved' && kycStatus !== 'pending' && (
                            <div className="hidden xl:flex items-center gap-3 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl animate-in slide-in-from-left-4 duration-500">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-500">
                                    <Shield size={16} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-800 dark:text-blue-400 leading-none">KYC Required</p>
                                    <p className="text-[9px] font-bold text-blue-700/70 dark:text-blue-500/70 mt-1">Submit documents for full access</p>
                                </div>
                                <button
                                    onClick={() => onTabChange('kyc')}
                                    className="ml-2 text-[9px] font-black bg-blue-800 text-white px-3 py-1.5 rounded-lg hover:bg-blue-900 transition-all uppercase tracking-widest active:scale-95"
                                >
                                    Verify
                                </button>
                            </div>
                        )}

                        {/* Quick Actions Dropdown */}
                        <div className="relative" ref={quickActionRef}>
                            <button
                                onClick={() => {
                                    setQuickActionsOpen(!quickActionsOpen);
                                    if (!quickActionsOpen) setQuickActionSearch('');
                                }}
                                className={`hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all border border-transparent group shadow-lg shadow-emerald-500/20 active:scale-95 ${quickActionsOpen ? 'ring-2 ring-white/50 border-white' : ''}`}
                            >
                                <Zap className={`w-4 h-4 transition-colors ${quickActionsOpen ? 'text-white' : 'text-white/80 group-hover:text-white'}`} />
                                <span className="text-sm font-bold">Quick Actions</span>
                                <span className="ml-2 text-[10px] font-mono bg-white/20 px-1.5 py-0.5 rounded text-white/90">⌘K</span>
                            </button>

                            {quickActionsOpen && (
                                <div className="absolute top-full left-0 mt-2 w-80 max-h-[600px] bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                                    <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder="Search modules..."
                                                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                                value={quickActionSearch}
                                                onChange={(e) => setQuickActionSearch(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="overflow-y-auto max-h-[500px] p-2 custom-scrollbar">
                                        {Object.keys(groupedQuickItems).length === 0 ? (
                                            <div className="text-center py-8 text-slate-500">
                                                <p className="text-xs">No matching modules found.</p>
                                            </div>
                                        ) : (
                                            Object.entries(groupedQuickItems).map(([section, items]) => (
                                                <div key={section} className="mb-4 last:mb-0">
                                                    <h4 className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                        {section}
                                                    </h4>
                                                    <div className="space-y-0.5">
                                                        {items.map((item) => (
                                                            <button
                                                                key={item.id}
                                                                onClick={() => {
                                                                    onTabChange(item.id);
                                                                    setQuickActionsOpen(false);
                                                                }}
                                                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors group"
                                                            >
                                                                {item.icon}
                                                                <span className="text-sm font-medium">{item.label}</span>
                                                                {quickActionSearch && (
                                                                    <ChevronRight className="w-3 h-3 ml-auto text-slate-300 group-hover:text-emerald-500" />
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        <VendorNotifications />

                        <Link
                            to="/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 border border-transparent active:scale-95"
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span>View Site</span>
                        </Link>

                        <div className={`h-8 w-[1px] ${isDark ? 'bg-slate-700' : 'bg-slate-200'} mx-1`}></div>

                        <div className="flex items-center gap-3 pl-1">
                            <div className="text-right hidden sm:block">
                                <p className={`text-sm font-bold ${textPrimary} leading-none`}>{profile?.full_name || 'Vendor'}</p>
                                <p className={`text-xs ${textSecondary} mt-0.5`}>{profile?.email}</p>
                            </div>
                            <div className="relative group cursor-pointer">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-600 p-[2px]">
                                    <div className={`w-full h-full rounded-[10px] ${sidebarBg} flex items-center justify-center`}>
                                        <span className="font-bold text-transparent bg-clip-text bg-gradient-to-tr from-emerald-600 to-green-600">
                                            {profile?.full_name?.charAt(0) || 'V'}
                                        </span>
                                    </div>
                                </div>

                                <div className={`
                    absolute right-0 top-full mt-2 w-48 py-2 rounded-xl shadow-xl
                    ${sidebarBg} border ${borderColor}
                    opacity-0 invisible group-hover:opacity-100 group-hover:visible
                    transform translate-y-2 group-hover:translate-y-0
                    transition-all duration-200
                  `}>
                                    <button
                                        onClick={handleLogout}
                                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors`}
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 lg:p-10 overflow-x-hidden">
                    <div className="max-w-[1600px] mx-auto animate-fadeIn">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

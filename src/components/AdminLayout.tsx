import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  ShoppingCart,
  DollarSign,
  CreditCard,
  Settings,
  FileText,
  TrendingUp,
  Mail,
  Tag,
  Truck,
  Bell,
  RefreshCw,
  Shield,
  FileCheck,
  BookOpen,
  Globe,
  Percent,
  BarChart3,
  AlertTriangle,
  ExternalLink,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Maximize as Scan,
  Megaphone,
  Image as ImageIcon
} from 'lucide-react';
import { ReactNode, useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { AdminNotifications } from './admin/AdminNotifications';
import { supabase } from '../lib/supabase';
import { Zap } from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  icon: ReactNode;
  section: string;
}

const navItems: NavItem[] = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, section: 'Main' },
  { path: '/admin/pos', label: 'Point of Sale (POS)', icon: <Scan className="h-5 w-5" />, section: 'Main' },
  { path: '/admin/reports', label: 'Reports', icon: <BarChart3 className="h-5 w-5" />, section: 'Main' },

  { path: '/admin/vendors', label: 'Vendor Management', icon: <Store className="h-5 w-5" />, section: 'Users & Vendors' },
  { path: '/admin/vendor-packages', label: 'Vendor Packages', icon: <Package className="h-5 w-5" />, section: 'Users & Vendors' },
  { path: '/admin/customers', label: 'Customer Management', icon: <Users className="h-5 w-5" />, section: 'Users & Vendors' },
  { path: '/admin/roles-permissions', label: 'Roles & Permissions', icon: <Shield className="h-5 w-5" />, section: 'Users & Vendors' },
  { path: '/admin/kyc-verification', label: 'KYC Verification', icon: <Shield className="h-5 w-5" />, section: 'Users & Vendors' },
  { path: '/admin/vendor-contracts', label: 'Vendor Contracts', icon: <FileCheck className="h-5 w-5" />, section: 'Users & Vendors' },
  { path: '/admin/customer-contracts', label: 'Customer Contracts', icon: <FileText className="h-5 w-5" />, section: 'Users & Vendors' },


  { path: '/admin/logistics', label: 'Logistics Overview', icon: <Globe className="h-5 w-5" />, section: 'Shipping & Logistics' },
  { path: '/admin/shipping', label: 'Shipping Methods', icon: <BarChart3 className="h-5 w-5" />, section: 'Shipping & Logistics' },
  { path: '/admin/delivery', label: 'Delivery Tracking', icon: <Truck className="h-5 w-5" />, section: 'Shipping & Logistics' },
  { path: '/admin/logistic-contracts', label: 'Logistic Contracts', icon: <FileCheck className="h-5 w-5" />, section: 'Shipping & Logistics' },

  { path: '/admin/wallets', label: 'Wallet Management', icon: <DollarSign className="h-5 w-5" />, section: 'Financial' },
  { path: '/admin/payment-gateways', label: 'Payment Gateways', icon: <CreditCard className="h-5 w-5" />, section: 'Financial' },
  { path: '/admin/vat', label: 'Commission & VAT', icon: <Percent className="h-5 w-5" />, section: 'Financial' },
  { path: '/admin/commissions', label: 'Commission Oversight', icon: <DollarSign className="h-5 w-5" />, section: 'Financial' },
  { path: '/admin/refunds', label: 'Refund Management', icon: <RefreshCw className="h-5 w-5" />, section: 'Financial' },
  { path: '/admin/ledger', label: 'Immutable Ledger', icon: <BookOpen className="h-5 w-5" />, section: 'Financial' },

  { path: '/admin/catalog', label: 'Catalog Management', icon: <Package className="h-5 w-5" />, section: 'Products & Orders' },
  { path: '/admin/products', label: 'Products Management', icon: <Package className="h-5 w-5" />, section: 'Products & Orders' },
  { path: '/admin/orders', label: 'Orders Management', icon: <ShoppingCart className="h-5 w-5" />, section: 'Products & Orders' },

  { path: '/admin/currencies', label: 'Currency Management', icon: <DollarSign className="h-5 w-5" />, section: 'System' },
  { path: '/admin/languages', label: 'Language Management', icon: <Globe className="h-5 w-5" />, section: 'System' },
  { path: '/admin/sms-config', label: 'SMS Configuration', icon: <Mail className="h-5 w-5" />, section: 'System' },
  { path: '/admin/email-config', label: 'Email Configuration', icon: <Mail className="h-5 w-5" />, section: 'System' },
  { path: '/admin/triggers', label: 'Trigger Module', icon: <Bell className="h-5 w-5" />, section: 'System' },
  { path: '/admin/settings', label: 'System Configurations', icon: <Settings className="h-5 w-5" />, section: 'System' },
  { path: '/admin/documentation', label: 'Documentation', icon: <BookOpen className="h-5 w-5" />, section: 'System' },

  { path: '/admin/promotions', label: 'Promotion Management', icon: <Tag className="h-5 w-5" />, section: 'Marketing' },
  { path: '/admin/ads', label: 'Ads Management', icon: <Megaphone className="h-5 w-5" />, section: 'Marketing' },
  { path: '/admin/slider', label: 'Slider Management', icon: <ImageIcon className="h-5 w-5" />, section: 'Marketing' },
  { path: '/admin/emails', label: 'Email Management', icon: <Mail className="h-5 w-5" />, section: 'Marketing' },

  { path: '/admin/notifications', label: 'Notifications', icon: <Bell className="h-5 w-5" />, section: 'Other' },
  { path: '/admin/vendor-analytics', label: 'Vendor Performance', icon: <TrendingUp className="h-5 w-5" />, section: 'Other' },
  { path: '/admin/fraud-detection', label: 'Fraud Detection', icon: <AlertTriangle className="h-5 w-5" />, section: 'Other' },
];

const sections = Array.from(new Set(navItems.map(item => item.section)));

function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const { settings } = useSiteSettings();
  // const { theme, toggleTheme } = useTheme(); // Theme removed
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('admin-sidebar-collapsed');
    return saved === 'true';
  });
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [quickActionSearch, setQuickActionSearch] = useState('');
  const [pendingKycCount, setPendingKycCount] = useState(0);
  const quickActionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPendingKycCount();

    // Subscribe to changes in vendor_profiles to update count
    const kycChannel = supabase
      .channel('kyc-pending-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendor_profiles' }, () => {
        fetchPendingKycCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(kycChannel);
    };
  }, []);

  const fetchPendingKycCount = async () => {
    const { count } = await supabase
      .from('vendor_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('kyc_status', 'pending');
    setPendingKycCount(count || 0);
  };

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setQuickActionsOpen(true);
      }
      if (e.key === 'Escape') {
        setQuickActionsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    localStorage.setItem('admin-sidebar-collapsed', sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  const sidebarRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const sidebar = sidebarRef.current;
    if (sidebar) {
      // Restore scroll position immediately on mount
      const savedScroll = sessionStorage.getItem('adminSidebarScroll');
      if (savedScroll) {
        sidebar.scrollTop = parseInt(savedScroll, 10);
      }

      // Add scroll event listener to save position as user scrolls
      const handleScroll = () => {
        sessionStorage.setItem('adminSidebarScroll', sidebar.scrollTop.toString());
      };

      sidebar.addEventListener('scroll', handleScroll);
      return () => sidebar.removeEventListener('scroll', handleScroll);
    }
  }, []); // Run on mount and keep track


  const handleLogout = async () => {
    await signOut();
    navigate('/admin');
  };

  const isDark = false; // Forced light mode

  // Theme Colors
  const bgColor = 'bg-[#f8fafc]'; // Slate-50
  const sidebarBg = 'bg-white'; // White
  const headerBg = 'bg-white/80'; // Glassmorphism backdrop
  const borderColor = 'border-slate-200';
  const textPrimary = 'text-slate-900';
  const textSecondary = 'text-slate-500';
  const hoverBg = 'hover:bg-slate-50';
  const activeItemBg = 'bg-cyan-50 text-cyan-700';

  const expandedWidth = 'w-72';
  const collapsedWidth = 'w-20';

  return (
    <div className={`min-h-screen ${bgColor} font-sans transition-colors duration-300`}>

      {/* Sidebar - FIXED LEFT FULL HEIGHT */}
      <aside
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
        {/* Sidebar Header (Logo) */}
        <div className={`
          h-20 flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between px-6'}
          border-b ${borderColor}
        `}>
          <div className="flex items-center justify-center w-full">
            <div className={`${sidebarCollapsed ? 'w-10 h-10' : 'w-40 h-14'} transition-all duration-300 flex items-center justify-center`}>
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
        <nav
          ref={sidebarRef}
          className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar"
        >
          {sections.map(section => (
            <div key={section} className="mb-8">
              {!sidebarCollapsed && (
                <h3 className={`text-[10px] font-bold uppercase tracking-widest ${textSecondary} mb-3 px-4`}>
                  {section}
                </h3>
              )}
              <div className="space-y-1">
                {navItems
                  .filter(item => item.section === section)
                  .map(item => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => {
                          setSidebarOpen(false);
                          // No need to explicitly save here as the scroll listener handles it
                        }}
                        className={`
                          group flex items-center ${sidebarCollapsed ? 'justify-center py-3' : 'px-4 py-3'}
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

                        {item.path === '/admin/kyc-verification' && pendingKycCount > 0 && (
                          <span className={`ml-auto ${sidebarCollapsed ? 'absolute top-2 right-2' : 'ml-2'} bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse shadow-sm`}>
                            {pendingKycCount}
                          </span>
                        )}

                        {/* Active Indicator Strip (Optional Design Element) */}
                        {isActive && !sidebarCollapsed && item.path !== '/admin/kyc-verification' && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-500" />
                        )}
                      </Link>
                    );
                  })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer (Collapse Toggle) */}
        <div className={`p-4 border-t ${borderColor}`}>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`
              w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-center gap-3'}
              p-3 rounded-xl
              ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'}
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
          {/* Left Side (Mobile Toggle & Search) */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className={`lg:hidden p-2 rounded-xl ${hoverBg} text-slate-500`}
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Quick Action Button & Search */}
            <div className="relative" ref={quickActionRef}>
              <button
                onClick={() => {
                  setQuickActionsOpen(!quickActionsOpen);
                  if (!quickActionsOpen) setQuickActionSearch('');
                }}
                className={`hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600 transition-all border border-transparent group shadow-lg shadow-green-500/20 active:scale-95 ${quickActionsOpen ? 'ring-2 ring-white/50 border-white' : ''}`}
              >
                <Zap className={`w-4 h-4 transition-colors ${quickActionsOpen ? 'text-white' : 'text-white/80 group-hover:text-white'}`} />
                <span className="text-sm font-bold">Quick Actions</span>
                <span className="ml-2 text-[10px] font-mono bg-white/20 px-1.5 py-0.5 rounded text-white/90">⌘K</span>
              </button>

              {/* Dropdown Menu */}
              {quickActionsOpen && (
                <div className="absolute top-full left-0 mt-2 w-80 max-h-[600px] bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        autoFocus
                        type="text"
                        placeholder="Search modules..."
                        className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
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
                              <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setQuickActionsOpen(false)}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 hover:text-cyan-700 dark:hover:text-cyan-400 transition-colors group"
                              >
                                {item.icon}
                                <span className="text-sm font-medium">{item.label}</span>
                                {quickActionSearch && (
                                  <ChevronRight className="w-3 h-3 ml-auto text-slate-300 group-hover:text-cyan-500" />
                                )}
                              </Link>
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
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View Site</span>
            </Link>

            <AdminNotifications />

            <div className={`h-8 w-[1px] ${isDark ? 'bg-slate-700' : 'bg-slate-200'} mx-1`}></div>

            <div className="flex items-center gap-3 pl-1">
              <div className="text-right hidden sm:block">
                <p className={`text-sm font-bold ${textPrimary} leading-none`}>{profile?.full_name}</p>
                <p className={`text-xs ${textSecondary} mt-0.5`}>{profile?.email}</p>
              </div>
              <div className="relative group cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-green-600 p-[2px]">
                  <div className={`w-full h-full rounded-[10px] ${sidebarBg} flex items-center justify-center`}>
                    <span className="font-bold text-transparent bg-clip-text bg-gradient-to-tr from-cyan-600 to-green-600">
                      {profile?.full_name?.charAt(0) || 'A'}
                    </span>
                  </div>
                </div>

                {/* Dropdown Menu */}
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

export { AdminLayout };
export default AdminLayout;
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
  UserCheck,
  BarChart3,
  AlertTriangle,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ReactNode, useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

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
  { path: '/admin/reports', label: 'Reports', icon: <BarChart3 className="h-5 w-5" />, section: 'Main' },

  { path: '/admin/vendors', label: 'Vendor Management', icon: <Store className="h-5 w-5" />, section: 'Users & Vendors' },
  { path: '/admin/vendor-packages', label: 'Vendor Packages', icon: <Package className="h-5 w-5" />, section: 'Users & Vendors' },
  { path: '/admin/customers', label: 'Customer Management', icon: <Users className="h-5 w-5" />, section: 'Users & Vendors' },
  { path: '/admin/roles-permissions', label: 'Roles & Permissions', icon: <Shield className="h-5 w-5" />, section: 'Users & Vendors' },
  { path: '/admin/kyc-verification', label: 'KYC Verification', icon: <Shield className="h-5 w-5" />, section: 'Users & Vendors' },
  { path: '/admin/vendor-contracts', label: 'Vendor Contracts', icon: <FileCheck className="h-5 w-5" />, section: 'Users & Vendors' },
  { path: '/admin/customer-contracts', label: 'Customer Contracts', icon: <FileText className="h-5 w-5" />, section: 'Users & Vendors' },

  { path: '/admin/wallets', label: 'Wallet Management', icon: <DollarSign className="h-5 w-5" />, section: 'Financial' },
  { path: '/admin/payment-gateways', label: 'Payment Gateways', icon: <CreditCard className="h-5 w-5" />, section: 'Financial' },
  { path: '/admin/vat', label: 'VAT Management', icon: <Percent className="h-5 w-5" />, section: 'Financial' },
  { path: '/admin/refunds', label: 'Refund Management', icon: <RefreshCw className="h-5 w-5" />, section: 'Financial' },
  { path: '/admin/ledger', label: 'Immutable Ledger', icon: <BookOpen className="h-5 w-5" />, section: 'Financial' },

  { path: '/admin/catalog', label: 'Catalog Management', icon: <Package className="h-5 w-5" />, section: 'Products & Orders' },
  { path: '/admin/products', label: 'Products Management', icon: <Package className="h-5 w-5" />, section: 'Products & Orders' },
  { path: '/admin/orders', label: 'Orders Management', icon: <ShoppingCart className="h-5 w-5" />, section: 'Products & Orders' },
  { path: '/admin/shipping', label: 'Shipping Management', icon: <Truck className="h-5 w-5" />, section: 'Products & Orders' },

  { path: '/admin/currencies', label: 'Currency Management', icon: <DollarSign className="h-5 w-5" />, section: 'System' },
  { path: '/admin/languages', label: 'Language Management', icon: <Globe className="h-5 w-5" />, section: 'System' },
  { path: '/admin/sms-config', label: 'SMS Configuration', icon: <Mail className="h-5 w-5" />, section: 'System' },
  { path: '/admin/email-config', label: 'Email Configuration', icon: <Mail className="h-5 w-5" />, section: 'System' },
  { path: '/admin/triggers', label: 'Trigger Module', icon: <Bell className="h-5 w-5" />, section: 'System' },
  { path: '/admin/settings', label: 'System Configurations', icon: <Settings className="h-5 w-5" />, section: 'System' },
  { path: '/admin/documentation', label: 'Documentation', icon: <BookOpen className="h-5 w-5" />, section: 'System' },

  { path: '/admin/promotions', label: 'Promotion Management', icon: <Tag className="h-5 w-5" />, section: 'Marketing' },
  { path: '/admin/emails', label: 'Email Management', icon: <Mail className="h-5 w-5" />, section: 'Marketing' },

  { path: '/admin/notifications', label: 'Notifications', icon: <Bell className="h-5 w-5" />, section: 'Other' },
  { path: '/admin/vendor-analytics', label: 'Vendor Performance', icon: <TrendingUp className="h-5 w-5" />, section: 'Other' },
  { path: '/admin/fraud-detection', label: 'Fraud Detection', icon: <AlertTriangle className="h-5 w-5" />, section: 'Other' },
];

const sections = Array.from(new Set(navItems.map(item => item.section)));

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('admin-sidebar-collapsed');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('admin-sidebar-collapsed', sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  const handleLogout = async () => {
    await signOut();
    navigate('/admin');
  };

  const isDark = theme === 'dark';
  const bgColor = isDark ? 'bg-gray-900' : 'bg-gray-50';
  const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';
  const textPrimary = isDark ? 'text-gray-100' : 'text-gray-800';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const hoverBg = isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100';

  return (
    <div className={`min-h-screen ${bgColor}`}>
      <header className={`${cardBg} border-b ${borderColor} fixed top-0 left-0 right-0 z-50 h-16`}>
        <div className="h-full px-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`lg:hidden p-2 rounded-lg ${hoverBg}`}
            >
              {sidebarOpen ? <X className={`h-5 w-5 ${textPrimary}`} /> : <Menu className={`h-5 w-5 ${textPrimary}`} />}
            </button>
            <img
              src="/zimaio_mineral_edition,_no_background_v1.2.png"
              alt="ZimAIO Logo"
              className="h-8 w-auto"
            />
            <h1 className={`text-lg font-bold ${textPrimary} hidden sm:block`}>Admin Panel</h1>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg ${hoverBg} ${textSecondary}`}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <Link
              to="/"
              className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-gradient-to-r from-cyan-600 to-green-600 text-white rounded-md hover:from-cyan-700 hover:to-green-700 transition"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">Visit Website</span>
            </Link>

            <div className={`flex items-center space-x-3 border-l ${borderColor} pl-3`}>
              <button
                onClick={handleLogout}
                className={`p-2 ${textSecondary} hover:text-red-600 hover:bg-red-50 rounded-lg transition`}
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <aside className={`
        ${sidebarCollapsed ? 'w-16' : 'w-64'} ${cardBg} border-r ${borderColor} fixed left-0 top-16 bottom-0 overflow-y-auto z-40
        transition-all duration-300 lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-end p-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`p-2 rounded-lg ${hoverBg} ${textSecondary} hidden lg:block`}
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav className="p-4">
          {sections.map(section => (
            <div key={section} className="mb-6">
              {!sidebarCollapsed && (
                <h3 className={`text-xs font-semibold ${textSecondary} uppercase tracking-wider mb-2 px-3`}>
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
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2 rounded-lg transition ${
                          isActive
                            ? 'bg-gradient-to-r from-cyan-50 to-green-50 text-cyan-700 font-medium'
                            : `${textSecondary} ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`
                        }`}
                        title={sidebarCollapsed ? item.label : ''}
                      >
                        {item.icon}
                        {!sidebarCollapsed && <span className="text-sm">{item.label}</span>}
                      </Link>
                    );
                  })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className={`pt-16 ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'} min-h-screen transition-all duration-300`}>
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, Menu, MessageCircle, LogOut, Package, LayoutDashboard, MapPin, Heart, ChevronDown, DollarSign, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useCart } from '../contexts/CartContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface NavigationItem {
  id: string;
  label: string;
  url: string;
  icon: string | null;
  order_position: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}



export function Header() {
  const { user, profile, signOut } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const { totalItems } = useCart();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchNavigationItems = async () => {
      const { data } = await supabase
        .from('navigation_menu_items')
        .select('*')
        .eq('is_active', true)
        .order('order_position');

      if (data) {
        const filtered = data.filter(item => item.label !== 'CATEGORIES' && item.label !== 'BRANDS');
        const sellIndex = filtered.findIndex(item => item.url === '/vendor-signup');

        const contactItem: NavigationItem = {
          id: 'contact-synthetic',
          label: 'Contact Us',
          url: '/contact',
          icon: 'MessageCircle', // MessageCircle icon
          order_position: 0
        };

        if (sellIndex !== -1) {
          filtered.splice(sellIndex + 1, 0, {
            id: 'logistics-synthetic',
            label: 'Join Our Logistics',
            url: '/logistic-signup',
            icon: 'MapPin',
            order_position: 0
          });
          filtered.splice(sellIndex + 2, 0, contactItem);
        } else {
          filtered.push({
            id: 'logistics-synthetic',
            label: 'Join Our Logistics',
            url: '/logistic-signup',
            icon: 'MapPin',
            order_position: 0
          });
          filtered.push(contactItem);
        }

        setNavigationItems(filtered);
      }
    };
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name');

      if (data) {
        setCategories(data);
      }
    };

    fetchNavigationItems();
    fetchCategories();
  }, []);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Close user menu if clicking outside
      if (showUserMenu && !target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }

      // Close currency menu if clicking outside
      if (showCurrencyMenu && !target.closest('.currency-menu-container')) {
        setShowCurrencyMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu, showCurrencyMenu]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getIcon = (iconName: string | null) => {
    if (iconName === 'Menu') return <Menu className="h-4 w-4" />;
    if (iconName === 'Package') return <Package className="h-4 w-4" />;
    if (iconName === 'MessageCircle') return <MessageCircle className="h-4 w-4" />;
    if (iconName === 'MapPin') return <MapPin className="h-4 w-4" />;
    return null;
  };

  return (
    <header className="sticky top-0 z-50 transition-all duration-300">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-100 hidden sm:block">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-10 text-[11px] uppercase tracking-wider font-semibold text-gray-500">
            <span>Welcome To {settings.site_name} • {settings.site_tagline}</span>
            <div className="flex items-center space-x-6">
              {user ? (
                <Link to="/dashboard" className="hover:text-green-600 transition-colors flex items-center">
                  <User className="h-3.5 w-3.5 mr-1.5" />
                  {profile?.full_name || 'My Account'}
                </Link>
              ) : (
                <Link to="/login" className="hover:text-green-600 transition-colors flex items-center">
                  <User className="h-3.5 w-3.5 mr-1.5" />
                  Sign in
                </Link>
              )}
              <span className="opacity-30">|</span>
              <Link to="/orders" className="hover:text-green-600 transition-colors flex items-center">
                <MapPin className="h-3.5 w-3.5 mr-1.5" />
                Track Order
              </Link>
              <span className="opacity-30">|</span>
              <Link to="/support" className="hover:text-green-600 transition-colors">Support</Link>
              <span className="opacity-30">|</span>
              <div className="relative currency-menu-container">
                <button
                  onClick={() => setShowCurrencyMenu(!showCurrencyMenu)}
                  className="hover:text-green-600 transition-colors flex items-center"
                >
                  <DollarSign className="h-3 w-3 mr-1" />
                  {currency}
                  <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${showCurrencyMenu ? 'rotate-180' : ''}`} />
                </button>
                {showCurrencyMenu && (
                  <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-2xl py-2 border border-gray-100 z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                    <button
                      onClick={() => { setCurrency('USD'); setShowCurrencyMenu(false); }}
                      className={`block w-full text-left px-4 py-2 text-xs hover:bg-gray-50 transition-colors ${currency === 'USD' ? 'text-green-600 font-bold' : 'text-gray-600'}`}
                    >
                      USD ($)
                    </button>
                    <button
                      onClick={() => { setCurrency('ZWL'); setShowCurrencyMenu(false); }}
                      className={`block w-full text-left px-4 py-2 text-xs hover:bg-gray-50 transition-colors ${currency === 'ZWL' ? 'text-green-600 font-bold' : 'text-gray-600'}`}
                    >
                      ZWL (ZWL$)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white/95 backdrop-blur-xl border-b border-gray-100 relative">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-5 gap-4 md:gap-8 relative z-10">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 transition-transform active:scale-95 group">
              <img
                src={settings.site_logo}
                alt={settings.site_name}
                className="h-10 md:h-12 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.src = '/zimaio_mineral_edition,_no_background_v1.2.png';
                }}
              />
            </Link>

            {/* Search Bar */}
            <div className="hidden lg:flex flex-1 max-w-2xl px-4">
              <div className="flex w-full items-center bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-green-500/50 focus-within:ring-4 focus-within:ring-green-500/5 transition-all group overflow-hidden">
                <select
                  onChange={(e) => e.target.value && navigate(`/products?category=${e.target.value}`)}
                  className="px-5 py-3.5 bg-transparent text-gray-500 text-[11px] font-bold uppercase tracking-widest focus:outline-none cursor-pointer border-r border-gray-200"
                >
                  <option value="">ALL CATEGORIES</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>
                <div className="flex-1 flex items-center px-5">
                  <Search className="h-4 w-4 text-gray-400 mr-3 group-focus-within:text-green-600 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search premium products..."
                    className="w-full py-3.5 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none font-medium"
                  />
                </div>
                <button className="px-8 py-3.5 bg-green-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-green-700 transition-colors">
                  Explore
                </button>
              </div>
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-2 md:gap-5">
              {user ? (
                <div className="relative group user-menu-container">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex flex-col items-center p-2.5 rounded-2xl hover:bg-gray-50 transition-all text-gray-600 hover:text-green-600"
                  >
                    <User className="h-6 w-6" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] mt-1.5 hidden sm:block">Account</span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-3 w-60 bg-white rounded-2xl shadow-2xl py-4 border border-gray-100 z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-5 py-2.5 border-b border-gray-50 mb-2">
                        <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-1">Authenticating as</p>
                        <p className="text-sm font-bold text-gray-900 truncate">{profile?.full_name}</p>
                        <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
                      </div>
                      {profile?.role === 'customer' && (
                        <Link to="/dashboard" className="flex items-center px-5 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors">
                          <LayoutDashboard className="h-4 w-4 mr-4 text-green-500" />
                          Client Dashboard
                        </Link>
                      )}
                      {profile?.role === 'vendor' && (
                        <Link to="/vendor/dashboard" className="flex items-center px-5 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors">
                          <LayoutDashboard className="h-4 w-4 mr-4 text-green-500" />
                          Vendor Panel Control
                        </Link>
                      )}
                      {profile?.role === 'admin' && (
                        <Link to="/admin/dashboard" className="flex items-center px-5 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors">
                          <LayoutDashboard className="h-4 w-4 mr-4 text-green-500" />
                          System Administration
                        </Link>
                      )}
                      <Link to="/orders" className="flex items-center px-5 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors">
                        <Package className="h-4 w-4 mr-4 text-green-500" />
                        Order Logistics
                      </Link>
                      <Link to="/messages" className="flex items-center px-5 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors">
                        <MessageCircle className="h-4 w-4 mr-4 text-green-500" />
                        Concierge Chat
                      </Link>
                      <div className="border-t border-gray-50 mt-3 pt-3">
                        <button
                          onClick={handleSignOut}
                          className="flex items-center w-full px-5 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors font-bold"
                        >
                          <LogOut className="h-4 w-4 mr-4" />
                          Secure Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="flex flex-col items-center p-2.5 rounded-2xl hover:bg-gray-50 transition-all text-gray-600 hover:text-green-600">
                  <User className="h-6 w-6" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] mt-1.5 hidden sm:block">Account</span>
                </Link>
              )}



              <Link to="/favorites" className="flex flex-col items-center p-2.5 rounded-2xl hover:bg-gray-50 transition-all text-gray-600 hover:text-pink-600">
                <Heart className="h-6 w-6" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] mt-1.5 hidden sm:block">Wishlist</span>
              </Link>

              <Link to="/cart" className="relative flex flex-col items-center p-2.5 rounded-2xl hover:bg-gray-50 transition-all text-gray-600 hover:text-green-600">
                <ShoppingCart className="h-6 w-6" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] mt-1.5 hidden sm:block">Purchase</span>
                {totalItems > 0 && (
                  <span className="absolute top-2 right-2 bg-green-600 text-white text-[9px] font-black rounded-full h-4 w-4 flex items-center justify-center shadow-lg animate-bounce">
                    {totalItems}
                  </span>
                )}
              </Link>

              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2.5 rounded-2xl hover:bg-gray-50 text-gray-900"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar - EMERALD GREEN GLASS */}
      <div className="bg-green-600 backdrop-blur-xl border-b border-green-700 hidden sm:block overflow-x-auto whitespace-nowrap">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-14 h-14">
            {navigationItems.map((item) => {
              const icon = getIcon(item.icon);
              return (
                <Link
                  key={item.id}
                  to={item.url}
                  className="relative py-2 text-xs tracking-[0.25em] font-extrabold text-green-50/90 hover:text-white transition-all uppercase flex items-center gap-3 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-white after:transition-all hover:after:w-full"
                >
                  {icon && <span className="text-white/40">{icon}</span>}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 z-[100] bg-white animate-in slide-in-from-right duration-300">
          <div className="container mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-10">
              <img
                src={settings.site_logo}
                alt={settings.site_name}
                className="h-10"
                onError={(e) => {
                  e.currentTarget.src = '/zimaio_mineral_edition,_no_background_v1.2.png';
                }}
              />
              <button onClick={() => setShowMobileMenu(false)} className="p-2 rounded-xl bg-gray-100">
                <Menu className="h-6 w-6 rotate-90" />
              </button>
            </div>

            <div className="mb-10">
              <div className="flex items-center bg-gray-50 rounded-2xl border border-gray-200 px-4 py-3 focus-within:ring-2 focus-within:ring-green-500 transition-all">
                <Search className="h-4 w-4 text-gray-400 mr-3" />
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  className="w-full bg-transparent text-sm focus:outline-none placeholder-gray-400"
                />
              </div>
            </div>

            {/* Mobile User Profile Section */}
            {user ? (
              <div className="bg-gray-50 rounded-2xl p-4 mb-8 border border-gray-100 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-xl uppercase">
                  {profile?.full_name?.[0] || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{profile?.full_name}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">{profile?.role} Account</p>
                </div>
                <button onClick={handleSignOut} className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 text-red-500">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-6 mb-8 text-white shadow-lg shadow-green-900/20">
                <h4 className="font-bold text-lg mb-1">Welcome Guest</h4>
                <p className="text-green-100 text-xs mb-4">Sign in to access your orders and wishlist.</p>
                <div className="flex gap-3">
                  <Link to="/login" onClick={() => setShowMobileMenu(false)} className="px-6 py-2 bg-white text-green-600 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg">Sign In</Link>
                  <Link to="/signup" onClick={() => setShowMobileMenu(false)} className="px-6 py-2 bg-green-700/50 text-white rounded-xl font-bold text-xs uppercase tracking-widest">Join</Link>
                </div>
              </div>
            )}

            <nav className="flex flex-col gap-1 mb-8">
              <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-2 pl-2">Menu</p>

              {user && (
                <>
                  {profile?.role === 'customer' && (
                    <Link to="/dashboard" onClick={() => setShowMobileMenu(false)} className="mobile-link">
                      <span className="flex items-center gap-3"><LayoutDashboard className="h-5 w-5 text-gray-400" /> Dashboard</span>
                      <ArrowRight className="h-4 w-4 text-gray-300" />
                    </Link>
                  )}
                  {profile?.role === 'vendor' && (
                    <Link to="/vendor/dashboard" onClick={() => setShowMobileMenu(false)} className="mobile-link">
                      <span className="flex items-center gap-3"><LayoutDashboard className="h-5 w-5 text-gray-400" /> Vendor Panel</span>
                      <ArrowRight className="h-4 w-4 text-gray-300" />
                    </Link>
                  )}
                  {profile?.role === 'admin' && (
                    <Link to="/admin/dashboard" onClick={() => setShowMobileMenu(false)} className="mobile-link">
                      <span className="flex items-center gap-3"><LayoutDashboard className="h-5 w-5 text-gray-400" /> Admin Control</span>
                      <ArrowRight className="h-4 w-4 text-gray-300" />
                    </Link>
                  )}
                  <Link to="/orders" onClick={() => setShowMobileMenu(false)} className="mobile-link">
                    <span className="flex items-center gap-3"><Package className="h-5 w-5 text-gray-400" /> My Orders</span>
                    <ArrowRight className="h-4 w-4 text-gray-300" />
                  </Link>
                  <Link to="/messages" onClick={() => setShowMobileMenu(false)} className="mobile-link">
                    <span className="flex items-center gap-3"><MessageCircle className="h-5 w-5 text-gray-400" /> Messages</span>
                    <ArrowRight className="h-4 w-4 text-gray-300" />
                  </Link>
                  <div className="h-px bg-gray-100 my-2" />
                </>
              )}

              {[
                { label: 'Categories', url: '/categories', icon: Search },
                { label: 'Verified Vendors', url: '/vendors', icon: User },
                { label: 'New Arrivals', url: '/products', icon: Package },
                { label: 'Sell On ZimAIO', url: '/vendor-signup', icon: DollarSign },
                { label: 'Join Our Logistics', url: '/logistic-signup', icon: MapPin },
              ].map((link) => (
                <Link
                  key={link.url}
                  to={link.url}
                  onClick={() => setShowMobileMenu(false)}
                  className="mobile-link"
                >
                  <span className="flex items-center gap-3">
                    <link.icon className="h-5 w-5 text-gray-400" />
                    {link.label}
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-300" />
                </Link>
              ))}
            </nav>

            <div className="mt-12 p-6 bg-green-600 rounded-3xl text-white">
              <h4 className="font-bold mb-2">Ready to sell?</h4>
              <p className="text-sm text-green-100 mb-4 opacity-80">Open your shop on ZimAIO today.</p>
              <Link
                to="/vendor-signup"
                className="inline-flex items-center text-sm font-bold bg-white text-green-600 px-6 py-2.5 rounded-xl shadow-lg"
              >
                Join Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

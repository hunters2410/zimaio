import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { CartProvider } from './contexts/CartContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { SiteSettingsProvider } from './contexts/SiteSettingsContext';
import { ScrollToTop } from './components/ScrollToTop';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoadingFallback } from './components/LoadingFallback';
import { BackToTopButton } from './components/BackToTopButton';
import { useVisitorTracker } from './hooks/useVisitorTracker';

// Lazy Load Pages
const HomePage = lazy(() => import('./pages/HomePage').then(module => ({ default: module.HomePage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(module => ({ default: module.LoginPage })));
const SignupPage = lazy(() => import('./pages/SignupPage').then(module => ({ default: module.SignupPage })));
const ProductsPage = lazy(() => import('./pages/ProductsPage').then(module => ({ default: module.ProductsPage })));
const VendorSignupPage = lazy(() => import('./pages/VendorSignupPage').then(module => ({ default: module.VendorSignupPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then(module => ({ default: module.PrivacyPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then(module => ({ default: module.TermsPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then(module => ({ default: module.ContactPage })));
const CartPage = lazy(() => import('./pages/CartPage').then(module => ({ default: module.CartPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then(module => ({ default: module.CheckoutPage })));
const SupportPage = lazy(() => import('./pages/SupportPage').then(module => ({ default: module.SupportPage })));
const VendorsPage = lazy(() => import('./pages/VendorsPage').then(module => ({ default: module.VendorsPage })));
const ShopPage = lazy(() => import('./pages/ShopPage').then(module => ({ default: module.ShopPage })));
const ProductDetailsPage = lazy(() => import('./pages/ProductDetailsPage').then(module => ({ default: module.ProductDetailsPage })));
const MessagesPage = lazy(() => import('./pages/MessagesPage').then(module => ({ default: module.MessagesPage })));
const VendorDashboard = lazy(() => import('./pages/vendor/VendorDashboard').then(module => ({ default: module.VendorDashboard })));
const VendorWallet = lazy(() => import('./pages/vendor/VendorWallet').then(module => ({ default: module.VendorWallet })));
const VendorPayment = lazy(() => import('./pages/vendor/VendorPayment').then(module => ({ default: module.VendorPayment })));
const VendorSetup = lazy(() => import('./pages/vendor/VendorSetup').then(module => ({ default: module.VendorSetup })));
const AdminAuthPage = lazy(() => import('./pages/AdminAuthPage').then(module => ({ default: module.AdminAuthPage })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const AdminPOS = lazy(() => import('./pages/admin/AdminPOS').then(module => ({ default: module.AdminPOS })));
const NavigationSettings = lazy(() => import('./pages/admin/NavigationSettings').then(module => ({ default: module.NavigationSettings })));
const VendorManagement = lazy(() => import('./pages/admin/VendorManagement').then(module => ({ default: module.VendorManagement })));
const AppearanceSettings = lazy(() => import('./pages/admin/AppearanceSettings').then(module => ({ default: module.AppearanceSettings })));
const DeliveryManagement = lazy(() => import('./pages/admin/DeliveryManagement').then(module => ({ default: module.DeliveryManagement })));
const LogisticDashboard = lazy(() => import('./pages/logistic/LogisticDashboard').then(module => ({ default: module.LogisticDashboard })));
const LogisticWallet = lazy(() => import('./pages/logistic/LogisticWallet').then(module => ({ default: module.LogisticWallet })));
const LogisticSignupPage = lazy(() => import('./pages/logistic/LogisticSignupPage').then(module => ({ default: module.LogisticSignupPage })));
const CustomerDashboard = lazy(() => import('./pages/customer/CustomerDashboard').then(module => ({ default: module.CustomerDashboard })));
const CustomerWallet = lazy(() => import('./pages/customer/CustomerWallet').then(module => ({ default: module.CustomerWallet })));
const OrderDetailsPage = lazy(() => import('./pages/customer/OrderDetailsPage').then(module => ({ default: module.OrderDetailsPage })));
const TrackOrderPage = lazy(() => import('./pages/TrackOrderPage').then(module => ({ default: module.TrackOrderPage })));
const CustomerManagement = lazy(() => import('./pages/admin/CustomerManagement').then(module => ({ default: module.CustomerManagement })));
const UserRolesManagement = lazy(() => import('./pages/admin/UserRolesManagement').then(module => ({ default: module.UserRolesManagement })));
const KYCVerification = lazy(() => import('./pages/admin/KYCVerification').then(module => ({ default: module.KYCVerification })));
const WalletManagement = lazy(() => import('./pages/admin/WalletManagement').then(module => ({ default: module.WalletManagement })));
const RolesPermissions = lazy(() => import('./pages/admin/RolesPermissions').then(module => ({ default: module.RolesPermissions })));
const RoleForm = lazy(() => import('./pages/admin/RoleForm').then(module => ({ default: module.RoleForm })));
const ContractPage = lazy(() => import('./pages/ContractPage').then(module => ({ default: module.ContractPage })));

// Admin Pages Lazy Load
const PaymentGateways = lazy(() => import('./pages/admin/AllAdminPages').then(module => ({ default: module.PaymentGateways })));
const LogisticManagement = lazy(() => import('./pages/admin/AllAdminPages').then(module => ({ default: module.LogisticManagement })));
const VATManagement = lazy(() => import('./pages/admin/AllAdminPages').then(module => ({ default: module.VATManagement })));
const RefundManagement = lazy(() => import('./pages/admin/AllAdminPages').then(module => ({ default: module.RefundManagement })));
const ImmutableLedger = lazy(() => import('./pages/admin/AllAdminPages').then(module => ({ default: module.ImmutableLedger })));
const CurrencyManagement = lazy(() => import('./pages/admin/AllAdminPages').then(module => ({ default: module.CurrencyManagement })));
const LanguageManagement = lazy(() => import('./pages/admin/AllAdminPages').then(module => ({ default: module.LanguageManagement })));
const TriggerModule = lazy(() => import('./pages/admin/AllAdminPages').then(module => ({ default: module.TriggerModule })));
const SMSConfiguration = lazy(() => import('./pages/admin/AllAdminPages').then(module => ({ default: module.SMSConfiguration })));
const EmailConfiguration = lazy(() => import('./pages/admin/AllAdminPages').then(module => ({ default: module.EmailConfiguration })));
const AdsManagement = lazy(() => import('./pages/admin/AllAdminPages').then(module => ({ default: module.AdsManagement })));
const SliderManagement = lazy(() => import('./pages/admin/AllAdminPages').then(module => ({ default: module.SliderManagement })));
const SystemConfigurations = lazy(() => import('./pages/admin/AllAdminPages').then(module => ({ default: module.SystemConfigurations })));
const PromotionManagement = lazy(() => import('./pages/admin/AllAdminPages').then(module => ({ default: module.PromotionManagement })));
const EmailManagement = lazy(() => import('./pages/admin/AllAdminPages').then(module => ({ default: module.EmailManagement })));
const NotificationsManagement = lazy(() => import('./pages/admin/AllAdminPages').then(module => ({ default: module.NotificationsManagement })));
const VendorAnalytics = lazy(() => import('./pages/admin/AllAdminPages').then(module => ({ default: module.VendorAnalytics })));
const FraudDetection = lazy(() => import('./pages/admin/AllAdminPages').then(module => ({ default: module.FraudDetection })));
const CatalogManagement = lazy(() => import('./pages/admin/AllAdminPages').then(module => ({ default: module.CatalogManagement })));
const ProductsManagement = lazy(() => import('./pages/admin/AllAdminPages').then(module => ({ default: module.ProductsManagement })));
const VendorContracts = lazy(() => import('./pages/admin/AllAdminPages').then(module => ({ default: module.VendorContracts })));
const CustomerContracts = lazy(() => import('./pages/admin/AllAdminPages').then(module => ({ default: module.CustomerContracts })));
const LogisticContracts = lazy(() => import('./pages/admin/AllAdminPages').then(module => ({ default: module.LogisticContracts })));
const VendorPackages = lazy(() => import('./pages/admin/AllAdminPages').then(module => ({ default: module.VendorPackages })));
const OrdersManagement = lazy(() => import('./pages/admin/AllAdminPages').then(module => ({ default: module.OrdersManagement })));
const ShippingManagement = lazy(() => import('./pages/admin/AllAdminPages').then(module => ({ default: module.ShippingManagement })));
const Reports = lazy(() => import('./pages/admin/AllAdminPages').then(module => ({ default: module.Reports })));
const AdminCommissions = lazy(() => import('./pages/admin/AllAdminPages').then(module => ({ default: module.AdminCommissions })));
const Documentation = lazy(() => import('./pages/admin/AllAdminPages').then(module => ({ default: module.Documentation })));

import { useSiteSettings } from './contexts/SiteSettingsContext';
import { MaintenancePage } from './pages/MaintenancePage';
import { useAuth } from './contexts/AuthContext';

function AppContent() {
  const location = useLocation();
  useVisitorTracker();
  const { settings, loading } = useSiteSettings();
  const { profile, loading: authLoading } = useAuth();

  // Check if maintenance mode is active
  const isMaintenanceMode = settings.maintenance_mode === 'true';
  const isAdmin = profile?.role === 'admin';
  const isAuthPage = location.pathname.startsWith('/admin') || location.pathname === '/login';

  // Show loading while checking settings and auth
  if (loading || authLoading) {
    return <LoadingFallback />;
  }

  // If maintenance mode is on, user is not admin, and not trying to access admin login
  if (isMaintenanceMode && !isAdmin && !isAuthPage) {
    return <MaintenancePage />;
  }

  const hideHeaderFooter = location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/vendor/') ||
    location.pathname.startsWith('/logistic/');

  return (
    <div className="min-h-screen flex flex-col">
      {!hideHeaderFooter && <Header />}
      <main className="flex-grow">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/logistic-signup" element={<LogisticSignupPage />} />
            <Route path="/admin" element={<AdminAuthPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/vendor-signup" element={<VendorSignupPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/track-order" element={<TrackOrderPage />} />
            <Route path="/orders" element={<TrackOrderPage />} />
            <Route path="/contract/:type" element={<ContractPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/vendors" element={<VendorsPage />} />
            <Route path="/shop/:userId" element={<ShopPage />} />
            <Route path="/vendor/:userId" element={<ShopPage />} />
            <Route path="/products/:slug" element={<ProductDetailsPage />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/customer/wallet"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <CustomerWallet />
                </ProtectedRoute>
              }
            />

            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <OrderDetailsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/vendor/dashboard"
              element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <VendorDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/vendor/setup"
              element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <VendorSetup />
                </ProtectedRoute>
              }
            />

            <Route
              path="/vendor/wallet"
              element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <VendorWallet />
                </ProtectedRoute>
              }
            />

            <Route
              path="/vendor/payment"
              element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <VendorPayment />
                </ProtectedRoute>
              }
            />

            <Route
              path="/logistic/wallet"
              element={
                <ProtectedRoute allowedRoles={['logistic']}>
                  <LogisticWallet />
                </ProtectedRoute>
              }
            />

            <Route
              path="/logistic/dashboard"
              element={
                <ProtectedRoute allowedRoles={['logistic']}>
                  <LogisticDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/logistic/fleet"
              element={
                <ProtectedRoute allowedRoles={['logistic']}>
                  <LogisticDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/logistic/shipping"
              element={
                <ProtectedRoute allowedRoles={['logistic']}>
                  <LogisticDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/logistic/orders"
              element={
                <ProtectedRoute allowedRoles={['logistic']}>
                  <LogisticDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/logistic/profile"
              element={
                <ProtectedRoute allowedRoles={['logistic']}>
                  <LogisticDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/logistic/settings"
              element={
                <ProtectedRoute allowedRoles={['logistic']}>
                  <LogisticDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/logistic/notifications"
              element={
                <ProtectedRoute allowedRoles={['logistic']}>
                  <LogisticDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/pos"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminPOS />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/navigation"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <NavigationSettings />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/vendors"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <VendorManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/vendor-packages"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <VendorPackages />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/appearance"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppearanceSettings />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/delivery"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <DeliveryManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/customers"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <CustomerManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/logistics"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <LogisticManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/user-roles"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UserRolesManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/roles-permissions"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <RolesPermissions />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/roles-permissions/new"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <RoleForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/roles-permissions/edit/:id"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <RoleForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/kyc-verification"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <KYCVerification />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/vendor-contracts"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <VendorContracts />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/customer-contracts"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <CustomerContracts />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/logistic-contracts"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <LogisticContracts />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/ads"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdsManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/slider"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <SliderManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/wallets"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <WalletManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/payment-gateways"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <PaymentGateways />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/vat"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <VATManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/refunds"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <RefundManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/ledger"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ImmutableLedger />
                </ProtectedRoute>
              }
            />


            <Route
              path="/admin/currencies"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <CurrencyManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/languages"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <LanguageManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/sms-config"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <SMSConfiguration />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/email-config"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <EmailConfiguration />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/triggers"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <TriggerModule />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <SystemConfigurations />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/promotions"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <PromotionManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/emails"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <EmailManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/notifications"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <NotificationsManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/vendor-analytics"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <VendorAnalytics />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/fraud-detection"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <FraudDetection />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/catalog"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <CatalogManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/products"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ProductsManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <OrdersManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/shipping"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ShippingManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Reports />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/commissions"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminCommissions />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/documentation"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Documentation />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </main>
      <BackToTopButton />
      {!hideHeaderFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <ThemeProvider>
          <SettingsProvider>
            <SiteSettingsProvider>
              <CartProvider>
                <CurrencyProvider>
                  <AppContent />
                </CurrencyProvider>
              </CartProvider>
            </SiteSettingsProvider>
          </SettingsProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { CartProvider } from './contexts/CartContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ProductsPage } from './pages/ProductsPage';
import { VendorSignupPage } from './pages/VendorSignupPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { ContactPage } from './pages/ContactPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { SupportPage } from './pages/SupportPage';
import { VendorsPage } from './pages/VendorsPage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailsPage } from './pages/ProductDetailsPage';
import { MessagesPage } from './pages/MessagesPage';
import { VendorDashboard } from './pages/vendor/VendorDashboard';
import { VendorWallet } from './pages/vendor/VendorWallet';
import { VendorPayment } from './pages/vendor/VendorPayment';
import { VendorSetup } from './pages/vendor/VendorSetup';
import { AdminAuthPage } from './pages/AdminAuthPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminPOS } from './pages/admin/AdminPOS';
import { NavigationSettings } from './pages/admin/NavigationSettings';
import { VendorManagement } from './pages/admin/VendorManagement';
import { AppearanceSettings } from './pages/admin/AppearanceSettings';
import { DeliveryManagement } from './pages/admin/DeliveryManagement';
import { LogisticDashboard } from './pages/logistic/LogisticDashboard';
import { LogisticSignupPage } from './pages/logistic/LogisticSignupPage';
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { OrderDetailsPage } from './pages/customer/OrderDetailsPage';
import { TrackOrderPage } from './pages/TrackOrderPage';
import { CustomerManagement } from './pages/admin/CustomerManagement';
import { UserRolesManagement } from './pages/admin/UserRolesManagement';
import { KYCVerification } from './pages/admin/KYCVerification';
import { WalletManagement } from './pages/admin/WalletManagement';
import { RolesPermissions } from './pages/admin/RolesPermissions';
import { RoleForm } from './pages/admin/RoleForm';
import { ContractPage } from './pages/ContractPage';
import {
  PaymentGateways,
  LogisticManagement,
  VATManagement,
  RefundManagement,
  ImmutableLedger,
  CurrencyManagement,
  LanguageManagement,
  TriggerModule,
  SMSConfiguration,
  EmailConfiguration,
  AdsManagement,
  SliderManagement,
  SystemConfigurations,
  PromotionManagement,
  EmailManagement,
  NotificationsManagement,
  VendorAnalytics,
  FraudDetection,
  CatalogManagement,
  ProductsManagement,
  VendorContracts,
  CustomerContracts,
  VendorPackages,
  OrdersManagement,
  ShippingManagement,
  Reports,
  AdminCommissions,
  Documentation
} from './pages/admin/AllAdminPages';

function AppContent() {
  const location = useLocation();
  const hideHeaderFooter = location.pathname.startsWith('/admin') || location.pathname.startsWith('/vendor/');

  return (
    <div className="min-h-screen flex flex-col">
      {!hideHeaderFooter && <Header />}
      <main className="flex-grow">
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
            path="/logistic/dashboard"
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
            path="/admin/deliveries"
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
      </main>
      {!hideHeaderFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <SettingsProvider>
            <CartProvider>
              <CurrencyProvider>
                <AppContent />
              </CurrencyProvider>
            </CartProvider>
          </SettingsProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { ThemeProvider } from './contexts/ThemeContext';
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
import { SupportPage } from './pages/SupportPage';
import { VendorDashboard } from './pages/vendor/VendorDashboard';
import { VendorWallet } from './pages/vendor/VendorWallet';
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
import { TrackOrderPage } from './pages/TrackOrderPage';
import { CustomerManagement } from './pages/admin/CustomerManagement';
import { UserRolesManagement } from './pages/admin/UserRolesManagement';
import { KYCVerification } from './pages/admin/KYCVerification';
import { WalletManagement } from './pages/admin/WalletManagement';
import VendorPackages from './pages/admin/VendorPackages';
import { RolesPermissions } from './pages/admin/RolesPermissions';
import { RoleForm } from './pages/admin/RoleForm';
import { VendorContracts } from './pages/admin/VendorContracts';
import { CustomerContracts } from './pages/admin/CustomerContracts';
import { ContractPage } from './pages/ContractPage';
import {
  PaymentGateways,
  LogisticManagement,
  VATManagement,
  RefundManagement,
  ImmutableLedger,
  VendorPlans,
  CurrencyManagement,
  LanguageManagement,
  TriggerModule,
  SMSConfiguration,
  EmailConfiguration,
  SystemConfigurations,
  PromotionManagement,
  EmailManagement,
  NotificationsManagement,
  VendorAnalytics,
  FraudDetection,
  CatalogManagement,
  ProductsManagement,
  OrdersManagement,
  ShippingManagement,
  Reports,
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
          <Route path="/support" element={<SupportPage />} />
          <Route path="/track-order" element={<TrackOrderPage />} />
          <Route path="/orders" element={<TrackOrderPage />} />
          <Route path="/contract/:type" element={<ContractPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerDashboard />
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
            path="/admin/vendor-plans"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <VendorPlans />
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
          <CurrencyProvider>
            <AppContent />
          </CurrencyProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

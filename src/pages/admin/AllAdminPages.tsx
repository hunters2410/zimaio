export { PaymentGateways } from './PaymentGateways';
export { LogisticManagement } from './LogisticManagement';
export { VATManagement } from './VATManagement';
export { RefundManagement } from './RefundManagement';
export { TransactionLedger as ImmutableLedger } from './TransactionLedger';
export { default as Documentation } from './Documentation';
export { default as CurrencyManagement } from './CurrencyManagement';
export { default as LanguageManagement } from './LanguageManagement';
export { default as TriggerModule } from './TriggerModule';
export { default as SMSConfiguration } from './SMSConfiguration';
export { default as EmailConfiguration } from './EmailConfiguration';
export { default as AdsManagement } from './AdsManagement';
export { SliderManagement } from './SliderManagement';

export { default as VendorPackages } from './VendorPackages';
export { SystemConfigurations } from './SystemConfigurations';
export { PromotionManagement } from './PromotionManagement';
export { VendorAnalytics } from './VendorAnalytics';
export { FraudDetection } from './FraudDetection';
export { CatalogManagement } from './CatalogManagement';
export { ProductsManagement } from './ProductsManagement';
export { OrdersManagement } from './OrdersManagement';
export { ShippingManagement } from './ShippingManagement';
export { VendorContracts } from './VendorContracts';
export { CustomerContracts } from './CustomerContracts';
export { Reports } from './Reports';
export { AdminCommissions } from './AdminCommissions';

// Rest of the placeholders if needed
import { Mail, Bell } from 'lucide-react';
import { AdminPage } from './AdminPage';

export function EmailManagement() {
  return (
    <AdminPage
      title="Email Management"
      description="Manage email templates and notifications"
      icon={Mail}
    />
  );
}

export function NotificationsManagement() {
  return (
    <AdminPage
      title="Notifications Management"
      description="Configure system-wide notifications and alerts"
      icon={Bell}
    />
  );
}
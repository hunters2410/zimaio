import {
  Settings,
  Tag,
  Mail,
  Bell,
  TrendingUp,
  AlertTriangle,
  Package,
  ShoppingCart,
  Truck,
  FileCheck,
  FileText
} from 'lucide-react';
import { AdminPage } from './AdminPage';

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

export function VendorPlans() {
  return (
    <AdminPage
      title="Vendor Plans & Subscriptions"
      description="Manage vendor subscription tiers and pricing"
      icon={FileText}
    />
  );
}

export function SystemConfigurations() {
  return (
    <AdminPage
      title="System Configurations"
      description="Global platform settings and configurations"
      icon={Settings}
    />
  );
}

export function PromotionManagement() {
  return (
    <AdminPage
      title="Promotion Management"
      description="Create and manage promotional campaigns"
      icon={Tag}
    />
  );
}

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

export function VendorAnalytics() {
  return (
    <AdminPage
      title="Vendor Performance Analytics"
      description="Track and analyze vendor performance metrics"
      icon={TrendingUp}
    />
  );
}

export function FraudDetection() {
  return (
    <AdminPage
      title="Fraud Detection & Risk Monitoring"
      description="Monitor suspicious activities and manage fraud alerts"
      icon={AlertTriangle}
    />
  );
}

export function CatalogManagement() {
  return (
    <AdminPage
      title="Catalog Management"
      description="Manage product categories, brands, and catalog structure"
      icon={Package}
    />
  );
}

export { ProductsManagement } from './ProductsManagement';

export function OrdersManagement() {
  return (
    <AdminPage
      title="Orders Management"
      description="View and manage all customer orders"
      icon={ShoppingCart}
    />
  );
}

export function ShippingManagement() {
  return (
    <AdminPage
      title="Shipping Management"
      description="Configure shipping zones, rates, and delivery options"
      icon={Truck}
    />
  );
}

export function VendorContracts() {
  return (
    <AdminPage
      title="Vendor Contracts & Terms"
      description="Track vendor contract acceptances and terms"
      icon={FileCheck}
    />
  );
}

export function Reports() {
  return (
    <AdminPage
      title="Reports & Analytics"
      description="Generate comprehensive business reports"
      icon={TrendingUp}
    />
  );
}
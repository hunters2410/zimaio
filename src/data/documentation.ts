export const documentationSections = [
  {
    title: 'Getting Started',
    slug: 'getting-started',
    icon: 'Rocket',
    order_index: 1,
    content: `# Getting Started

## Welcome to Your Multi-Vendor E-commerce Platform

This comprehensive e-commerce platform enables you to manage a complete multi-vendor marketplace with advanced features including multi-currency support, automated triggers, financial management, and more.

### Quick Start Guide

1. **Login to Admin Panel**: Use your admin credentials to access the admin dashboard
2. **Configure Settings**: Set up your site settings, payment gateways, and email/SMS
3. **Add Vendors**: Approve vendor applications or create vendor accounts
4. **Manage Products**: Review and approve vendor products
5. **Start Selling**: Your marketplace is ready to accept orders

### Key Features

- **Multi-Vendor Marketplace**: Support unlimited vendors with individual dashboards
- **Multi-Currency Support**: Accept payments in multiple currencies (USD, ZWG)
- **Multi-Language Support**: Serve customers in English, isiNdebele, and chiShona
- **Advanced Analytics**: Real-time insights into sales, orders, and customer behavior
- **Automated Triggers**: Send automated emails and SMS based on events
- **Comprehensive Financial System**: Track commissions, payouts, and refunds
- **Delivery Management**: Manage deliveries with driver tracking
- **VAT Management**: Configure and apply VAT/tax rules
- **Backup & Restore**: Automated database backups with restore capabilities

### System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Stable internet connection
- Admin account credentials`
  },
  {
    title: 'Platform Overview',
    slug: 'platform-overview',
    icon: 'Layout',
    order_index: 2,
    content: `# Platform Overview

## System Architecture

This platform is built on a modern, scalable architecture designed for performance and reliability.

### Technology Stack

- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL database)
- **Authentication**: Supabase Auth with email/password
- **Edge Functions**: Serverless functions for payments, emails, and SMS
- **Charts**: Recharts for analytics visualization

### User Roles

#### 1. Admin
- Full system access
- Manage users, vendors, and products
- Configure system settings
- View all analytics
- Process refunds and payouts
- Manage payment gateways

#### 2. Vendor
- Manage own products
- View vendor-specific analytics
- Track orders and sales
- Manage wallet and payouts
- Subscribe to vendor packages
- Set currency preferences

#### 3. Customer
- Browse and purchase products
- Track orders
- Manage profile and wallet
- Leave reviews
- Contact support

### Database Schema

The system uses PostgreSQL with Row Level Security (RLS) for data protection. Key tables include:

- **profiles**: User accounts and authentication
- **vendor_profiles**: Vendor-specific information
- **products**: Product catalog
- **orders**: Order management
- **payment_transactions**: Payment processing
- **wallets**: Multi-currency wallet system
- **commissions**: Commission tracking
- **trigger_definitions**: Automated notifications`
  },
  {
    title: 'User Management',
    slug: 'user-management',
    icon: 'Users',
    order_index: 3,
    content: `# User Management

## Overview

The user management system allows admins to manage all platform users including customers, vendors, and other administrators.

## User Profiles

Each user has a profile containing:
- Email address
- Full name
- Phone number
- Avatar/profile picture
- Role (customer, vendor, admin)
- Language preference
- Currency preference
- Verification status
- Two-factor authentication status

## Managing Users

### View All Users

Navigate to **Admin > User Roles Management** to see all registered users.

### Assign Roles

1. Select a user from the list
2. Click "Change Role"
3. Select new role (customer, vendor, admin)
4. Confirm the change

### User Status

Admins can:
- **Activate/Deactivate**: Enable or disable user accounts
- **Verify**: Mark users as verified
- **View Activity**: See last login and account creation date

## Role-Based Access Control

The platform uses a comprehensive permission system with specific permissions for each role type.`
  },
  {
    title: 'Vendor Management',
    slug: 'vendor-management',
    icon: 'Store',
    order_index: 4,
    content: `# Vendor Management

## Overview

The vendor management system enables multiple sellers to operate on your platform with full administrative oversight.

## Vendor Registration

### Application Process

1. User creates account
2. Applies to become vendor
3. Provides business information
4. Submits KYC documents
5. Admin reviews and approves

### Required Information

- Business name
- Business description
- Store URL slug
- Business address
- Tax identification number
- Bank account details
- Identity verification documents

## Vendor Packages

Vendors subscribe to packages that define their capabilities with features like featured placement, bulk upload, advanced analytics, custom branding, priority support, and API access.

## Commission System

Admins earn commission on vendor sales with percentage-based, flat fee, or tiered commission structures.`
  },
  {
    title: 'Product Management',
    slug: 'product-management',
    icon: 'Package',
    order_index: 5,
    content: `# Product Management

## Overview

Comprehensive product management with approval workflow, multi-currency pricing, and inventory tracking.

## Product Structure

Each product contains:

### Basic Information
- Product name
- Description
- Category
- Brand
- SKU (Stock Keeping Unit)

### Pricing
- Base price
- Multi-currency prices
- Discount pricing
- Commission rate

### Inventory
- Stock quantity
- Low stock threshold
- Restock notifications

### Media
- Product images (multiple)
- Videos (optional)

## Product Approval Workflow

1. Vendor creates product
2. Product enters pending review
3. Admin reviews for quality and compliance
4. Approve or reject with feedback`
  },
  {
    title: 'Order Management',
    slug: 'order-management',
    icon: 'ShoppingCart',
    order_index: 6,
    content: `# Order Management

## Overview

Complete order lifecycle management from placement to delivery with automated notifications and tracking.

## Order Lifecycle

### 1. Order Placed
Customer completes checkout and order is created with unique number

### 2. Order Confirmed
Vendor confirms order and payment is verified

### 3. Order Processing
Vendor prepares items and arranges shipping

### 4. Order Shipped
Tracking number assigned and delivery driver assigned

### 5. Order Delivered
Customer receives order and confirms delivery

### 6. Order Completed
Payment released to vendor and commission calculated

## Multi-Vendor Orders

Orders are split by vendor with separate commission tracking and individual notifications.`
  },
  {
    title: 'Payment System',
    slug: 'payment-system',
    icon: 'CreditCard',
    order_index: 7,
    content: `# Payment System

## Overview

Comprehensive payment processing with multiple gateways, multi-currency support, and transaction tracking.

## Payment Gateways

The platform supports multiple payment methods:

### Paynow (Zimbabwe)
Mobile money (Ecocash, OneMoney), card payments, real-time processing

### Stripe
International cards, multiple currencies, advanced fraud protection

### PayPal
Global coverage, buyer protection, express checkout

### Bank Transfer
Manual verification with proof of payment upload

## Gateway Configuration

Navigate to **Admin > Payment Gateways** to configure API keys, supported currencies, and payment instructions.

## Multi-Currency Payments

Customers can pay in their preferred currency with real-time exchange rate conversion locked at checkout.`
  },
  {
    title: 'Financial Management',
    slug: 'financial-management',
    icon: 'DollarSign',
    order_index: 8,
    content: `# Financial Management

## Overview

Complete financial tracking with commission calculation, wallet management, and comprehensive reporting.

## Commission System

Admins earn commission on every sale with automatic calculation on order completion.

## Wallet System

Multi-currency wallets for each user supporting deposits, withdrawals, and transfers.

## Transaction Ledger

Navigate to **Admin > Transaction Ledger** for complete financial history with filtering and export options.

## VAT Management

Configure VAT rates (standard, reduced, zero, exempt) and apply product-level overrides.

## Refund Management

Process refunds with full, partial, or store credit options.`
  },
  {
    title: 'Delivery System',
    slug: 'delivery-system',
    icon: 'Truck',
    order_index: 9,
    content: `# Delivery System

## Overview

Manage deliveries with driver assignment, real-time tracking, and automated notifications.

## Delivery Management

Define delivery zones, set delivery fees, and manage multiple delivery methods (standard, express, same-day, pickup).

## Delivery Drivers

Add and manage delivery drivers with automatic or manual assignment based on availability and location.

## Delivery Tracking

Real-time GPS tracking with customer notifications at each stage of delivery.`
  },
  {
    title: 'Analytics & Reporting',
    slug: 'analytics-reporting',
    icon: 'BarChart',
    order_index: 10,
    content: `# Analytics & Reporting

## Overview

Comprehensive analytics dashboard with real-time insights, charts, and exportable reports.

## Admin Dashboard

View key metrics including revenue, orders, customers, and vendors with visual charts showing trends.

## Available Reports

- Sales reports (daily, weekly, monthly)
- Order reports with status breakdown
- Customer reports with purchase history
- Vendor performance reports
- Financial reports (revenue, commission, VAT)
- Inventory reports with stock alerts

## Export Options

Export reports in CSV, PDF, Excel, or JSON format for further analysis.`
  },
  {
    title: 'Email & SMS',
    slug: 'email-sms',
    icon: 'Mail',
    order_index: 11,
    content: `# Email & SMS System

## Overview

Integrated communication system for sending emails and SMS with configuration, testing, and delivery tracking.

## Email Configuration

Configure SMTP settings including host, port, username, password, and TLS encryption.

### Popular SMTP Providers

**Gmail**: smtp.gmail.com:587 (use App Password)
**SendGrid**: smtp.sendgrid.net:587
**Mailgun**: smtp.mailgun.org:587
**AWS SES**: email-smtp.region.amazonaws.com:587

## SMS Configuration

Choose from Twilio, Africa's Talking, or custom SMS gateway with API key configuration.

## Testing

Test email and SMS delivery directly from the admin panel before going live.`
  },
  {
    title: 'Triggers & Automation',
    slug: 'triggers-automation',
    icon: 'Zap',
    order_index: 12,
    content: `# Triggers & Automation

## Overview

Automated event-driven notifications via email and SMS to keep customers, vendors, and admins informed.

## Available Trigger Types

### Order Triggers
Order placed, confirmed, shipped, delivered, cancelled

### Payment Triggers
Payment received, payment failed

### Refund Triggers
Refund approved

### User Triggers
User registered

### Vendor Triggers
Vendor approved, vendor payout

### Product Triggers
Product approved, product low stock

### Review Triggers
Review submitted

### Password Triggers
Password reset

## Creating Triggers

Configure trigger name, type, recipients, channels (email/SMS), and message templates with variable placeholders.`
  },
  {
    title: 'Security & Permissions',
    slug: 'security-permissions',
    icon: 'Shield',
    order_index: 13,
    content: `# Security & Permissions

## Overview

Comprehensive security features including role-based access control, two-factor authentication, and fraud detection.

## Authentication

Email and password authentication with secure session management and password reset flow.

## Two-Factor Authentication

Enhanced security with TOTP-based 2FA using authenticator apps.

## Role-Based Access Control

Fine-grained permissions for admin, vendor, and customer roles with custom role creation.

## Data Security

- Row Level Security (RLS) policies
- TLS/SSL encryption in transit
- Database encryption at rest
- Bcrypt password hashing
- Secure API key storage

## Fraud Detection

Automatic monitoring for high-risk orders and suspicious behavior with admin review workflow.`
  },
  {
    title: 'Backup & Maintenance',
    slug: 'backup-maintenance',
    icon: 'Database',
    order_index: 14,
    content: `# Backup & Maintenance

## Overview

Automated database backups with restoration capabilities to protect against data loss.

## Backup System

Navigate to **Admin > Backup & Restore**

### Backup Types

**Manual Backup**: On-demand creation for critical changes
**Automatic Backup**: Scheduled execution (hourly, daily, weekly, monthly)

## Backup Configuration

Set retention periods (7, 30, 90, 365 days, or forever) with automatic cleanup of old backups.

## Creating Backups

Create manual backups instantly or configure automatic scheduling with cron jobs.

## Restoring Backups

Select backup from history, review details, and confirm restoration. Always create current backup before restoring!

## Best Practices

Follow the 3-2-1 rule: 3 copies of data, 2 different storage types, 1 offsite backup.`
  },
  {
    title: 'Multi-Currency',
    slug: 'multi-currency',
    icon: 'DollarSign',
    order_index: 15,
    content: `# Multi-Currency Support

## Overview

Accept payments and display prices in multiple currencies with automatic conversion and real-time exchange rates.

## Currency Management

Navigate to **Admin > Currency Management**

### Supported Currencies

**USD (US Dollar)**: Default currency with 1.00 exchange rate
**ZWG (Zimbabwe Gold)**: Active with configurable exchange rate

## Managing Currencies

Activate or deactivate currencies and update exchange rates. Note: Cannot deactivate default currency.

## Multi-Currency Orders

Currency selection locked at checkout with exchange rate stored in order for accurate historical records.

## Multi-Currency Wallets

Separate wallet balance for each currency with no automatic conversion to maintain clear accounting.`
  },
  {
    title: 'Multi-Language',
    slug: 'multi-language',
    icon: 'Languages',
    order_index: 16,
    content: `# Multi-Language Support

## Overview

Serve customers in multiple languages with full interface translation and language preferences.

## Language Management

Navigate to **Admin > Language Management**

### Supported Languages

**English**: Default language (code: en)
**isiNdebele**: Active (code: nd)
**chiShona**: Active (code: sn)

## Managing Languages

Activate or deactivate languages. Note: Cannot deactivate default language.

## Customer Experience

Language selector in header with automatic browser language detection and user preference storage.

## Translation System

Translations stored as JSON with keys organized by feature area (common, products, orders, auth, etc).`
  },
  {
    title: 'API Reference',
    slug: 'api-reference',
    icon: 'Code',
    order_index: 17,
    content: `# API Reference

## Overview

Complete API documentation for integrating with the platform programmatically.

## Authentication

All API requests require authentication using Supabase JWT tokens included in Authorization header.

## Base URL

Production: https://your-project.supabase.co
Local: http://localhost:54321

## Available Endpoints

### Products API
- List products: GET /rest/v1/products
- Get product: GET /rest/v1/products?id=eq.{uuid}
- Create product: POST /rest/v1/products
- Update product: PATCH /rest/v1/products?id=eq.{uuid}

### Orders API
- List orders: GET /rest/v1/orders
- Create order: POST /rest/v1/orders
- Update order status: PATCH /rest/v1/orders?id=eq.{uuid}

### Payments API
- Process payment: POST /functions/v1/process-payment

### Wallets API
- Get balance: GET /rest/v1/wallets?user_id=eq.{uuid}
- Get transactions: GET /rest/v1/wallet_transactions_detailed

### Communication API
- Send email: POST /functions/v1/send-email
- Send SMS: POST /functions/v1/send-sms

## Rate Limiting

1000 requests per hour per user with burst limit of 100 per minute.`
  }
];

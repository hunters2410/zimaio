import { useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Book, Search, ChevronRight, Code, Database, Settings, Users, ShoppingCart, Shield, Zap, FileText, HelpCircle, ExternalLink } from 'lucide-react';

interface DocSection {
  id: string;
  title: string;
  icon: any;
  description: string;
  topics: DocTopic[];
}

interface DocTopic {
  id: string;
  title: string;
  content: string;
}

const documentation: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Book,
    description: 'Learn the basics of the ZimAIO marketplace platform',
    topics: [
      {
        id: 'intro',
        title: 'Introduction',
        content: `# Welcome to ZimAIO Marketplace

ZimAIO is a comprehensive multi-vendor e-commerce platform built with modern technologies. This documentation will guide you through all features and functionalities.

## Key Features
- **Multi-vendor Support**: Allow multiple vendors to sell on your platform
- **Advanced Analytics**: Track sales, performance, and user behavior
- **Fraud Detection**: Built-in security and fraud prevention
- **Multi-currency**: Support for multiple currencies and languages
- **Responsive Design**: Works seamlessly on all devices

## Quick Start
1. Configure your system settings
2. Add currencies and languages
3. Set up email and SMS notifications
4. Create promotional campaigns
5. Monitor vendor performance`
      },
      {
        id: 'dashboard',
        title: 'Admin Dashboard Overview',
        content: `# Admin Dashboard

The admin dashboard provides a comprehensive overview of your marketplace.

## Main Sections
- **Overview**: Key metrics and statistics
- **Sales Analytics**: Revenue trends and performance
- **User Management**: Manage customers and vendors
- **Order Management**: Track and process orders
- **Product Catalog**: Manage products and categories

## Quick Actions
- View recent orders
- Approve vendor applications
- Monitor fraud alerts
- Review customer feedback`
      }
    ]
  },
  {
    id: 'user-management',
    title: 'User Management',
    icon: Users,
    description: 'Manage customers, vendors, and admin users',
    topics: [
      {
        id: 'customers',
        title: 'Customer Management',
        content: `# Managing Customers

## Customer Profiles
View and manage customer information including:
- Personal details
- Order history
- Wallet balance
- Activity logs

## Customer Actions
- **View Details**: Access complete customer profile
- **Edit Information**: Update customer details
- **Suspend Account**: Temporarily disable access
- **Delete Account**: Permanently remove customer

## Customer Insights
- Total orders placed
- Lifetime value
- Average order value
- Last activity date`
      },
      {
        id: 'vendors',
        title: 'Vendor Management',
        content: `# Managing Vendors

## Vendor Approval Process
1. Vendor submits application
2. Admin reviews business details
3. Verify documents and credentials
4. Approve or reject application
5. Vendor receives notification

## Vendor Dashboard
Vendors have access to:
- Sales analytics
- Product management
- Order fulfillment
- Customer reviews
- Payout history

## Vendor Performance Metrics
- Total sales revenue
- Number of products
- Customer ratings
- Order fulfillment rate
- Response time`
      }
    ]
  },
  {
    id: 'orders',
    title: 'Order Management',
    icon: ShoppingCart,
    description: 'Process and track customer orders',
    topics: [
      {
        id: 'order-processing',
        title: 'Order Processing',
        content: `# Order Management

## Order Lifecycle
1. **Pending**: Order placed, awaiting payment
2. **Processing**: Payment confirmed, preparing shipment
3. **Shipped**: Order dispatched to customer
4. **Delivered**: Order received by customer
5. **Completed**: Transaction finalized

## Order Actions
- View order details
- Update order status
- Process refunds
- Generate invoices
- Track shipments

## Bulk Operations
- Export orders to CSV
- Bulk status updates
- Mass invoice generation
- Batch shipping labels`
      },
      {
        id: 'refunds',
        title: 'Refunds & Returns',
        content: `# Refund Management

## Refund Process
1. Customer requests refund
2. Admin reviews request
3. Approve or reject
4. Process payment reversal
5. Update inventory

## Refund Policies
- Full refund within 30 days
- Partial refund for damaged items
- Store credit option
- Restocking fees may apply

## Return Shipping
- Customer pays return shipping
- Free returns for defective items
- Provide return labels
- Track return shipments`
      }
    ]
  },
  {
    id: 'products',
    title: 'Product Catalog',
    icon: Database,
    description: 'Manage products, categories, and inventory',
    topics: [
      {
        id: 'product-management',
        title: 'Product Management',
        content: `# Product Management

## Adding Products
Required information:
- Product name and description
- Category and subcategory
- Price and SKU
- Images (multiple angles)
- Inventory quantity
- Shipping details

## Product Attributes
- Size, color, material
- Brand and manufacturer
- Weight and dimensions
- Custom attributes

## Inventory Management
- Track stock levels
- Low stock alerts
- Automatic reordering
- Multi-location inventory
- Variant management`
      },
      {
        id: 'categories',
        title: 'Categories & Tags',
        content: `# Category Management

## Category Structure
- Main categories
- Subcategories (unlimited depth)
- Category images
- SEO optimization

## Category Features
- Custom sorting
- Featured categories
- Category banners
- Filter options

## Product Tags
- Searchable keywords
- Trending tags
- Seasonal tags
- Brand tags
- Custom tags`
      }
    ]
  },
  {
    id: 'marketing',
    title: 'Marketing & Promotions',
    icon: Zap,
    description: 'Create campaigns, coupons, and advertisements',
    topics: [
      {
        id: 'promotions',
        title: 'Promotion Management',
        content: `# Promotions & Discounts

## Promotion Types
- **Coupon Codes**: Unique discount codes
- **Flash Sales**: Time-limited offers
- **Banner Promotions**: Homepage campaigns

## Creating Promotions
1. Set promotion name
2. Choose discount type (% or fixed)
3. Set validity period
4. Define usage limits
5. Set minimum purchase amount

## Promotion Analytics
- Total usage count
- Revenue impact
- Customer acquisition
- Conversion rates`
      },
      {
        id: 'ads',
        title: 'Advertisement Management',
        content: `# Vendor Advertisements

## Ad Approval Process
1. Vendor submits ad request
2. Admin reviews content
3. Approve or reject
4. Set display duration
5. Monitor performance

## Ad Types
- Banner ads
- Sponsored products
- Category promotions
- Homepage features

## Ad Metrics
- Impressions
- Click-through rate
- Conversions
- Revenue generated`
      }
    ]
  },
  {
    id: 'settings',
    title: 'System Configuration',
    icon: Settings,
    description: 'Configure platform settings and integrations',
    topics: [
      {
        id: 'general',
        title: 'General Settings',
        content: `# System Configuration

## Site Settings
- Site name and tagline
- Contact information
- Social media links
- Logo and branding
- Default language
- Default currency

## Email Configuration
- SMTP server settings
- Email templates
- Sender information
- Test email functionality

## SMS Configuration
- SMS provider (Twilio, Africa's Talking)
- API credentials
- Sender ID
- SMS templates`
      },
      {
        id: 'currencies',
        title: 'Currency & Language',
        content: `# Multi-currency & Multi-language

## Currency Management
- Add multiple currencies
- Set exchange rates
- Default currency
- Auto-update rates
- Currency symbols

## Language Management
- Add languages
- Translation files
- RTL support
- Default language
- Language switcher

## Localization
- Date formats
- Number formats
- Address formats
- Tax calculations`
      }
    ]
  },
  {
    id: 'security',
    title: 'Security & Fraud',
    icon: Shield,
    description: 'Protect your platform from fraud and threats',
    topics: [
      {
        id: 'fraud-detection',
        title: 'Fraud Detection',
        content: `# Fraud Prevention

## Risk Scoring
Automatic risk assessment based on:
- Transaction patterns
- User behavior
- IP address analysis
- Device fingerprinting
- Velocity checks

## Fraud Alerts
- High-risk transactions
- Suspicious activities
- Multiple failed attempts
- Unusual patterns

## Security Actions
- Block IP addresses
- Ban user accounts
- Hold suspicious orders
- Require verification
- Manual review queue`
      },
      {
        id: 'security-best-practices',
        title: 'Security Best Practices',
        content: `# Security Guidelines

## Admin Security
- Use strong passwords
- Enable two-factor authentication
- Regular password changes
- Limit admin access
- Monitor admin activities

## Data Protection
- Regular backups
- Encrypted connections (SSL)
- Secure payment processing
- PCI compliance
- GDPR compliance

## Monitoring
- Activity logs
- Failed login attempts
- Unusual access patterns
- System health checks`
      }
    ]
  },
  {
    id: 'analytics',
    title: 'Analytics & Reports',
    icon: FileText,
    description: 'Track performance and generate reports',
    topics: [
      {
        id: 'vendor-analytics',
        title: 'Vendor Performance',
        content: `# Vendor Analytics

## Performance Metrics
- Total sales revenue
- Number of orders
- Average order value
- Customer ratings
- Product count
- Growth percentage

## Vendor Rankings
- Top performers
- Revenue leaders
- Best rated vendors
- Most active vendors

## Performance Reports
- Sales by period
- Product performance
- Customer feedback
- Fulfillment rates`
      },
      {
        id: 'sales-reports',
        title: 'Sales Reports',
        content: `# Sales Analytics

## Revenue Reports
- Daily sales
- Monthly trends
- Yearly comparison
- Category breakdown
- Payment methods

## Export Options
- CSV export
- PDF reports
- Excel format
- Scheduled reports

## Custom Reports
- Date range selection
- Filter by category
- Vendor comparison
- Product analysis`
      }
    ]
  }
];

export default function Documentation() {
  const [selectedSection, setSelectedSection] = useState<DocSection>(documentation[0]);
  const [selectedTopic, setSelectedTopic] = useState<DocTopic>(documentation[0].topics[0]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSections = documentation.filter(section =>
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.topics.some(topic =>
      topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Book className="w-6 h-6 mr-2 text-blue-600" />
            Platform Documentation
          </h1>
          <p className="text-gray-600 text-sm mt-1">Comprehensive guide to using the ZimAIO marketplace platform</p>
        </div>

        <div className="bg-gray-50 p-3 rounded border border-gray-200">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1 space-y-2">
            {filteredSections.map((section) => (
              <div key={section.id} className="bg-gray-50 rounded border border-gray-200 overflow-hidden">
                <button
                  onClick={() => {
                    setSelectedSection(section);
                    setSelectedTopic(section.topics[0]);
                  }}
                  className={`w-full p-3 text-left flex items-center gap-2 hover:bg-gray-100 transition ${selectedSection.id === section.id ? 'bg-blue-100 border-l-4 border-blue-600' : ''}`}
                >
                  <section.icon className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-slate-900">{section.title}</h3>
                    <p className="text-xs text-slate-600 line-clamp-1">{section.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                {selectedSection.id === section.id && (
                  <div className="bg-white border-t border-gray-200">
                    {section.topics.map((topic) => (
                      <button
                        key={topic.id}
                        onClick={() => setSelectedTopic(topic)}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition ${selectedTopic.id === topic.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'}`}
                      >
                        {topic.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="prose prose-sm max-w-none">
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-2 text-xs text-slate-600 mb-2">
                    <selectedSection.icon className="w-4 h-4" />
                    <span>{selectedSection.title}</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-blue-600">{selectedTopic.title}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedTopic.title}</h2>
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {selectedTopic.content}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <HelpCircle className="w-4 h-4" />
                    <span>Need more help?</span>
                  </div>
                  <a href="#" className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Contact Support
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <Code className="w-5 h-5 text-blue-600 mb-2" />
                <h4 className="text-sm font-bold text-slate-900 mb-1">API Reference</h4>
                <p className="text-xs text-slate-600">Developer documentation and API endpoints</p>
              </div>
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <FileText className="w-5 h-5 text-green-600 mb-2" />
                <h4 className="text-sm font-bold text-slate-900 mb-1">Video Tutorials</h4>
                <p className="text-xs text-slate-600">Step-by-step video guides</p>
              </div>
              <div className="bg-purple-50 p-3 rounded border border-purple-200">
                <HelpCircle className="w-5 h-5 text-purple-600 mb-2" />
                <h4 className="text-sm font-bold text-slate-900 mb-1">FAQ</h4>
                <p className="text-xs text-slate-600">Frequently asked questions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

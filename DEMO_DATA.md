# Demo Data Setup Instructions

This document provides instructions for setting up demo users and testing the ZimAIO marketplace platform.

## Demo User Accounts

To fully test the system, please create the following user accounts through the signup process:

### Admin Account
- **Email**: admin@zimaio.com
- **Password**: Admin123!
- **Role**: Admin (set during signup or manually update in database)
- **Access**: Full platform management, vendor approval, delivery tracking, appearance settings

### Vendor Accounts

#### Vendor 1: TechZone Electronics
- **Email**: vendor1@test.com
- **Password**: Vendor123!
- **Business Name**: TechZone Electronics
- **Description**: Leading provider of quality electronics, gadgets, and smart devices
- **Products**: Electronics, gadgets, tech accessories

#### Vendor 2: FreshMart Groceries
- **Email**: vendor2@test.com
- **Password**: Vendor123!
- **Business Name**: FreshMart Groceries
- **Description**: Fresh produce, groceries, and household essentials
- **Products**: Groceries, fresh food, kitchen items

### Customer Accounts

#### Customer 1
- **Email**: customer1@test.com
- **Password**: Customer123!
- **Name**: collen hunters
- **Phone**: +263771234568

#### Customer 2
- **Email**: customer2@test.com
- **Password**: Customer123!
- **Name**: Jane Smith
- **Phone**: +263771234569

## Demo Categories

The system includes the following pre-configured categories:
- Electronics
- Groceries
- Home & Kitchen
- Fashion
- Sports

## Sample Products

Once vendors sign up and are approved, they can add products in these categories. Suggested sample products:

### For TechZone Electronics (Vendor 1):
- Wireless Bluetooth Headphones - $89.99
- Smart Watch Pro - $199.99
- USB-C Fast Charger - $34.99
- Portable Power Bank 20000mAh - $45.99
- HD Webcam 1080p - $69.99
- Wireless Mouse & Keyboard Set - $55.99

### For FreshMart Groceries (Vendor 2):
- Fresh Organic Tomatoes (1kg) - $3.99
- Free Range Eggs (12 pack) - $5.99
- Fresh Bread Loaf - $2.49
- Premium Coffee Beans (500g) - $12.99
- Fresh Orange Juice (1L) - $6.99
- Organic Bananas (1kg) - $4.49

## Delivery System Testing

### Test Tracking Numbers
Once deliveries are created, you can test the tracking system with:
- TRK123456789 (In Transit)
- TRK987654321 (Pending)
- TRK456789123 (Delivered)

### Testing Workflow
1. Customer places order
2. Vendor confirms order
3. Delivery is created automatically with tracking number
4. Track order using tracking number at `/track-order`
5. Admin can view all deliveries at `/admin/deliveries`

## Features to Test

### As Admin:
- Approve/reject vendor applications
- Manage all vendors
- View and manage deliveries
- Configure navigation menu
- Customize appearance (fonts, colors)
- Monitor platform statistics

### As Vendor:
- Complete vendor profile
- Add products with images and descriptions
- Manage inventory
- Process orders
- View sales statistics

### As Customer:
- Browse products by category
- Search for products
- Add items to cart
- Place orders
- Track order delivery
- View order history

## Multi-Currency Support

The platform supports multiple currencies:

### Supported Currencies
- **USD** - United States Dollar (default)
- **ZWL** - Zimbabwean Dollar

### Features
- Currency selector in the header (top-right corner)
- Automatic price conversion based on real-time exchange rates
- Products can be priced in any supported currency
- Prices are displayed in the user's selected currency
- Exchange rates are managed in the database and can be updated by admins

### Exchange Rates (Current)
- 1 USD = 27,500 ZWL
- 1 ZWL = 0.000036 USD

### How to Use
1. Click on the currency dropdown in the header (shows current currency, e.g., "USD")
2. Select your preferred currency (USD or ZWL)
3. All prices throughout the site will automatically convert to your selected currency
4. Your preference is saved locally for future visits

### For Vendors
- When adding products, select the currency you want to price in
- Customers will see prices converted to their preferred currency
- Orders record both the display currency and original product currency

## Database Notes

- The delivery system includes tables for drivers, deliveries, and tracking history
- All tables have proper RLS policies for security
- Tracking numbers are automatically generated
- Delivery statuses: pending, assigned, picked_up, in_transit, delivered, cancelled
- Exchange rates table stores currency conversion rates
- Products table includes currency_code column
- Orders table tracks currency and exchange rate at time of purchase

## Support

For any issues or questions about the demo data setup, please contact the development team.

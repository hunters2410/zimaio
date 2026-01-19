# Payment Gateways Integration Guide

This guide explains the comprehensive payment gateway system that has been integrated into your multi-vendor e-commerce platform.

## Overview

The platform now supports multiple payment gateways:
- **PayNow Zimbabwe** - Mobile money and bank cards for Zimbabwe
- **PayPal** - International payments
- **Stripe** - Credit cards and digital wallets
- **Cash on Delivery** - Pay when order arrives
- **Custom Manual Gateways** - Add your own payment methods with instructions

## Features

### Admin Features

1. **Payment Gateway Management**
   - Enable/disable payment gateways
   - Configure gateway credentials and settings
   - Set up manual payment gateways with custom instructions
   - View active gateways and their configurations
   - Manage payment instructions step-by-step

2. **Transaction Tracking**
   - View all payment transactions
   - Monitor transaction status (pending, processing, completed, failed, etc.)
   - Track payment references and gateway transaction IDs
   - View transaction metadata and error messages

3. **Security**
   - Sensitive credentials stored securely in database
   - Row-level security policies protect data
   - Admin-only access to gateway configurations
   - Encrypted communication with payment providers

### Customer Features

1. **Multiple Payment Options**
   - Choose from available active gateways at checkout
   - See payment instructions for manual gateways
   - Secure payment processing
   - Real-time payment status updates

## Setting Up Payment Gateways

### Access the Admin Panel

Navigate to: **Admin Dashboard → Payment Gateways**

### 1. PayNow Zimbabwe

**Requirements:**
- Active PayNow merchant account
- Integration ID and Integration Key

**Setup Steps:**
1. Sign up at https://www.paynow.co.zw
2. Get your Integration ID and Key from the merchant dashboard
3. In the admin panel, click "Configure" on the PayNow gateway
4. Enter your Integration ID and Integration Key
5. Set your Return URL (where customers return after payment)
6. Set your Result URL (where PayNow sends payment results)
7. Click "Save Configuration"
8. Enable the gateway by clicking the "Enable" button

**Return URL Format:** `https://yourdomain.com/payment/return`
**Result URL Format:** `https://yourdomain.com/payment/result`

**Supported Currencies:** USD, ZWL

**Documentation:** https://developers.paynow.co.zw/docs/integration_generation

### 2. PayPal

**Requirements:**
- PayPal Business account
- REST API credentials

**Setup Steps:**
1. Create a PayPal Business account at https://www.paypal.com/business
2. Go to Developer Dashboard at https://developer.paypal.com
3. Create a REST API app under "My Apps & Credentials"
4. Copy the Client ID and Secret
5. In the admin panel, click "Configure" on the PayPal gateway
6. Enter your Client ID and Secret
7. Select mode: "Sandbox" for testing, "Live" for production
8. Click "Save Configuration"
9. Enable the gateway

**Supported Currencies:** USD, EUR, GBP, AUD, CAD, JPY

**Testing:** Use sandbox credentials for testing before going live

### 3. Stripe

**Requirements:**
- Stripe account
- API keys (Publishable and Secret)

**Setup Steps:**
1. Sign up at https://stripe.com
2. Complete account verification
3. Go to Developers → API keys
4. Copy your Publishable key and Secret key
5. In the admin panel, click "Configure" on the Stripe gateway
6. Enter your keys
7. Click "Save Configuration"
8. Enable the gateway

**Supported Currencies:** USD, EUR, GBP, ZAR, AUD, CAD

**Testing:** Use test keys (pk_test_ and sk_test_) for development

### 4. Cash on Delivery

This gateway is enabled by default and requires no configuration. Customers will pay cash when their order is delivered.

### 5. Adding Manual Payment Gateways

You can add custom payment methods like bank transfers, mobile money, or other local payment options.

**Setup Steps:**
1. Click "Add Manual Gateway" button
2. Enter gateway details:
   - **Gateway Name:** Lowercase identifier (e.g., `bank_transfer`)
   - **Display Name:** What customers see (e.g., "Bank Transfer")
   - **Description:** Brief description of the payment method
   - **Instructions:** Detailed payment instructions for customers
   - **Logo URL:** (Optional) URL to gateway logo
3. Click "Add Gateway"
4. The gateway will be created as inactive
5. Click "Configure" to add step-by-step instructions
6. Enable the gateway when ready

**Example Instructions:**
```
To pay via bank transfer:
1. Bank: First National Bank
2. Account Name: Your Store Name
3. Account Number: 1234567890
4. Branch Code: 250655
5. Reference: Use your Order Number
6. After payment, send proof to payments@yourstore.com
```

## Payment Flow

### For Customers

1. **Checkout:**
   - Customer completes order
   - Selects payment method from available gateways
   - Clicks "Pay Now"

2. **Payment Processing:**
   - For PayNow/PayPal/Stripe: Redirected to secure payment page
   - For Cash: Order confirmed, payment on delivery
   - For Manual: Instructions displayed, customer follows steps

3. **Confirmation:**
   - Payment status updated in real-time
   - Order status changes to "paid" on successful payment
   - Customer receives confirmation

### For Admins

1. **Monitor Transactions:**
   - View all transactions in admin panel
   - Check payment status and references
   - Verify manual payments manually

2. **Handle Failed Payments:**
   - Review failed transactions
   - Contact customers if needed
   - Retry or cancel orders as appropriate

## Database Structure

### Tables Created

1. **payment_gateways**
   - Stores gateway configurations
   - Includes credentials and settings
   - Controls active/inactive status

2. **payment_transactions**
   - Tracks all payment attempts
   - Links to orders and users
   - Stores transaction status and references

3. **payment_instructions**
   - Step-by-step instructions for manual gateways
   - Ordered by step number
   - Displayed to customers at checkout

## Edge Function

**Function:** `process-payment`

This serverless function handles payment initiation for all gateways:
- Validates order and user authorization
- Creates payment transaction record
- Initiates payment with gateway provider
- Returns payment URL or instructions
- Updates transaction status

**Endpoint:** `{SUPABASE_URL}/functions/v1/process-payment`

## Security Features

1. **Row-Level Security (RLS)**
   - Users can only view their own transactions
   - Admins can view all transactions
   - Public can only see active gateways (without credentials)

2. **Sensitive Data Protection**
   - API keys and secrets stored in database
   - Not exposed to frontend
   - Only accessible by edge functions and admins

3. **Transaction Validation**
   - Order ownership verified before payment
   - Gateway availability checked
   - Amount and currency validated

## Testing

### Test Mode

1. **PayNow:** Use sandbox Integration ID and Key
2. **PayPal:** Use sandbox mode with test credentials
3. **Stripe:** Use test keys (pk_test_ prefix)
4. **Cash/Manual:** Available immediately

### Test Transactions

1. Navigate to checkout with a test order
2. Select payment gateway
3. Follow payment flow
4. Verify transaction status in admin panel
5. Check order payment status update

## Troubleshooting

### Gateway Not Appearing

- Check if gateway is enabled in admin panel
- Verify configuration is complete
- Ensure supported currency matches order currency

### Payment Fails

- Check gateway credentials are correct
- Verify gateway is in correct mode (sandbox vs live)
- Check transaction error message in admin panel
- Review gateway provider dashboard for errors

### Return URLs Not Working

- Ensure URLs are publicly accessible
- Check for HTTPS (required by most gateways)
- Verify URL format is correct
- Test URLs manually in browser

## API Integration

### Initiating Payment (Frontend)

```typescript
import { paymentService } from './services/paymentService';

const response = await paymentService.initiatePayment({
  order_id: 'uuid',
  gateway_type: 'paynow',
  amount: 100.00,
  currency: 'USD',
  return_url: 'https://yoursite.com/orders/success',
  metadata: { order_number: 'ORD-123' }
});

if (response.redirect_url) {
  window.location.href = response.redirect_url;
}
```

### Checking Transaction Status

```typescript
const transaction = await paymentService.getTransactionById(transactionId);
console.log(transaction.status); // pending, processing, completed, failed, etc.
```

## Production Checklist

Before going live:

- [ ] Test all payment gateways thoroughly
- [ ] Switch PayPal from sandbox to live mode
- [ ] Use Stripe live keys instead of test keys
- [ ] Verify PayNow is using production credentials
- [ ] Update return and result URLs to production domains
- [ ] Enable SSL/HTTPS on your domain
- [ ] Test complete order flow including payment
- [ ] Set up payment failure notifications
- [ ] Configure refund handling process
- [ ] Review and test transaction reporting

## Support

For gateway-specific issues:
- **PayNow:** https://paynow.co.zw/support
- **PayPal:** https://www.paypal.com/businesshelp
- **Stripe:** https://support.stripe.com

For integration issues, check the transaction error messages in the admin panel for debugging information.

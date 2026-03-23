-- Insert Standard System Email Templates

INSERT INTO public.email_templates (template_name, template_subject, template_body, template_type, variables, is_active)
VALUES 
(
  'order_placed', 
  'Order Received - #{{order_number}}', 
  '<html><body><h1>We got your order!</h1><p>Hi {{customer_name}},</p><p>Your order <strong>#{{order_number}}</strong> has been successfully placed. Your total is <strong>${{order_total}}</strong>.</p><p>We will notify you once it ships!</p></body></html>', 
  'order_confirmation', 
  '["customer_name", "order_number", "order_total"]', 
  true
),
(
  'order_shipped', 
  'Your Order #{{order_number}} has shipped!', 
  '<html><body><h1>Great news!</h1><p>Hi {{customer_name}},</p><p>Your order <strong>#{{order_number}}</strong> is on its way. You can track it using tracking number: <strong>{{tracking_number}}</strong>.</p></body></html>', 
  'shipping_notification', 
  '["customer_name", "order_number", "tracking_number"]', 
  true
),
(
  'order_delivered', 
  'Order Delivered - #{{order_number}}', 
  '<html><body><h1>Package Delivered</h1><p>Hi {{customer_name}},</p><p>Your order <strong>#{{order_number}}</strong> has been delivered. We hope you love your items!</p><p>If you have any issues, please contact support.</p></body></html>', 
  'custom', 
  '["customer_name", "order_number"]', 
  true
),
(
  'payment_received', 
  'Payment Receipt for Order #{{order_number}}', 
  '<html><body><h1>Payment Successful</h1><p>Hi {{customer_name}},</p><p>We have successfully received your payment of <strong>${{payment_amount}}</strong> for order <strong>#{{order_number}}</strong>.</p></body></html>', 
  'custom', 
  '["customer_name", "order_number", "payment_amount"]', 
  true
),
(
  'payment_failed', 
  'Action Required: Payment Failed for Order #{{order_number}}', 
  '<html><body><h1>Payment Failed</h1><p>Hi {{customer_name}},</p><p>Unfortunately, your payment for order <strong>#{{order_number}}</strong> could not be processed. Please update your payment method to complete the order.</p></body></html>', 
  'custom', 
  '["customer_name", "order_number"]', 
  true
),
(
  'user_registered', 
  'Welcome to ZimAIO!', 
  '<html><body><h1>Welcome!</h1><p>Hi {{user_name}},</p><p>Welcome to ZimAIO! We are thrilled to have you here. You can now log in and explore.</p></body></html>', 
  'welcome', 
  '["user_name"]', 
  true
),
(
  'vendor_approved', 
  'Your Shop is Approved!', 
  '<html><body><h1>Congratulations {{vendor_name}}!</h1><p>Your shop documents have been reviewed and your account is officially <strong>Approved</strong>.</p><p>You can now start placing your items on the global marketplace!</p></body></html>', 
  'vendor_approval', 
  '["vendor_name"]', 
  true
),
(
  'product_out_of_stock', 
  'Out of Stock Alert: {{product_name}}', 
  '<html><body><h1>Inventory Alert</h1><p>Hi {{vendor_name}},</p><p>Your product <strong>{{product_name}}</strong> is currently out of stock. Please restock it as soon as possible to avoid losing sales.</p></body></html>', 
  'custom', 
  '["vendor_name", "product_name"]', 
  true
),
(
   'refund_requested', 
  'Refund Request Received', 
  '<html><body><h1>Refund Request Status</h1><p>Hi {{customer_name}},</p><p>We have received your requested refund of <strong>${{refund_amount}}</strong> for order <strong>#{{order_number}}</strong>. We are processing it now.</p></body></html>', 
  'refund_processed', 
  '["customer_name", "order_number", "refund_amount"]', 
  true
),
(
  'guest_registration', 
  'Your ZimAIO Account Details', 
  '<html><body><h1>Welcome to ZimAIO!</h1><p>Hi {{customer_name}},</p><p>Your account has been created for your checkout. You can use the details below to log in and track your orders:</p><p><strong>Email:</strong> {{email}}<br/><strong>Temporary Password:</strong> {{password}}</p><p>We recommend changing your password after logging in.</p></body></html>', 
  'welcome', 
  '["customer_name", "email", "password"]', 
  true
),
(
  'order_cancelled', 
  'Order Cancelled - #{{order_number}}', 
  '<html><body><h1>Order Cancellation</h1><p>Hi {{customer_name}},</p><p>Your order <strong>#{{order_number}}</strong> has been cancelled. If you have already paid, a refund will be processed shortly.</p><p>We apologize for any inconvenience.</p></body></html>', 
  'custom', 
  '["customer_name", "order_number"]', 
  true
),
(
  'refund_processed', 
  'Refund Processed - #{{order_number}}', 
  '<html><body><h1>Refund Processed</h1><p>Hi {{customer_name}},</p><p>Your refund of <strong>${{refund_amount}}</strong> for order <strong>#{{order_number}}</strong> has been processed successfully.</p><p>The funds should appear in your account within 3-5 business days depending on your bank.</p></body></html>', 
  'refund_processed', 
  '["customer_name", "order_number", "refund_amount"]', 
  true
)
ON CONFLICT (template_name) DO UPDATE 
SET template_subject = EXCLUDED.template_subject,
    template_body = EXCLUDED.template_body,
    variables = EXCLUDED.variables;

-- Insert Trigger for Guest Registration
INSERT INTO public.event_triggers (name, event_type, action_type, actions)
VALUES 
(
  'Guest Checkout Registration',
  'guest_registration',
  'send_email',
  '{"template_name": "guest_registration"}'::jsonb
),
(
  'New User Welcome',
  'user_registered',
  'send_email',
  '{"template_name": "user_registered"}'::jsonb
),
(
  'Order Confirmation',
  'order_placed',
  'send_email',
  '{"template_name": "order_placed"}'::jsonb
),
(
  'Shipping Notification',
  'order_shipped',
  'send_email',
  '{"template_name": "order_shipped"}'::jsonb
),
(
  'Delivery Confirmation',
  'order_delivered',
  'send_email',
  '{"template_name": "order_delivered"}'::jsonb
),
(
  'Order Cancellation',
  'order_cancelled',
  'send_email',
  '{"template_name": "order_cancelled"}'::jsonb
),
(
  'Payment Successful',
  'payment_received',
  'send_email',
  '{"template_name": "payment_received"}'::jsonb
),
(
  'Vendor Approved',
  'vendor_approved',
  'send_email',
  '{"template_name": "vendor_approved"}'::jsonb
),
(
  'Refund Processed',
  'refund_processed',
  'send_email',
  '{"template_name": "refund_processed"}'::jsonb
)
ON CONFLICT DO NOTHING;

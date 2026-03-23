-- Fix contradictory constraint on orders: customer_id and vendor_id should allow NULL if ON DELETE SET NULL is used
ALTER TABLE orders ALTER COLUMN customer_id DROP NOT NULL;
ALTER TABLE orders ALTER COLUMN vendor_id DROP NOT NULL;

-- Also fix any other similar potential issues in order_refunds and product_reviews
ALTER TABLE product_reviews ALTER COLUMN order_id DROP NOT NULL; -- Already allows NULL, but let's be sure
ALTER TABLE order_refunds ALTER COLUMN customer_id DROP NOT NULL;
ALTER TABLE order_refunds ALTER COLUMN vendor_id DROP NOT NULL;

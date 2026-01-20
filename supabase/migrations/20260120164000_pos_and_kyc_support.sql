-- Support for POS and KYC
-- 1. Make customer_id nullable in orders (for walk-in customers)
ALTER TABLE orders ALTER COLUMN customer_id DROP NOT NULL;

-- 2. Create order_items table if not exists (for granular POS tracking)
CREATE TABLE IF NOT EXISTS order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    product_id uuid REFERENCES products(id) ON DELETE SET NULL,
    quantity integer NOT NULL,
    unit_price numeric NOT NULL,
    total_price numeric NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 3. Add decrement_stock function
CREATE OR REPLACE FUNCTION decrement_stock(product_id uuid, amount integer)
RETURNS void AS $$
BEGIN
    UPDATE products
    SET stock_quantity = stock_quantity - amount
    WHERE id = product_id AND stock_quantity >= amount;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient stock for product %', product_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. Ensure KYC columns and status exist
DO $$
BEGIN
    -- Converting enum column to text to avoid transaction restricted enum additions
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'vendor_profiles' 
        AND column_name = 'kyc_status' 
        AND data_type = 'USER-DEFINED'
    ) THEN
        ALTER TABLE vendor_profiles ALTER COLUMN kyc_status DROP DEFAULT;
        ALTER TABLE vendor_profiles ALTER COLUMN kyc_status TYPE text USING kyc_status::text;
    END IF;

    -- Add kyc_details column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_profiles' AND column_name = 'kyc_details') THEN
        ALTER TABLE vendor_profiles ADD COLUMN kyc_details jsonb DEFAULT '{}'::jsonb;
    END IF;
    
    -- Ensure default kyc_status is 'none' and set for existing
    ALTER TABLE vendor_profiles ALTER COLUMN kyc_status SET DEFAULT 'none';
    UPDATE vendor_profiles SET kyc_status = 'none' WHERE kyc_status IS NULL;
END $$;

-- 5. Enable RLS for order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view their own order items"
ON order_items FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM orders
        JOIN vendor_profiles ON orders.vendor_id = vendor_profiles.id
        WHERE order_items.order_id = orders.id
        AND vendor_profiles.user_id = auth.uid()
    )
);

CREATE POLICY "Vendors can insert their own order items"
ON order_items FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM orders
        JOIN vendor_profiles ON orders.vendor_id = vendor_profiles.id
        WHERE order_items.order_id = orders.id
        AND vendor_profiles.user_id = auth.uid()
    )
);

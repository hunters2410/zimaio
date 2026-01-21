-- Create shipping_methods table
CREATE TABLE IF NOT EXISTS shipping_methods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    display_name text NOT NULL,
    description text,
    base_cost numeric NOT NULL DEFAULT 0,
    delivery_time_min integer NOT NULL DEFAULT 1,
    delivery_time_max integer NOT NULL DEFAULT 3,
    is_active boolean DEFAULT true,
    is_global boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Update shipping_zones to include regions
ALTER TABLE shipping_zones ADD COLUMN IF NOT EXISTS regions text[];

-- Create wishlists table
CREATE TABLE IF NOT EXISTS wishlists (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, product_id)
);

-- RLS for shipping_methods
ALTER TABLE shipping_methods ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Anyone can view active shipping methods"
        ON shipping_methods FOR SELECT
        USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can manage shipping methods"
        ON shipping_methods FOR ALL
        USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS for wishlists
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can manage own wishlist"
        ON wishlists FOR ALL
        TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add demo shipping data
INSERT INTO shipping_methods (name, display_name, description, base_cost, delivery_time_min, delivery_time_max)
VALUES 
('standard', 'Standard Shipping', 'Economical shipping for your everyday items', 3.00, 3, 5),
('express', 'Express Delivery', 'Fast delivery for urgent orders', 10.00, 1, 2),
('dhl', 'DHL Global Express', 'Premium international shipping partner', 25.00, 2, 4)
ON CONFLICT DO NOTHING;

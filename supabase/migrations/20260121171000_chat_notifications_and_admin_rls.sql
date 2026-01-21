-- 1. Enable Realtime for crucial tables
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- 2. Enhanced Chat Policies
DO $$ BEGIN
    CREATE POLICY "Users can create conversations"
      ON chat_conversations FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = ANY(participant_ids));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update own conversations"
      ON chat_conversations FOR UPDATE
      TO authenticated
      USING (auth.uid() = ANY(participant_ids))
      WITH CHECK (auth.uid() = ANY(participant_ids));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Admin Catalog Management Policies
-- Ensure admins can manage categories and brands
DO $$ BEGIN
    DROP POLICY IF EXISTS "Anyone can view active categories" ON categories;
    CREATE POLICY "Anyone can view active categories"
      ON categories FOR SELECT
      USING (is_active = true OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can manage categories"
      ON categories FOR ALL
      TO authenticated
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Anyone can view active brands" ON brands;
    CREATE POLICY "Anyone can view active brands"
      ON brands FOR SELECT
      USING (is_active = true OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can manage brands"
      ON brands FOR ALL
      TO authenticated
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Notification Policies (Ensure complete coverage)
DO $$ BEGIN
    CREATE POLICY "Users can delete own notifications"
      ON notifications FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. Additional Product Policies for Vendors
DO $$ BEGIN
    CREATE POLICY "Vendors can view all categories"
      ON categories FOR SELECT
      TO authenticated
      USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Vendors can view all brands"
      ON brands FOR SELECT
      TO authenticated
      USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. Admin Review Management
DO $$ BEGIN
    CREATE POLICY "Admins can manage product reviews"
      ON product_reviews FOR ALL
      TO authenticated
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

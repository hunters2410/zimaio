-- Create messages table for customer-vendor chat
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'vendor')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_customer_vendor ON messages(customer_id, vendor_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(is_read) WHERE is_read = FALSE;

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Customers can view their own messages
CREATE POLICY "Customers can view their messages"
ON messages FOR SELECT
TO authenticated
USING (
    auth.uid() = customer_id 
    OR auth.uid() IN (
        SELECT user_id FROM vendor_profiles WHERE id = vendor_id
    )
);

-- Policy: Customers can send messages
CREATE POLICY "Customers can send messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = customer_id 
    AND sender_id = auth.uid() 
    AND sender_type = 'customer'
);

-- Policy: Vendors can send messages
CREATE POLICY "Vendors can send messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() IN (
        SELECT user_id FROM vendor_profiles WHERE id = vendor_id
    )
    AND sender_id = auth.uid()
    AND sender_type = 'vendor'
);

-- Policy: Users can mark their messages as read
CREATE POLICY "Users can mark messages as read"
ON messages FOR UPDATE
TO authenticated
USING (
    auth.uid() = customer_id 
    OR auth.uid() IN (
        SELECT user_id FROM vendor_profiles WHERE id = vendor_id
    )
);

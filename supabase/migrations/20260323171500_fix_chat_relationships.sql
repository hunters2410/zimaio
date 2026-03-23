-- Migration: Fix Chat Schema for Vendor-Customer Conversations
-- The original chat_conversations table used participant_ids UUID[].
-- We add dedicated customer_id and vendor_id columns for use in vendor chat,
-- then apply RLS policies that depend on those columns.

-- 1. Add customer_id column
ALTER TABLE chat_conversations
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- 2. Add vendor_id column (maps to vendor_profiles)
ALTER TABLE chat_conversations
ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES vendor_profiles(id) ON DELETE CASCADE;

-- 3. Add last_message and last_message_at columns if missing
ALTER TABLE chat_conversations
ADD COLUMN IF NOT EXISTS last_message TEXT;

ALTER TABLE chat_conversations
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 4. Backfill from participant_ids if that column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chat_conversations' AND column_name = 'participant_ids'
    ) THEN
        -- Populate customer_id from participant_ids[1] if not already set
        UPDATE chat_conversations
        SET customer_id = participant_ids[1]
        WHERE customer_id IS NULL AND array_length(participant_ids, 1) >= 1;

        -- Populate vendor_id: map participant_ids[2] to vendor_profiles.id
        UPDATE chat_conversations cc
        SET vendor_id = vp.id
        FROM vendor_profiles vp
        WHERE cc.vendor_id IS NULL
          AND array_length(cc.participant_ids, 1) >= 2
          AND vp.user_id = cc.participant_ids[2];
    END IF;
END $$;

-- 5. Fix chat_messages: add FK for conversation and sender if not present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY'
          AND table_name = 'chat_messages'
          AND constraint_name = 'chat_messages_conversation_id_fkey'
    ) THEN
        ALTER TABLE chat_messages
        ADD CONSTRAINT chat_messages_conversation_id_fkey
        FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- 6. Performance indexes
CREATE INDEX IF NOT EXISTS idx_chat_conversations_vendor_id ON chat_conversations(vendor_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_customer_id ON chat_conversations(customer_id);

-- 7. RLS Policies for vendor chat (now that customer_id and vendor_id columns exist)
DROP POLICY IF EXISTS "Participants can view their own conversations" ON chat_conversations;
CREATE POLICY "Participants can view their own conversations"
ON chat_conversations FOR SELECT
TO authenticated
USING (
    customer_id = auth.uid() OR 
    vendor_id IN (SELECT id FROM vendor_profiles WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Participants can view messages in their conversations" ON chat_messages;
CREATE POLICY "Participants can view messages in their conversations"
ON chat_messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM chat_conversations
        WHERE chat_conversations.id = chat_messages.conversation_id
        AND (
            chat_conversations.customer_id = auth.uid() OR 
            chat_conversations.vendor_id IN (SELECT id FROM vendor_profiles WHERE user_id = auth.uid()) OR
            EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        )
    )
);

DROP POLICY IF EXISTS "Participants can send messages" ON chat_messages;
CREATE POLICY "Participants can send messages"
ON chat_messages FOR INSERT
TO authenticated
WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM chat_conversations
        WHERE chat_conversations.id = chat_messages.conversation_id
        AND (
            chat_conversations.customer_id = auth.uid() OR 
            chat_conversations.vendor_id IN (SELECT id FROM vendor_profiles WHERE user_id = auth.uid())
        )
    )
);

DROP POLICY IF EXISTS "Recipients can mark messages as read" ON chat_messages;
CREATE POLICY "Recipients can mark messages as read"
ON chat_messages FOR UPDATE
TO authenticated
USING (
    sender_id != auth.uid() AND
    EXISTS (
        SELECT 1 FROM chat_conversations
        WHERE chat_conversations.id = chat_messages.conversation_id
        AND (
            chat_conversations.customer_id = auth.uid() OR 
            chat_conversations.vendor_id IN (SELECT id FROM vendor_profiles WHERE user_id = auth.uid())
        )
    )
)
WITH CHECK (is_read = true);

-- 8. Ensure Realtime is enabled for chat_messages
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'chat_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
    END IF;
END $$;

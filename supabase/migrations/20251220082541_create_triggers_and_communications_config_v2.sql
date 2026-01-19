/*
  # Create Event Triggers and Communication Configuration Tables

  ## Overview
  This migration creates the infrastructure for automated event-based triggers and
  communication configuration management (SMS and Email).

  ## New Tables

  ### 1. event_triggers
  Stores automated trigger rules that execute actions based on system events.
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Human-readable trigger name
  - `event_type` (text) - Type of event that activates the trigger
  - `action_type` (text) - Type of action to execute
  - `conditions` (jsonb) - JSON conditions that must be met
  - `actions` (jsonb) - JSON actions to execute
  - `is_active` (boolean) - Whether trigger is enabled
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. sms_configurations
  Stores SMS gateway configuration for sending text messages.
  - `id` (uuid, primary key) - Unique identifier
  - `provider` (text) - SMS provider name (twilio, africastalking, etc.)
  - `api_key` (text) - Provider API key or access token
  - `sender_id` (text) - Sender ID or phone number
  - `is_active` (boolean) - Whether configuration is active
  - `settings` (jsonb) - Provider-specific settings
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. email_configurations
  Stores email server configuration for sending transactional emails.
  - `id` (uuid, primary key) - Unique identifier
  - `provider` (text) - Email provider (smtp, sendgrid, etc.)
  - `smtp_host` (text) - SMTP server hostname
  - `smtp_port` (integer) - SMTP server port
  - `username` (text) - SMTP username or API key
  - `password` (text) - SMTP password or API secret
  - `from_email` (text) - Default sender email address
  - `from_name` (text) - Default sender name
  - `is_active` (boolean) - Whether configuration is active
  - `settings` (jsonb) - Provider-specific settings
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - RLS enabled on all tables
  - Only admins can access these configurations
  - Sensitive credentials stored securely
*/

-- Create event_triggers table
CREATE TABLE IF NOT EXISTS event_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  event_type text NOT NULL,
  action_type text NOT NULL,
  conditions jsonb DEFAULT '{}'::jsonb,
  actions jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sms_configurations table
CREATE TABLE IF NOT EXISTS sms_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  api_key text,
  sender_id text,
  is_active boolean DEFAULT true,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create email_configurations table
CREATE TABLE IF NOT EXISTS email_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  smtp_host text,
  smtp_port integer DEFAULT 587,
  username text,
  password text,
  from_email text,
  from_name text,
  is_active boolean DEFAULT true,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE event_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_configurations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_triggers
CREATE POLICY "Admins can view all event triggers"
  ON event_triggers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert event triggers"
  ON event_triggers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update event triggers"
  ON event_triggers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete event triggers"
  ON event_triggers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for sms_configurations
CREATE POLICY "Admins can view SMS configurations"
  ON sms_configurations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert SMS configurations"
  ON sms_configurations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update SMS configurations"
  ON sms_configurations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete SMS configurations"
  ON sms_configurations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for email_configurations
CREATE POLICY "Admins can view email configurations"
  ON email_configurations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert email configurations"
  ON email_configurations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update email configurations"
  ON email_configurations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete email configurations"
  ON email_configurations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_event_triggers_event_type ON event_triggers(event_type);
CREATE INDEX IF NOT EXISTS idx_event_triggers_is_active ON event_triggers(is_active);
CREATE INDEX IF NOT EXISTS idx_sms_configurations_is_active ON sms_configurations(is_active);
CREATE INDEX IF NOT EXISTS idx_email_configurations_is_active ON email_configurations(is_active);

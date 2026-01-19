/*
  # Admin User & Vendor Management System

  ## New Tables
  
  ### 1. `kyc_verifications`
  Tracks KYC verification status for vendors
  - `id` (uuid, primary key)
  - `vendor_id` (uuid, foreign key to profiles)
  - `document_type` (text: passport, drivers_license, national_id, business_registration)
  - `document_number` (text)
  - `document_url` (text)
  - `verification_status` (text: pending, approved, rejected)
  - `verified_by` (uuid, foreign key to profiles - admin who verified)
  - `verified_at` (timestamptz)
  - `rejection_reason` (text)
  - `submitted_at` (timestamptz)
  - `expires_at` (timestamptz)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `vendor_contracts`
  Tracks vendor terms & contract acceptance
  - `id` (uuid, primary key)
  - `vendor_id` (uuid, foreign key to profiles)
  - `contract_version` (text)
  - `terms_accepted` (boolean)
  - `accepted_at` (timestamptz)
  - `ip_address` (text)
  - `user_agent` (text)
  - `contract_text` (text)
  - `created_at` (timestamptz)

  ### 3. `user_roles`
  Define custom user roles and permissions
  - `id` (uuid, primary key)
  - `role_name` (text, unique)
  - `role_description` (text)
  - `permissions` (jsonb)
  - `is_active` (boolean)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. `user_role_assignments`
  Assign roles to users
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to profiles)
  - `role_id` (uuid, foreign key to user_roles)
  - `assigned_by` (uuid, foreign key to profiles)
  - `assigned_at` (timestamptz)
  - `expires_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Add policies for admin-only access
  - Add policies for vendors to view their own KYC and contracts
*/

-- KYC Verifications Table
CREATE TABLE IF NOT EXISTS kyc_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('passport', 'drivers_license', 'national_id', 'business_registration')),
  document_number text NOT NULL,
  document_url text,
  verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  verified_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  verified_at timestamptz,
  rejection_reason text,
  submitted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all KYC verifications"
  ON kyc_verifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Vendors can view own KYC verifications"
  ON kyc_verifications FOR SELECT
  TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "Vendors can insert own KYC verifications"
  ON kyc_verifications FOR INSERT
  TO authenticated
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Admins can update KYC verifications"
  ON kyc_verifications FOR UPDATE
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

-- Vendor Contracts Table
CREATE TABLE IF NOT EXISTS vendor_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  contract_version text NOT NULL,
  terms_accepted boolean DEFAULT false,
  accepted_at timestamptz,
  ip_address text,
  user_agent text,
  contract_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vendor_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all contracts"
  ON vendor_contracts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Vendors can view own contracts"
  ON vendor_contracts FOR SELECT
  TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "System can insert contracts"
  ON vendor_contracts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Vendors can accept own contracts"
  ON vendor_contracts FOR UPDATE
  TO authenticated
  USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());

-- User Roles Table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text UNIQUE NOT NULL,
  role_description text,
  permissions jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage user roles"
  ON user_roles FOR ALL
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

-- User Role Assignments Table
CREATE TABLE IF NOT EXISTS user_role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role_id uuid REFERENCES user_roles(id) ON DELETE CASCADE NOT NULL,
  assigned_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  UNIQUE(user_id, role_id)
);

ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage role assignments"
  ON user_role_assignments FOR ALL
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

CREATE POLICY "Users can view own role assignments"
  ON user_role_assignments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_kyc_vendor_id ON kyc_verifications(vendor_id);
CREATE INDEX IF NOT EXISTS idx_kyc_status ON kyc_verifications(verification_status);
CREATE INDEX IF NOT EXISTS idx_contracts_vendor_id ON vendor_contracts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_role_assignments_user_id ON user_role_assignments(user_id);
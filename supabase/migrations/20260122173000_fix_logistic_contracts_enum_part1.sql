-- Create a new migration to ensure logistic contract types and default entries exist.
-- Fix: Split into two transactions to handle enum creation properly.

-- Transaction 1: Add new enum values
DO $$
BEGIN
    ALTER TYPE contract_type ADD VALUE IF NOT EXISTS 'logistic_terms';
    ALTER TYPE contract_type ADD VALUE IF NOT EXISTS 'logistic_privacy';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

/*
  # Consolidate Site Policies - Step 1: Type Update
  
  This migration adds new enum values for unified policies.
  IMPORTANT: This must be executed and committed BEFORE running the data migration.
*/

-- 1. Add new enum values to contract_type
-- PostgreSQL requires enum additions to be committed before usage in the same session.
ALTER TYPE contract_type ADD VALUE IF NOT EXISTS 'terms_and_conditions';
ALTER TYPE contract_type ADD VALUE IF NOT EXISTS 'privacy_policy';


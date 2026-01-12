-- ==========================================
-- MIGRATION SCRIPT: Add Email to Donors
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Add email column to donors table
ALTER TABLE donors 
ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Verification
SELECT count(*) 
FROM information_schema.columns 
WHERE table_name = 'donors' AND column_name = 'email';

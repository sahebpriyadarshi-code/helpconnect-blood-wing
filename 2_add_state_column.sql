-- ==========================================
-- MIGRATION SCRIPT: Add State Columns
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Add state column to donors table
ALTER TABLE donors 
ADD COLUMN IF NOT EXISTS state TEXT;

-- 2. Add state column to blood_requests table
ALTER TABLE blood_requests 
ADD COLUMN IF NOT EXISTS state TEXT;

-- 3. Update RLS policies if necessary (usually not needed for just adding columns unless specific policy uses them)
-- Current policies allow update/insert based on ID, so new columns should be fine.

-- 4. Verification
SELECT 
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'donors' AND column_name = 'state') as donor_col_exists,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'blood_requests' AND column_name = 'state') as request_col_exists;

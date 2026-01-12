-- ==========================================
-- MIGRATION SCRIPT: Fix RLS & Add 'discarded' Status
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Update Check Constraint for Status
-- We need to drop the existing constraint and add a new one that includes 'discarded'

ALTER TABLE blood_requests DROP CONSTRAINT IF EXISTS blood_requests_status_check;

ALTER TABLE blood_requests 
ADD CONSTRAINT blood_requests_status_check 
CHECK (status IN ('pending', 'searching', 'matched', 'fulfilled', 'cancelled', 'discarded'));

-- 2. Reset & Fix RLS Policies for blood_requests

ALTER TABLE blood_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE blood_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own requests" ON blood_requests;
DROP POLICY IF EXISTS "Anyone can view pending requests" ON blood_requests;
DROP POLICY IF EXISTS "Users can create their own requests" ON blood_requests;
DROP POLICY IF EXISTS "Users can update their own requests" ON blood_requests;

-- Allow users to see their own requests (Crucial for "My Requests" & accessing discarded/cancelled ones)
CREATE POLICY "Users can view their own requests"
ON blood_requests FOR SELECT
USING (auth.uid()::text = donor_id);

-- Allow donors to see OPEN requests (Crucial for Dashboard)
CREATE POLICY "Anyone can view pending requests"
ON blood_requests FOR SELECT
USING (status IN ('pending', 'searching'));

-- Allow creation
CREATE POLICY "Users can create their own requests"
ON blood_requests FOR INSERT
WITH CHECK (auth.uid()::text = donor_id);

-- Allow updates (Cancel, Discard, etc.)
CREATE POLICY "Users can update their own requests"
ON blood_requests FOR UPDATE
USING (auth.uid()::text = donor_id);


-- 3. Reset & Fix RLS Policies for request_responses

ALTER TABLE request_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE request_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own responses" ON request_responses;
DROP POLICY IF EXISTS "Requesters can view responses to their requests" ON request_responses;
DROP POLICY IF EXISTS "Users can create their own responses" ON request_responses;

-- Allow donors to see their own responses
CREATE POLICY "Users can view their own responses"
ON request_responses FOR SELECT
USING (auth.uid()::text = donor_id);

-- Allow requesters to see responses to THEIR requests
CREATE POLICY "Requesters can view responses to their requests"
ON request_responses FOR SELECT
USING (EXISTS (
  SELECT 1 FROM blood_requests 
  WHERE blood_requests.id = request_responses.request_id 
  AND blood_requests.donor_id = auth.uid()::text
));

-- Allow creating responses
CREATE POLICY "Users can create their own responses"
ON request_responses FOR INSERT
WITH CHECK (auth.uid()::text = donor_id);

-- 4. Verification Check
SELECT 'Migration Complete' as status, auth.uid() as current_user;

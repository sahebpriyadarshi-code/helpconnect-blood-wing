-- ==========================================
-- SUPERIOR RLS FIX SCRIPT
-- Run this in Supabase SQL Editor to fix visibility issues
-- ==========================================

-- 1. Reset Policies for blood_requests
ALTER TABLE blood_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE blood_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own requests" ON blood_requests;
DROP POLICY IF EXISTS "Anyone can view pending requests" ON blood_requests;
DROP POLICY IF EXISTS "Users can create their own requests" ON blood_requests;
DROP POLICY IF EXISTS "Users can update their own requests" ON blood_requests;

-- Allow users to see their own requests (Crucial for "My Requests")
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

-- Allow updates (Cancel, etc.)
CREATE POLICY "Users can update their own requests"
ON blood_requests FOR UPDATE
USING (auth.uid()::text = donor_id);


-- 2. Reset Policies for request_responses
ALTER TABLE request_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE request_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own responses" ON request_responses;
DROP POLICY IF EXISTS "Requesters can view responses to their requests" ON request_responses;
DROP POLICY IF EXISTS "Users can create their own responses" ON request_responses;

-- Allow donors to see their own responses (Crucial for "Vanish" logic)
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

-- Allow creating responses (Crucial for "Accept/Decline")
CREATE POLICY "Users can create their own responses"
ON request_responses FOR INSERT
WITH CHECK (auth.uid()::text = donor_id);

-- 3. Verify IDs
-- This is just for your verification, doesn't change data
-- It selects the current user ID to confirm session is active
SELECT auth.uid();

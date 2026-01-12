-- Supabase Database Schema for Blood Request System
-- Run this in your Supabase SQL Editor
-- This script is safe to run multiple times (Idempotent)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. Tables
-- ==========================================

-- Create blood_requests table
CREATE TABLE IF NOT EXISTS blood_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_id TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  blood_type TEXT NOT NULL CHECK (blood_type IN ('O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-')),
  units_needed INTEGER NOT NULL CHECK (units_needed >= 1 AND units_needed <= 10),
  urgency TEXT NOT NULL CHECK (urgency IN ('critical', 'high', 'medium', 'low')),
  hospital_name TEXT NOT NULL,
  hospital_address TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'searching', 'matched', 'fulfilled', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create request_responses table to track donor interest/matches
CREATE TABLE IF NOT EXISTS request_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES blood_requests(id) ON DELETE CASCADE,
  donor_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('accepted', 'declined', 'interested')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create donors table (Profiles)
CREATE TABLE IF NOT EXISTS donors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE,  -- This maps to the auth provider's ID (email)
  name TEXT NOT NULL,
  blood_type TEXT NOT NULL CHECK (blood_type IN ('O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'Unknown')),
  location_city TEXT,
  location_address TEXT,
  location_lat FLOAT,
  location_lng FLOAT,
  contact_phone TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  last_donation_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 2. Indices
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_blood_requests_donor_id ON blood_requests(donor_id);
CREATE INDEX IF NOT EXISTS idx_blood_requests_status ON blood_requests(status);
CREATE INDEX IF NOT EXISTS idx_blood_requests_created_at ON blood_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blood_requests_donor_status ON blood_requests(donor_id, status);

CREATE INDEX IF NOT EXISTS idx_request_responses_request_id ON request_responses(request_id);
CREATE INDEX IF NOT EXISTS idx_request_responses_donor_id ON request_responses(donor_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_response ON request_responses(request_id, donor_id);

CREATE INDEX IF NOT EXISTS idx_donors_user_id ON donors(user_id);
CREATE INDEX IF NOT EXISTS idx_donors_blood_type ON donors(blood_type);
CREATE INDEX IF NOT EXISTS idx_donors_location_city ON donors(location_city);

-- ==========================================
-- 3. Triggers & Functions
-- ==========================================

-- Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Drop first to avoid "relation already exists" error
DROP TRIGGER IF EXISTS update_blood_requests_updated_at ON blood_requests;

CREATE TRIGGER update_blood_requests_updated_at
  BEFORE UPDATE ON blood_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_donors_updated_at ON donors;

CREATE TRIGGER update_donors_updated_at
  BEFORE UPDATE ON donors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 4. Row Level Security (Policies)
-- ==========================================

-- Enable RLS
ALTER TABLE blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;

-- Policies for blood_requests
DROP POLICY IF EXISTS "Users can view their own requests" ON blood_requests;
DROP POLICY IF EXISTS "Anyone can view pending requests" ON blood_requests;
DROP POLICY IF EXISTS "Users can create their own requests" ON blood_requests;
DROP POLICY IF EXISTS "Users can update their own requests" ON blood_requests;

CREATE POLICY "Users can view their own requests"
  ON blood_requests
  FOR SELECT
  USING (auth.uid()::text = donor_id);

CREATE POLICY "Anyone can view pending requests"
  ON blood_requests
  FOR SELECT
  USING (status IN ('pending', 'searching'));

CREATE POLICY "Users can create their own requests"
  ON blood_requests
  FOR INSERT
  WITH CHECK (auth.uid()::text = donor_id);

CREATE POLICY "Users can update their own requests"
  ON blood_requests
  FOR UPDATE
  USING (auth.uid()::text = donor_id);

-- Policies for request_responses
DROP POLICY IF EXISTS "Users can view their own responses" ON request_responses;
DROP POLICY IF EXISTS "Requesters can view responses to their requests" ON request_responses;
DROP POLICY IF EXISTS "Users can create their own responses" ON request_responses;

CREATE POLICY "Users can view their own responses"
  ON request_responses
  FOR SELECT
  USING (auth.uid()::text = donor_id);
  
CREATE POLICY "Requesters can view responses to their requests"
  ON request_responses
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM blood_requests 
    WHERE blood_requests.id = request_responses.request_id 
    AND blood_requests.donor_id = auth.uid()::text
  ));

CREATE POLICY "Users can create their own responses"
  ON request_responses
  FOR INSERT
  WITH CHECK (auth.uid()::text = donor_id);

-- Policies for donors
DROP POLICY IF EXISTS "Public can view donors" ON donors;
DROP POLICY IF EXISTS "Users can update own profile" ON donors;
DROP POLICY IF EXISTS "Users can insert own profile" ON donors;

CREATE POLICY "Public can view donors"
  ON donors
  FOR SELECT
  USING (true); -- Publicly viewable for matching, though we might want to restrict PII later

CREATE POLICY "Users can update own profile"
  ON donors
  FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own profile"
  ON donors
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- ==========================================
-- 5. Realtime
-- ==========================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'blood_requests') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE blood_requests;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'request_responses') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE request_responses;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'donors') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE donors;
  END IF;
END $$;

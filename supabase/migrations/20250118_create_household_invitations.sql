-- Migration: Create household_invitations table
-- Run this SQL in Supabase SQL Editor

CREATE TABLE household_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'expired')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);

ALTER TABLE household_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invitations_select"
ON household_invitations FOR SELECT
USING (
  household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  )
  OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY "invitations_insert"
ON household_invitations FOR INSERT
WITH CHECK (
  household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "invitations_update"
ON household_invitations FOR UPDATE
USING (
  household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  )
  OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Index for faster lookups
CREATE INDEX idx_invitations_token ON household_invitations(token);
CREATE INDEX idx_invitations_email ON household_invitations(email);
CREATE INDEX idx_invitations_household ON household_invitations(household_id);

COMMENT ON TABLE household_invitations IS 'Invitations for users to join households';

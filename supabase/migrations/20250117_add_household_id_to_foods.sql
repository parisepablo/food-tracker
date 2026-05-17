-- Migration: Add household_id to foods table and update RLS policies
-- Run this SQL in Supabase SQL Editor

-- Add household_id column to foods table
ALTER TABLE foods
ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES households(id) ON DELETE CASCADE;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "foods_select_policy" ON foods;
DROP POLICY IF EXISTS "foods_insert_policy" ON foods;
DROP POLICY IF EXISTS "foods_update_policy" ON foods;
DROP POLICY IF EXISTS "foods_delete_policy" ON foods;

-- Enable RLS on foods table (if not already enabled)
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;

-- Create new RLS policies
CREATE POLICY "foods_select"
ON foods FOR SELECT
USING (
  household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "foods_insert"
ON foods FOR INSERT
WITH CHECK (
  household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "foods_update"
ON foods FOR UPDATE
USING (
  household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "foods_delete"
ON foods FOR DELETE
USING (
  household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  )
);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_foods_household_id ON foods(household_id);

-- Add comment
COMMENT ON COLUMN foods.household_id IS 'Household that owns this food item';

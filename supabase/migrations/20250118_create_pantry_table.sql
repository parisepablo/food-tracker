-- Migration: Create pantry table and update shopping_list_items
-- Run this SQL in Supabase SQL Editor

-- Create pantry table
CREATE TABLE pantry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  food_id UUID REFERENCES foods(id) ON DELETE CASCADE,
  quantity_grams NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, food_id)
);

-- RLS policies for pantry
ALTER TABLE pantry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pantry_select"
ON pantry FOR SELECT
USING (
  household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "pantry_insert"
ON pantry FOR INSERT
WITH CHECK (
  household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "pantry_update"
ON pantry FOR UPDATE
USING (
  household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "pantry_delete"
ON pantry FOR DELETE
USING (
  household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  )
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_pantry_household_food ON pantry(household_id, food_id);

-- Add columns to shopping_list_items
ALTER TABLE shopping_list_items
ADD COLUMN IF NOT EXISTS quantity_in_stock_grams NUMERIC DEFAULT 0;

ALTER TABLE shopping_list_items
ADD COLUMN IF NOT EXISTS total_quantity_needed_grams NUMERIC;

-- Add comments
COMMENT ON TABLE pantry IS 'Pantry stock per household';
COMMENT ON COLUMN pantry.quantity_grams IS 'Current stock in grams';
COMMENT ON COLUMN shopping_list_items.quantity_in_stock_grams IS 'Pantry stock at generation time';
COMMENT ON COLUMN shopping_list_items.total_quantity_needed_grams IS 'Full recipe requirement before stock discount';

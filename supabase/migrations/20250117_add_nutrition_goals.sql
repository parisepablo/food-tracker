-- Migration: Add nutrition_goals table
-- Run this SQL in Supabase SQL Editor

CREATE TABLE nutrition_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  calories_goal NUMERIC,
  protein_goal NUMERIC,
  carbs_goal NUMERIC,
  fat_goal NUMERIC,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE nutrition_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view nutrition goals from their household" 
  ON nutrition_goals 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM household_members 
      WHERE household_members.household_id = nutrition_goals.household_id 
      AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert nutrition goals for their household" 
  ON nutrition_goals 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_members 
      WHERE household_members.household_id = nutrition_goals.household_id 
      AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own nutrition goals" 
  ON nutrition_goals 
  FOR UPDATE 
  USING (
    nutrition_goals.user_id = auth.uid()
  );

CREATE POLICY "Users can delete their own nutrition goals" 
  ON nutrition_goals 
  FOR DELETE 
  USING (
    nutrition_goals.user_id = auth.uid()
  );

-- Add unique constraint (one goal per user per household)
CREATE UNIQUE INDEX idx_nutrition_goals_user_household 
  ON nutrition_goals(user_id, household_id);

-- Add comment
COMMENT ON TABLE nutrition_goals IS 'Nutritional goals per user within a household';

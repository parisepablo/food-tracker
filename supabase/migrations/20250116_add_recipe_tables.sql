-- Migration: meal_plan_rules and ingredient_categories tables
-- Run this SQL in Supabase SQL Editor

-- meal_plan_rules table
CREATE TABLE meal_plan_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  rule_type TEXT CHECK (rule_type IN ('protein_frequency', 'variety', 'distribution')),
  rule_config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on meal_plan_rules
ALTER TABLE meal_plan_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meal_plan_rules
CREATE POLICY "Users can view meal plan rules from their household" 
  ON meal_plan_rules 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM household_members 
      WHERE household_members.household_id = meal_plan_rules.household_id 
      AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert meal plan rules for their household" 
  ON meal_plan_rules 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_members 
      WHERE household_members.household_id = meal_plan_rules.household_id 
      AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update meal plan rules from their household" 
  ON meal_plan_rules 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM household_members 
      WHERE household_members.household_id = meal_plan_rules.household_id 
      AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete meal plan rules from their household" 
  ON meal_plan_rules 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM household_members 
      WHERE household_members.household_id = meal_plan_rules.household_id 
      AND household_members.user_id = auth.uid()
    )
  );

-- ingredient_categories table
CREATE TABLE ingredient_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_id UUID REFERENCES foods(id) ON DELETE CASCADE,
  category TEXT CHECK (category IN ('red_meat', 'chicken', 'fish', 'vegetarian', 'pasta', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on ingredient_categories
ALTER TABLE ingredient_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ingredient_categories
-- Since foods table doesn't have household_id directly, we need a different approach
-- We'll allow users to view all categories for foods they can see (all foods are shared)
CREATE POLICY "Users can view all ingredient categories" 
  ON ingredient_categories 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can insert ingredient categories for any food" 
  ON ingredient_categories 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Users can update any ingredient category" 
  ON ingredient_categories 
  FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can delete any ingredient category" 
  ON ingredient_categories 
  FOR DELETE 
  TO authenticated 
  USING (true);

-- Add unique constraint to prevent duplicate categories per food
CREATE UNIQUE INDEX idx_ingredient_categories_food_category 
  ON ingredient_categories(food_id, category);

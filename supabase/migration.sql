-- Supabase SQL Migration for Food Tracker App
-- Run this in your Supabase SQL Editor to set up all tables and RLS policies

-- ============================================
-- TABLES
-- ============================================

-- Households table
CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Household members table
CREATE TABLE IF NOT EXISTS household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(household_id, user_id)
);

-- Foods table (cache from Open Food Facts)
CREATE TABLE IF NOT EXISTS foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT UNIQUE,
  name TEXT NOT NULL,
  brand TEXT,
  calories_per_100g NUMERIC NOT NULL CHECK (calories_per_100g >= 0),
  protein_per_100g NUMERIC NOT NULL CHECK (protein_per_100g >= 0),
  carbs_per_100g NUMERIC NOT NULL CHECK (carbs_per_100g >= 0),
  fat_per_100g NUMERIC NOT NULL CHECK (fat_per_100g >= 0),
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  servings INTEGER NOT NULL CHECK (servings > 0),
  image_url TEXT,
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Recipe ingredients table
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  quantity_grams NUMERIC NOT NULL CHECK (quantity_grams >= 0)
);

-- Meal plans table
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Meal plan entries table
CREATE TABLE IF NOT EXISTS meal_plan_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Shopping lists table
CREATE TABLE IF NOT EXISTS shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Shopping list items table
CREATE TABLE IF NOT EXISTS shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  food_id UUID REFERENCES foods(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity_grams NUMERIC,
  category TEXT,
  is_checked BOOLEAN DEFAULT FALSE,
  is_manual BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_household_members_user_id ON household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_household_members_household_id ON household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_foods_barcode ON foods(barcode);
CREATE INDEX IF NOT EXISTS idx_recipes_household_id ON recipes(household_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_household_id ON meal_plans(household_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_entries_meal_plan_id ON meal_plan_entries(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_entries_date ON meal_plan_entries(date);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_household_id ON shopping_lists(household_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_shopping_list_id ON shopping_list_items(shopping_list_id);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Helper function to get user's household IDs
CREATE OR REPLACE FUNCTION get_user_household_ids(user_uuid UUID)
RETURNS TABLE (household_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT hm.household_id
  FROM household_members hm
  WHERE hm.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Households: Users can only see their own households
CREATE POLICY "Users can view their households" ON households
  FOR SELECT USING (
    id IN (SELECT get_user_household_ids(auth.uid()))
  );

CREATE POLICY "Admins can update their households" ON households
  FOR UPDATE USING (
    id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete their households" ON households
  FOR DELETE USING (
    id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Allow insert during registration (handled by trigger or server)
CREATE POLICY "Allow insert during registration" ON households
  FOR INSERT WITH CHECK (true);

-- Household members: Users can only see members of their households
CREATE POLICY "Users can view household members" ON household_members
  FOR SELECT USING (
    household_id IN (SELECT get_user_household_ids(auth.uid()))
  );

CREATE POLICY "Admins can manage household members" ON household_members
  FOR ALL USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Allow insert during registration
CREATE POLICY "Allow insert during registration" ON household_members
  FOR INSERT WITH CHECK (true);

-- Foods: Everyone can read, only authenticated users can create
CREATE POLICY "Everyone can view foods" ON foods
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create foods" ON foods
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Recipes: Users can only access recipes in their households
CREATE POLICY "Users can view household recipes" ON recipes
  FOR SELECT USING (
    household_id IN (SELECT get_user_household_ids(auth.uid()))
  );

CREATE POLICY "Users can create recipes in their households" ON recipes
  FOR INSERT WITH CHECK (
    household_id IN (SELECT get_user_household_ids(auth.uid()))
  );

CREATE POLICY "Users can update their recipes" ON recipes
  FOR UPDATE USING (
    household_id IN (SELECT get_user_household_ids(auth.uid()))
  );

CREATE POLICY "Users can delete their recipes" ON recipes
  FOR DELETE USING (
    household_id IN (SELECT get_user_household_ids(auth.uid()))
  );

-- Recipe ingredients: Access based on recipe ownership
CREATE POLICY "Users can view recipe ingredients" ON recipe_ingredients
  FOR SELECT USING (
    recipe_id IN (
      SELECT id FROM recipes
      WHERE household_id IN (SELECT get_user_household_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can manage recipe ingredients" ON recipe_ingredients
  FOR ALL USING (
    recipe_id IN (
      SELECT id FROM recipes
      WHERE household_id IN (SELECT get_user_household_ids(auth.uid()))
    )
  );

-- Meal plans: Users can only access meal plans in their households
CREATE POLICY "Users can view household meal plans" ON meal_plans
  FOR SELECT USING (
    household_id IN (SELECT get_user_household_ids(auth.uid()))
  );

CREATE POLICY "Users can manage meal plans" ON meal_plans
  FOR ALL USING (
    household_id IN (SELECT get_user_household_ids(auth.uid()))
  );

-- Meal plan entries: Access based on meal plan ownership
CREATE POLICY "Users can view meal plan entries" ON meal_plan_entries
  FOR SELECT USING (
    meal_plan_id IN (
      SELECT id FROM meal_plans
      WHERE household_id IN (SELECT get_user_household_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can manage meal plan entries" ON meal_plan_entries
  FOR ALL USING (
    meal_plan_id IN (
      SELECT id FROM meal_plans
      WHERE household_id IN (SELECT get_user_household_ids(auth.uid()))
    )
  );

-- Shopping lists: Users can only access shopping lists in their households
CREATE POLICY "Users can view household shopping lists" ON shopping_lists
  FOR SELECT USING (
    household_id IN (SELECT get_user_household_ids(auth.uid()))
  );

CREATE POLICY "Users can manage shopping lists" ON shopping_lists
  FOR ALL USING (
    household_id IN (SELECT get_user_household_ids(auth.uid()))
  );

-- Shopping list items: Access based on shopping list ownership
CREATE POLICY "Users can view shopping list items" ON shopping_list_items
  FOR SELECT USING (
    shopping_list_id IN (
      SELECT id FROM shopping_lists
      WHERE household_id IN (SELECT get_user_household_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can manage shopping list items" ON shopping_list_items
  FOR ALL USING (
    shopping_list_id IN (
      SELECT id FROM shopping_lists
      WHERE household_id IN (SELECT get_user_household_ids(auth.uid()))
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

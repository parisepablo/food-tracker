-- Migration: Add active_meal_types column to households table
-- Run this SQL in Supabase SQL Editor

ALTER TABLE households 
ADD COLUMN active_meal_types TEXT[] 
DEFAULT ARRAY['breakfast', 'lunch', 'dinner', 'snack'];

-- Add comment explaining the column
COMMENT ON COLUMN households.active_meal_types IS 'Array of active meal types for the household. Valid values: breakfast, lunch, dinner, snack';

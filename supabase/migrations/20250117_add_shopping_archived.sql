-- Migration: Add is_archived column to shopping_lists table
-- Run this SQL in Supabase SQL Editor

ALTER TABLE shopping_lists
ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;

-- Add index for faster queries on archived status
CREATE INDEX idx_shopping_lists_is_archived ON shopping_lists(is_archived);

-- Add comment
COMMENT ON COLUMN shopping_lists.is_archived IS 'Whether the shopping list has been completed and archived';

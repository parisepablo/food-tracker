-- Migration: Add video_url to recipes table
-- Run this SQL in Supabase SQL Editor

ALTER TABLE recipes
ADD COLUMN IF NOT EXISTS video_url TEXT;

COMMENT ON COLUMN recipes.video_url IS 'YouTube video URL for the recipe';

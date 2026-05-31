-- Migration: Backfill profiles for existing users
-- Run this SQL in Supabase SQL Editor

DO $$
DECLARE
  u RECORD;
BEGIN
  FOR u IN
    SELECT id, email
    FROM auth.users
    WHERE NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE profiles.id = auth.users.id
    )
  LOOP
    INSERT INTO public.profiles (id, display_name)
    VALUES (u.id, split_part(u.email, '@', 1))
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END;
$$;

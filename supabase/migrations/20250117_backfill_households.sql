-- Migration: Backfill households for existing confirmed users without one
-- Run this SQL in Supabase SQL Editor

DO $$
DECLARE
  u RECORD;
  new_household_id UUID;
BEGIN
  FOR u IN
    SELECT au.id, au.email
    FROM auth.users au
    LEFT JOIN public.household_members hm ON hm.user_id = au.id
    WHERE au.email_confirmed_at IS NOT NULL
    AND hm.id IS NULL
  LOOP
    INSERT INTO public.households (name)
    VALUES (split_part(u.email, '@', 1) || '''s household')
    RETURNING id INTO new_household_id;

    INSERT INTO public.household_members (household_id, user_id, role)
    VALUES (new_household_id, u.id, 'admin');
  END LOOP;
END;
$$;

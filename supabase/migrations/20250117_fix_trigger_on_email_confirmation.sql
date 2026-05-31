-- Migration: Fix trigger to run when user confirms email (not at sign up)
-- Run this SQL in Supabase SQL Editor

-- Drop the old incorrect trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the function that runs when email is confirmed
CREATE OR REPLACE FUNCTION public.handle_new_user_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_household_id UUID;
BEGIN
    -- Only run when email is being confirmed for the first time
    IF (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL) THEN
      -- Ensure profile exists for every confirmed user
      INSERT INTO public.profiles (id, display_name)
      VALUES (NEW.id, split_part(NEW.email, '@', 1))
      ON CONFLICT (id) DO NOTHING;

      -- Check if user has a pending invitation to an existing household
      IF EXISTS (
        SELECT 1 FROM public.household_invitations
        WHERE LOWER(email) = LOWER(NEW.email)
        AND status = 'pending'
        AND expires_at > NOW()
      ) THEN
        RETURN NEW;
      END IF;

      -- Create household
      INSERT INTO public.households (name)
      VALUES (split_part(NEW.email, '@', 1) || '''s household')
      RETURNING id INTO new_household_id;

      -- Add user as admin
      INSERT INTO public.household_members (household_id, user_id, role)
      VALUES (new_household_id, NEW.id, 'admin');
    END IF;

      -- Create household
      INSERT INTO public.households (name)
      VALUES (split_part(NEW.email, '@', 1) || '''s household')
      RETURNING id INTO new_household_id;

      -- Add user as admin
      INSERT INTO public.household_members (household_id, user_id, role)
      VALUES (new_household_id, NEW.id, 'admin');
    END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger on UPDATE (not INSERT)
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_confirmed();

-- Add comment
COMMENT ON FUNCTION public.handle_new_user_confirmed() IS 'Creates a household and assigns user as admin when email is confirmed for the first time';

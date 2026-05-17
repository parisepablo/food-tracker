-- Migration: Create trigger to auto-create household on user confirmation
-- Run this SQL in Supabase SQL Editor

-- Create a function that will be called when a new user is created in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_household_id UUID;
BEGIN
  -- Create a new household for the user
  -- Using 'My Household' as default name
  INSERT INTO public.households (name)
  VALUES ('My Household')
  RETURNING id INTO new_household_id;

  -- Add the user as admin to the household
  INSERT INTO public.household_members (household_id, user_id, role)
  VALUES (new_household_id, NEW.id, 'admin');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users to call the function after insert
-- This only runs when email is confirmed (when user row is fully created)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add comments
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates a household and assigns user as admin when a new user is created';

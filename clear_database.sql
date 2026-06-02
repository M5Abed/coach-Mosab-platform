-- WARNING: This will delete ALL users and profiles from the database!
-- Run this in the SQL Editor of your Supabase Dashboard (https://supabase.com)

-- 1. Truncate the profiles table
TRUNCATE TABLE public.profiles CASCADE;

-- 2. Clear all authentication users
-- Because of the ON DELETE CASCADE constraint, this will also clean up any remaining profile records.
DELETE FROM auth.users;

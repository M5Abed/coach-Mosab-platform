-- Supabase Database Setup Script for Coach Mosab Platform
-- Run this in the SQL Editor of your Supabase Dashboard (https://supabase.com)

-- 1. Create the profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  fitness_level TEXT DEFAULT 'beginner',
  role TEXT DEFAULT 'subscriber',
  subscription_status TEXT DEFAULT 'inactive', -- 'active', 'pending', 'rejected', 'inactive'
  plan_duration TEXT,
  avatar_url TEXT,
  rejection_reason TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies

-- Allow users to read their own profile
DROP POLICY IF EXISTS "Allow users to read their own profile" ON public.profiles;
CREATE POLICY "Allow users to read their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Allow users to update their own profile details
DROP POLICY IF EXISTS "Allow users to insert/update their own profile" ON public.profiles;
CREATE POLICY "Allow users to insert/update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow admins (coaches) to view and manage all client profiles
DROP POLICY IF EXISTS "Allow admins/coaches to manage all profiles" ON public.profiles;
CREATE POLICY "Allow admins/coaches to manage all profiles" 
ON public.profiles 
FOR ALL 
USING (
  (auth.jwt() ->> 'email') = 'admin@coachmosab.com'
);

-- Enable public insertions during sign-up registration
DROP POLICY IF EXISTS "Enable public inserts for signup" ON public.profiles;
CREATE POLICY "Enable public inserts for signup"
ON public.profiles
FOR INSERT
WITH CHECK (true);

-- 5. Automate profile creation on new user signUp (optional but recommended)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, subscription_status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Fitness Member'),
    CASE WHEN new.email = 'admin@coachmosab.com' THEN 'admin' ELSE 'subscriber' END,
    'inactive'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

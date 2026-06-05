-- Supabase Database Setup Script for Coach Mosab Platform
-- Run this in the SQL Editor of your Supabase Dashboard (https://supabase.com)

-- Clean up all existing tables if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.plans CASCADE;
DROP TABLE IF EXISTS public.food_alternatives CASCADE;

-- 1. Create Profiles Table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  fitness_level TEXT DEFAULT 'beginner',
  role TEXT DEFAULT 'subscriber',
  subscription_status TEXT DEFAULT 'inactive', -- 'active', 'pending', 'rejected', 'inactive'
  plan_duration TEXT,
  avatar_url TEXT,
  rejection_reason TEXT,
  workout_plan JSONB,
  nutrition_plan JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Plans Table
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('workout', 'nutrition')),
  description TEXT,
  plan_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. Create Food Alternatives Table
CREATE TABLE public.food_alternatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  original_food TEXT NOT NULL,
  alternatives TEXT[] DEFAULT '{}'::text[],
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_alternatives ENABLE ROW LEVEL SECURITY;

-- 5. Helper function to check if the current user is an admin recursion-free
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql;

-- 6. Profiles Policies
CREATE POLICY "Allow select for self or admin" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Allow update for self or admin" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "Allow delete for admin" ON public.profiles
  FOR DELETE USING (public.is_admin());

CREATE POLICY "Allow inserts for signup" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- 7. Plans Policies
CREATE POLICY "Allow select for all authenticated" ON public.plans
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all actions for admin" ON public.plans
  FOR ALL USING (public.is_admin());

-- 8. Food Alternatives Policies
CREATE POLICY "Allow select for all authenticated" ON public.food_alternatives
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all actions for admin" ON public.food_alternatives
  FOR ALL USING (public.is_admin());

-- 9. Trigger to automate profile creation on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, subscription_status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Fitness Member'),
    'subscriber',
    'inactive'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Create Videos Table
CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  youtube_id TEXT NOT NULL,
  category TEXT NOT NULL,
  views INTEGER DEFAULT 0 NOT NULL,
  active BOOLEAN DEFAULT true NOT NULL,
  scheduled DATE,
  duration TEXT DEFAULT '10:00' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select for all authenticated" ON public.videos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all actions for admin" ON public.videos
  FOR ALL USING (public.is_admin());

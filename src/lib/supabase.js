import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aykiykjhuamibjyfypeo.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5a2l5a2podWFtaWJqeWZ5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMzg1MzEsImV4cCI6MjA5NTkxNDUzMX0.bX1WQxXupL1txgOg-VIznPCjLfdLiI-9a1zTBExWnig'

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Supabase URL or Anon Key is missing in environment variables. Using hardcoded fallback.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

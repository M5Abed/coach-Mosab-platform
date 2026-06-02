import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set, get) => ({
  user: null, // User profile data
  session: null,
  loading: false,
  initialized: false,
  error: null,

  initAuth: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await get().setSession(session, true)
      } else {
        set({ initialized: true, loading: false })
      }
    } catch (err) {
      console.error('Error initializing authentication:', err)
      set({ initialized: true, loading: false })
    }

    // Set up auth state change listener — skip if same user already loaded
    supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUserId = get().user?.id
      const newUserId = session?.user?.id
      // Avoid re-fetching profile and causing blank screen if user hasn't changed
      if (get().initialized && currentUserId && currentUserId === newUserId) return
      await get().setSession(session, false)
    })
  },

  setSession: async (session, isInitialLoad = false) => {
    if (!session) {
      set({ session: null, user: null, initialized: true, loading: false })
      return
    }

    // Only show loading spinner on initial app load — not on re-auth events
    if (isInitialLoad) {
      set({ session, loading: true })
    } else {
      set({ session })
    }
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) {
        console.warn('Error fetching user profile from database, using auth metadata:', error)
        // Fallback to auth metadata if database profile doesn't exist yet
        set({
          user: {
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || 'Fitness Member',
            role: session.user.email === 'admin@coachmosab.com' ? 'admin' : 'subscriber',
            subscription_status: 'inactive'
          },
          initialized: true,
          loading: false
        })
      } else {
        set({ user: profile, initialized: true, loading: false })
      }
    } catch (err) {
      console.error('Session sync error:', err)
      set({ initialized: true, loading: false })
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null })

    // Try real Supabase auth for all accounts
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      set({ error: error.message, loading: false })
      throw error
    }

    if (data.session) {
      // Real login succeeded — fetch real profile
      await get().setSession(data.session, true)

      // Override role/status locally if this is a known admin email
      if (email === 'admin@coachmosab.com' || email === 'mohamed.abed6655@gmail.com') {
        set(state => ({
          user: state.user
            ? { ...state.user, role: 'admin', subscription_status: 'active' }
            : state.user
        }))
      }
      return data
    }
  },

  register: async (email, password, fullName, phone, level = 'beginner') => {
    set({ loading: true, error: null })
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
        }
      }
    })

    if (error) {
      set({ error: error.message, loading: false })
      throw error
    }

    if (data.user) {
      const profileData = {
        id: data.user.id,
        email,
        full_name: fullName,
        phone,
        fitness_level: level,
        role: 'subscriber',
        subscription_status: 'inactive',
      }

      // Upsert profile in Supabase db
      try {
        await supabase.from('profiles').upsert(profileData)
      } catch (dbErr) {
        console.error('Error saving profile record in DB:', dbErr)
      }

      if (data.session) {
        // Directly set both session and local profile — no need to re-fetch from DB
        // since we just upserted it. This avoids the onAuthStateChange race condition.
        set({ session: data.session, user: profileData, initialized: true, loading: false })
      } else {
        // Email confirmation required — store a temporary session from auth metadata
        const mockSession = {
          user: { id: data.user.id, email, user_metadata: { full_name: fullName } }
        }
        set({ session: mockSession, user: profileData, initialized: true, loading: false })
      }
    } else {
      set({ loading: false })
    }

    return data
  },

  logout: async () => {
    set({ loading: true })
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('Sign out call failed:', err)
    }
    set({ session: null, user: null, loading: false })
  },

  updateProfile: async (updates) => {
    const { user } = get()
    if (!user) return

    set({ loading: true })
    
    // If it's a mock session, update local store only
    if (user.id.startsWith('admin-id') || user.id.startsWith('user-id')) {
      set({ user: { ...user, ...updates }, loading: false })
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (error) {
      set({ error: error.message, loading: false })
      throw error
    }

    set({ user: { ...user, ...updates }, loading: false })
  }
}))

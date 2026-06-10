import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from './supabase'

export type UserRole = 'dispatcher' | 'volunteer'
export type UserStatus = 'active' | 'suspended'

interface AuthContextType {
  session: Session | null
  user: User | null
  role: UserRole | null
  status: UserStatus | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  status: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [status, setStatus] = useState<UserStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', userId)
        .single()

      if (error) {
        // Profile row may not exist yet immediately after signup, or RLS/network
        // failed. Default to volunteer/active so the user isn't hard-locked out.
        console.warn('[auth] Could not load profile, defaulting to volunteer:', error.message)
        setRole('volunteer')
        setStatus('active')
        return
      }

      setRole((data?.role as UserRole) ?? 'volunteer')
      setStatus((data?.status as UserStatus) ?? 'active')
    } catch (err) {
      console.warn('[auth] fetchProfile failed:', err)
      setRole('volunteer')
      setStatus('active')
    }
  }, [])

  const applySession = useCallback(
    async (nextSession: Session | null) => {
      setSession(nextSession)
      setUser(nextSession?.user ?? null)

      if (nextSession?.user) {
        await fetchProfile(nextSession.user.id)
      } else {
        setRole(null)
        setStatus(null)
      }
      setLoading(false)
    },
    [fetchProfile]
  )

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => applySession(data.session))
      .catch(() => setLoading(false))

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession)
    })

    return () => subscription.unsubscribe()
  }, [applySession])

  // Re-fetch profile periodically and listen for suspension/role changes via Realtime
  useEffect(() => {
    if (!user || !isSupabaseConfigured) return

    const profileChannel = supabase
      .channel(`profile-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const next = payload.new as { role?: UserRole; status?: UserStatus }
          if (next.role) setRole(next.role)
          if (next.status) setStatus(next.status)
        }
      )
      .subscribe()

    const interval = setInterval(() => {
      fetchProfile(user.id)
    }, 30_000)

    return () => {
      supabase.removeChannel(profileChannel)
      clearInterval(interval)
    }
  }, [user, fetchProfile])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
    setRole(null)
    setStatus(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id)
  }, [user, fetchProfile])

  return (
    <AuthContext.Provider
      value={{ session, user, role, status, loading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

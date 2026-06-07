import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, Lock, ShieldAlert, Loader2, Info } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface LocationState {
  from?: { pathname?: string }
  suspended?: boolean
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as LocationState) || {}

  /** Resolve where to go after a successful sign-in based on role. */
  async function redirectByRole(userId: string) {
    let role: string = 'volunteer'
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', userId)
        .single()
      if (data?.status === 'suspended') {
        await supabase.auth.signOut()
        setError('Your volunteer account has been suspended. Contact a dispatcher.')
        return
      }
      if (data?.role) role = data.role
    } catch {
      // Default to volunteer home if the profile lookup fails.
    }

    const fallback = role === 'dispatcher' ? '/dispatcher' : '/volunteer'
    const dest = state.from?.pathname || fallback
    navigate(dest, { replace: true })
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSupabaseConfigured) {
      setError('Authentication is not configured. Set the Supabase environment variables.')
      return
    }
    setLoading(true)
    setError(null)
    setNotice(null)

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        if (data.user) await redirectByRole(data.user.id)
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        // Email confirmation off → session present → straight into the app.
        if (data.session && data.user) {
          await redirectByRole(data.user.id)
        } else {
          setNotice(
            'Account created. If email confirmation is enabled, check your inbox before signing in.'
          )
          setIsLogin(true)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during authentication.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40vw] h-[40vw] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Home
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
            <ShieldAlert size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isLogin ? 'Sign In' : 'Volunteer Registration'}
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            {isLogin
              ? 'Dispatchers and volunteers, access your tools to help resolve crises.'
              : 'Join the response network to help search for missing persons.'}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          {state.suspended && (
            <div className="mb-4 p-3 text-sm text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2">
              <Info size={16} className="mt-0.5 flex-shrink-0" />
              Your account is suspended. Please contact a dispatcher.
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                {error}
              </div>
            )}
            {notice && (
              <div className="p-3 text-sm text-primary bg-primary/10 border border-primary/20 rounded-lg">
                {notice}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2',
                loading
                  ? 'bg-primary/70 text-primary-foreground cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md'
              )}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {isLogin ? 'Sign In' : 'Create Volunteer Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">
              {isLogin ? 'Want to volunteer? ' : 'Already have an account? '}
            </span>
            <button
              onClick={() => {
                setIsLogin(!isLogin)
                setError(null)
                setNotice(null)
              }}
              className="text-primary hover:underline font-medium"
            >
              {isLogin ? 'Register' : 'Sign In'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Dispatcher accounts are provisioned by an administrator.
        </p>
      </motion.div>
    </div>
  )
}

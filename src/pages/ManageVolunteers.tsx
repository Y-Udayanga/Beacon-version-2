import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Users,
  ShieldCheck,
  Ban,
  RotateCcw,
  Mail,
  Loader2,
  Search,
} from 'lucide-react'
import { type Volunteer } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { cn, timeAgo } from '@/lib/utils'

export default function ManageVolunteers() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const load = useCallback(async () => {
    try {
      // Query directly with the dispatcher's session so RLS (is_dispatcher())
      // authorizes reading every volunteer profile — no service-role key needed.
      const { data, error } = await supabase
        .from('profiles')
        .select('id, created_at, email, role, status')
        .eq('role', 'volunteer')
        .order('created_at', { ascending: false })
      if (error) throw error
      setVolunteers((data as Volunteer[]) ?? [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load volunteers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function toggleStatus(v: Volunteer) {
    const nextStatus = v.status === 'active' ? 'suspended' : 'active'
    setUpdatingId(v.id)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: nextStatus })
        .eq('id', v.id)
      if (error) throw error
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  const filtered = volunteers.filter((v) =>
    !query || (v.email || '').toLowerCase().includes(query.toLowerCase())
  )

  const activeCount = volunteers.filter((v) => v.status === 'active').length

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/dispatcher"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={16} />
              Back
            </Link>
            <div className="w-px h-5 bg-border" />
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold text-foreground tracking-tight">Manage Volunteers</h1>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by email..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="px-3 py-1.5 rounded-lg bg-muted border border-border">
              {activeCount} active / {volunteers.length} total
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p>No volunteers found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filtered.map((v) => (
                <motion.div
                  key={v.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-4 bg-card border border-border rounded-xl px-4 py-3"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary flex-shrink-0">
                    <Mail size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {v.email || 'Unknown email'}
                    </p>
                    <p className="text-xs text-muted-foreground">Joined {timeAgo(v.created_at)}</p>
                  </div>
                  <span
                    className={cn(
                      'px-2.5 py-1 rounded-full text-[11px] font-medium border capitalize',
                      v.status === 'active'
                        ? 'bg-green-500/15 text-green-400 border-green-500/30'
                        : 'bg-destructive/15 text-destructive border-destructive/30'
                    )}
                  >
                    {v.status}
                  </span>
                  <button
                    onClick={() => toggleStatus(v)}
                    disabled={updatingId === v.id}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50',
                      v.status === 'active'
                        ? 'bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20'
                        : 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20'
                    )}
                  >
                    {updatingId === v.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : v.status === 'active' ? (
                      <Ban size={14} />
                    ) : (
                      <RotateCcw size={14} />
                    )}
                    {v.status === 'active' ? 'Suspend' : 'Reactivate'}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-6 flex items-center gap-1.5">
          <ShieldCheck size={12} />
          Suspended volunteers are blocked from signing in until reactivated.
        </p>
      </main>
    </div>
  )
}

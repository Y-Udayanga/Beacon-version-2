import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Search,
  UserSearch,
  MapPin,
  Clock,
  Check,
  CircleSlash,
  RotateCcw,
  Plus,
  LogIn,
} from 'lucide-react'
import { useMissingPersons } from '@/hooks/useMissingPersons'
import { useAuth } from '@/lib/AuthContext'
import { api, type MissingPerson } from '@/lib/api'
import { cn, timeAgo } from '@/lib/utils'

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'found', label: 'Found' },
  { value: 'closed', label: 'Closed' },
]

const statusStyles: Record<string, string> = {
  active: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  found: 'bg-green-500/15 text-green-400 border-green-500/30',
  closed: 'bg-muted text-muted-foreground border-border',
}

function MissingPersonCard({
  person,
  canManage,
  onStatusChange,
  updating,
}: {
  person: MissingPerson
  canManage: boolean
  onStatusChange: (id: string, status: string) => void
  updating: boolean
}) {
  const tags = person.extracted_tags
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col"
    >
      <div className="relative h-44 bg-muted">
        {person.image_url ? (
          <img src={person.image_url} alt={person.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <UserSearch className="w-10 h-10" />
          </div>
        )}
        <span
          className={cn(
            'absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-medium border capitalize',
            statusStyles[person.status] || statusStyles.closed
          )}
        >
          {person.status}
        </span>
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="font-semibold text-foreground">{person.name || 'Unknown'}</h3>
          <p className="text-sm text-muted-foreground">
            {[person.estimated_age, person.gender].filter(Boolean).join(' · ') || 'No details'}
          </p>
        </div>

        {person.last_seen_location && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            {person.last_seen_location}
          </p>
        )}

        {(tags?.clothing?.length || tags?.distinguishing_features?.length) ? (
          <div className="flex flex-wrap gap-1.5">
            {tags.clothing?.slice(0, 3).map((c, i) => (
              <span key={`c-${i}`} className="px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-400 text-[11px]">
                {c.color} {c.type}
              </span>
            ))}
            {tags.distinguishing_features?.slice(0, 2).map((f, i) => (
              <span key={`f-${i}`} className="px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 text-[11px]">
                {f}
              </span>
            ))}
          </div>
        ) : null}

        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-auto">
          <Clock className="w-3 h-3" />
          Reported {timeAgo(person.created_at)}
        </p>

        {canManage && (
          <div className="flex gap-2 pt-1 border-t border-border/50 mt-1">
            {person.status === 'active' && (
              <>
                <button
                  onClick={() => onStatusChange(person.id, 'found')}
                  disabled={updating}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" /> Found
                </button>
                <button
                  onClick={() => onStatusChange(person.id, 'closed')}
                  disabled={updating}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium bg-muted text-muted-foreground border border-border hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  <CircleSlash className="w-3.5 h-3.5" /> Close
                </button>
              </>
            )}
            {person.status === 'found' && (
              <>
                <button
                  onClick={() => onStatusChange(person.id, 'closed')}
                  disabled={updating}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium bg-muted text-muted-foreground border border-border hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  <CircleSlash className="w-3.5 h-3.5" /> Close
                </button>
                <button
                  onClick={() => onStatusChange(person.id, 'active')}
                  disabled={updating}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reopen
                </button>
              </>
            )}
            {person.status === 'closed' && (
              <button
                onClick={() => onStatusChange(person.id, 'active')}
                disabled={updating}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reopen
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function MissingPersonsDashboard() {
  const { missingPersons, loading, error, refetch } = useMissingPersons()
  const { user, role } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const canManage = Boolean(user && (role === 'volunteer' || role === 'dispatcher'))
  const backTo = role === 'dispatcher' ? '/dispatcher' : role === 'volunteer' ? '/volunteer' : '/'

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return missingPersons.filter((p) => {
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter
      const matchesSearch =
        !q ||
        (p.name || '').toLowerCase().includes(q) ||
        (p.last_seen_location || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })
  }, [missingPersons, searchQuery, statusFilter])

  async function handleStatusChange(id: string, status: string) {
    setUpdatingId(id)
    try {
      await api.updateMissingPerson(id, { status })
      await refetch()
    } catch {
      // surfaced via polling/error state
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to={backTo} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <UserSearch className="w-5 h-5 text-amber-500" />
            <h1 className="text-lg font-semibold text-foreground">Missing Persons</h1>
          </div>
          <Link
            to="/missing"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm hover:bg-amber-500/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Report
          </Link>
          {!user && (
            <Link
              to="/login"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm hover:bg-primary/20 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Log in to help
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, location, description..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex bg-muted rounded-lg p-1 border border-border">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  statusFilter === f.value
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <UserSearch className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p>No missing persons match your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((person) => (
                <MissingPersonCard
                  key={person.id}
                  person={person}
                  canManage={canManage}
                  updating={updatingId === person.id}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  )
}

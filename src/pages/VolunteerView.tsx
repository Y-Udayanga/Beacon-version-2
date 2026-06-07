import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Radio,
  UserSearch,
  LogOut,
  ShieldAlert,
  X,
  MapPin,
  ExternalLink,
  Eye,
} from 'lucide-react'
import { useEmergencies } from '@/hooks/useEmergencies'
import { useAuth } from '@/lib/AuthContext'
import type { Emergency } from '@/lib/api'
import { cn, severityColor, severityLabel, timeAgo, googleMapsUrl } from '@/lib/utils'
import MapView from '@/components/dispatcher/MapView'
import StatsBar from '@/components/dispatcher/StatsBar'

function ReadOnlyDetail({ emergency, onClose }: { emergency: Emergency; onClose: () => void }) {
  const threat = emergency.threat_assessment as Record<string, unknown> | null
  const threats = threat && Array.isArray(threat.threats_detected) ? (threat.threats_detected as string[]) : []

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-border z-50 overflow-y-auto shadow-2xl"
    >
      <div className="p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold text-white',
                severityColor(emergency.severity)
              )}
            >
              {emergency.severity}
            </span>
            <div>
              <p className="text-lg font-semibold text-foreground">
                {severityLabel(emergency.severity)} Severity
              </p>
              <p className="text-sm text-muted-foreground capitalize">
                {emergency.category?.replace('_', ' ')} · {emergency.status}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          <Eye size={14} />
          Read-only view. Dispatchers coordinate the response.
        </div>

        {emergency.image_url && (
          <div className="rounded-lg overflow-hidden border border-border">
            <img src={emergency.image_url} alt="Scene" className="w-full h-44 object-cover" />
          </div>
        )}

        {emergency.description && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Description
            </h3>
            <p className="text-sm text-foreground/90 leading-relaxed">{emergency.description}</p>
          </div>
        )}

        {threats.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Threats
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {threats.map((t, i) => (
                <span
                  key={i}
                  className="px-2 py-1 rounded text-[11px] bg-destructive/15 text-destructive border border-destructive/20"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Location
          </h3>
          <p className="text-muted-foreground font-mono text-xs mb-2">
            {emergency.location_lat?.toFixed(6)}, {emergency.location_lng?.toFixed(6)}
          </p>
          {googleMapsUrl(emergency.location_lat, emergency.location_lng) && (
            <a
              href={googleMapsUrl(emergency.location_lat, emergency.location_lng)!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary/15 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/25 transition-colors"
            >
              <MapPin size={14} />
              View on Google Maps
              <ExternalLink size={12} className="opacity-60" />
            </a>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground">Reported {timeAgo(emergency.created_at)}</p>
      </div>
    </motion.div>
  )
}

export default function VolunteerView() {
  const { emergencies, loading } = useEmergencies()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Emergency | null>(null)

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex-shrink-0 border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground tracking-tight">
              Crisis Copilot{' '}
              <span className="text-muted-foreground font-normal">&mdash; Volunteer</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-500/30 text-[11px] font-medium">
              Volunteer
            </span>
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
              <Radio size={14} />
              Live
            </div>
            <Link
              to="/missing-dashboard"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm hover:bg-amber-500/20 transition-colors"
            >
              <UserSearch size={14} />
              Missing Persons
            </Link>
            {user && (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted border border-border text-muted-foreground text-sm hover:text-foreground transition-colors"
              >
                <LogOut size={14} />
                Sign out
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-shrink-0 px-6 py-4 border-b border-border/50">
        <StatsBar emergencies={emergencies} />
      </div>

      <div className="px-6 py-3 border-b border-border/30">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Eye size={12} />
          Read-only incident map for situational awareness. Tap a marker for details.
        </p>
      </div>

      <main className="flex-1 overflow-hidden px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
            />
          </div>
        ) : (
          <MapView emergencies={emergencies} onCardClick={setSelected} />
        )}
      </main>

      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <ReadOnlyDetail emergency={selected} onClose={() => setSelected(null)} />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

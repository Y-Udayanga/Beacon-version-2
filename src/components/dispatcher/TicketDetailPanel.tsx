import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  X,
  Flame,
  Heart,
  Shield,
  CloudLightning,
  AlertTriangle,
  Phone,
  Globe,
  MapPin,
  Siren,
  ShieldCheck,
  Truck,
  LifeBuoy,
  ExternalLink,
} from 'lucide-react'
import type { Emergency } from '@/lib/api'
import { api } from '@/lib/api'
import { cn, severityColor, severityLabel, timeAgo, googleMapsUrl } from '@/lib/utils'

interface TicketDetailPanelProps {
  emergency: Emergency
  onClose: () => void
  onUpdate: () => void
}

const categoryIcons: Record<string, React.ReactNode> = {
  fire: <Flame size={18} />,
  medical: <Heart size={18} />,
  crime: <Shield size={18} />,
  natural_disaster: <CloudLightning size={18} />,
  other: <AlertTriangle size={18} />,
}

const dispatchUnits = [
  { type: 'police', label: 'Police', icon: <ShieldCheck size={16} /> },
  { type: 'fire', label: 'Fire', icon: <Flame size={16} /> },
  { type: 'ambulance', label: 'Ambulance', icon: <Siren size={16} /> },
  { type: 'search_rescue', label: 'Search & Rescue', icon: <LifeBuoy size={16} /> },
]

const unitLabels: Record<string, string> = Object.fromEntries(
  dispatchUnits.map(u => [u.type, u.label])
)

const statusOptions = [
  { value: 'triaging', label: 'Triaging', color: 'bg-status-triaging' },
  { value: 'dispatched', label: 'Dispatched', color: 'bg-status-dispatched' },
  { value: 'resolved', label: 'Resolved', color: 'bg-status-resolved' },
]

export default function TicketDetailPanel({
  emergency,
  onClose,
  onUpdate,
}: TicketDetailPanelProps) {
  const [dispatching, setDispatching] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const icon = categoryIcons[emergency.category] || categoryIcons.other

  const deployedUnits = emergency.dispatched_units ?? []

  const threat = emergency.threat_assessment as Record<string, unknown> | null

  const recommendedActions: string[] = (() => {
    if (threat && Array.isArray(threat.recommended_actions)) {
      return threat.recommended_actions as string[]
    }
    return []
  })()

  const threatsDetected: string[] = (() => {
    if (threat && Array.isArray(threat.threats_detected)) {
      return threat.threats_detected as string[]
    }
    return []
  })()

  async function handleDispatch(unitType: string) {
    setDispatching(unitType)
    try {
      await api.dispatch(emergency.id, unitType)
      onUpdate()
    } catch {
      // silently handle
    } finally {
      setDispatching(null)
    }
  }

  async function handleStatusChange(status: string) {
    setUpdatingStatus(true)
    try {
      await api.updateEmergency(emergency.id, { status } as Partial<Emergency>)
      onUpdate()
    } catch {
      // silently handle
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed top-0 right-0 h-full w-full max-w-lg bg-card border-l border-border z-50 overflow-y-auto shadow-2xl"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
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
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground capitalize">
                {icon}
                {emergency.category?.replace('_', ' ')}
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

        {/* Status + Time */}
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium text-white capitalize',
              emergency.status === 'new' && 'bg-status-new',
              emergency.status === 'triaging' && 'bg-status-triaging text-black',
              emergency.status === 'dispatched' && 'bg-status-dispatched',
              emergency.status === 'resolved' && 'bg-status-resolved'
            )}
          >
            {emergency.status}
          </span>
          <span className="text-xs text-muted-foreground">
            Reported {timeAgo(emergency.created_at)}
          </span>
          <span className="text-[10px] text-muted-foreground/60 font-mono">
            {emergency.id.slice(0, 8)}
          </span>
        </div>

        {/* Image */}
        {emergency.image_url && (
          <div className="rounded-lg overflow-hidden border border-border">
            <img
              src={emergency.image_url}
              alt="Emergency scene"
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        {/* Description */}
        {emergency.description && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Description
            </h3>
            <p className="text-sm text-foreground/90 leading-relaxed">
              {emergency.description}
            </p>
          </div>
        )}

        {/* Translated Text */}
        {emergency.translated_text && (
          <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
            <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
              Translated Text
            </h3>
            <p className="text-sm text-blue-100/90 leading-relaxed">
              {emergency.translated_text}
            </p>
          </div>
        )}

        {/* Threat Assessment */}
        {threatsDetected.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Threat Assessment
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {threatsDetected.map((t, i) => (
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

        {/* First Aid Instructions */}
        {emergency.first_aid_instructions && (
          <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
            <h3 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2">
              First Aid Instructions
            </h3>
            <p className="text-sm text-green-100/90 leading-relaxed whitespace-pre-line">
              {emergency.first_aid_instructions}
            </p>
          </div>
        )}

        {/* AI Recommended Actions */}
        {recommendedActions.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              AI Recommended Actions
            </h3>
            <ul className="space-y-1.5">
              {recommendedActions.map((action, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  {action}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Dispatch Controls */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Dispatch Units
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {dispatchUnits.map(unit => (
              <button
                key={unit.type}
                onClick={() => handleDispatch(unit.type)}
                disabled={dispatching !== null}
                className={cn(
                  'flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium',
                  'bg-muted hover:bg-primary/20 hover:text-primary',
                  'border border-border hover:border-primary/40',
                  'transition-all duration-200',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  dispatching === unit.type && 'bg-primary/20 text-primary border-primary/40'
                )}
              >
                {dispatching === unit.type ? (
                  <Truck size={16} className="animate-pulse" />
                ) : (
                  unit.icon
                )}
                {dispatching === unit.type ? 'Sending...' : unit.label}
              </button>
            ))}
          </div>
        </div>

        {/* Deployed Units */}
        {deployedUnits.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Deployed Units
            </h3>
            <ul className="space-y-2">
              {deployedUnits.map(unit => (
                <li
                  key={unit.id}
                  className="flex items-center gap-3 rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-2.5"
                >
                  <Truck size={16} className="text-blue-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground capitalize">
                      {unitLabels[unit.unit_type] || unit.unit_type.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {(unit.status || 'dispatched').replace('_', ' ')}
                    </p>
                  </div>
                  {unit.eta_minutes != null && (
                    <span className="text-xs font-medium text-blue-400 whitespace-nowrap">
                      ETA {unit.eta_minutes} min
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Status Update */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Update Status
          </h3>
          <div className="flex gap-2">
            {statusOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleStatusChange(opt.value)}
                disabled={updatingStatus || emergency.status === opt.value}
                className={cn(
                  'flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200',
                  'border disabled:opacity-40 disabled:cursor-not-allowed',
                  emergency.status === opt.value
                    ? cn(opt.color, 'text-white border-transparent')
                    : 'bg-muted border-border hover:border-primary/40 text-foreground/70 hover:text-foreground'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Location — clickable Google Maps */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Location
          </h3>
          <div className="rounded-lg bg-muted border border-border p-4">
            <div className="flex items-start gap-2 mb-3">
              <MapPin size={16} className="text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                {emergency.location_address && (
                  <p className="text-foreground/90 mb-1">{emergency.location_address}</p>
                )}
                <p className="text-muted-foreground font-mono text-xs">
                  {emergency.location_lat?.toFixed(6)}, {emergency.location_lng?.toFixed(6)}
                </p>
              </div>
            </div>
            {googleMapsUrl(emergency.location_lat, emergency.location_lng) && (
              <a
                href={googleMapsUrl(emergency.location_lat, emergency.location_lng)!}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg',
                  'bg-primary/15 border border-primary/30',
                  'text-primary text-sm font-medium',
                  'hover:bg-primary/25 transition-colors group'
                )}
              >
                <MapPin size={14} />
                View on Google Maps
                <ExternalLink size={12} className="opacity-60 group-hover:opacity-100 transition-opacity" />
              </a>
            )}
          </div>
        </div>

        {/* Reporter Info */}
        {(emergency.reporter_phone || emergency.reporter_language) && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Reporter
            </h3>
            <div className="space-y-2">
              {emergency.reporter_phone && (
                <div className="flex items-center gap-2 text-sm text-foreground/80">
                  <Phone size={14} className="text-muted-foreground" />
                  {emergency.reporter_phone}
                </div>
              )}
              {emergency.reporter_language && (
                <div className="flex items-center gap-2 text-sm text-foreground/80">
                  <Globe size={14} className="text-muted-foreground" />
                  <span className="capitalize">{emergency.reporter_language}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

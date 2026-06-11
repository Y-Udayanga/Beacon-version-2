import { motion } from 'framer-motion'
import {
  Flame,
  Heart,
  Shield,
  CloudLightning,
  AlertTriangle,
  MapPin,
} from 'lucide-react'
import type { Emergency } from '@/lib/api'
import { cn, severityColor, timeAgo } from '@/lib/utils'
import SLATimer from './SLATimer'

interface TicketCardProps {
  emergency: Emergency
  onClick: () => void
}

const categoryIcons: Record<string, React.ReactNode> = {
  fire: <Flame size={14} />,
  medical: <Heart size={14} />,
  crime: <Shield size={14} />,
  natural_disaster: <CloudLightning size={14} />,
  other: <AlertTriangle size={14} />,
}

export default function TicketCard({ emergency, onClick }: TicketCardProps) {
  const icon = categoryIcons[emergency.category] || categoryIcons.other

  const address = emergency.location_address
    ? emergency.location_address.length > 40
      ? emergency.location_address.slice(0, 40) + '...'
      : emergency.location_address
    : `${emergency.location_lat?.toFixed(4)}, ${emergency.location_lng?.toFixed(4)}`

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={cn(
        'glass rounded-lg p-3 cursor-pointer',
        'border border-border/50 hover:border-primary/40',
        'transition-shadow duration-200 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold text-white',
              severityColor(emergency.severity)
            )}
          >
            {emergency.severity}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground capitalize">
            {icon}
            {emergency.category?.replace('_', ' ')}
          </span>
        </div>
        {emergency.status === 'new' || emergency.status === 'triaging' ? (
          <SLATimer createdAt={emergency.created_at} status={emergency.status} />
        ) : (
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {timeAgo(emergency.created_at)}
          </span>
        )}
      </div>

      {emergency.description && (
        <p className="text-xs text-foreground/80 line-clamp-2 mb-2 leading-relaxed">
          {emergency.description}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground truncate">
          <MapPin size={10} className="flex-shrink-0" />
          {address}
        </span>
        {emergency.image_url && (
          <img
            src={emergency.image_url}
            alt="Scene"
            className="w-12 h-12 rounded object-cover flex-shrink-0 border border-border/50"
          />
        )}
      </div>
    </motion.div>
  )
}

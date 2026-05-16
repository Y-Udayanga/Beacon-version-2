import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Truck,
  CheckCircle2,
  Clock,
  Flame,
  Heart,
  Shield,
  CloudLightning,
} from 'lucide-react'
import type { Emergency } from '@/lib/api'
import { cn, timeAgo, severityColor } from '@/lib/utils'

interface ActivityFeedProps {
  emergencies: Emergency[]
}

const categoryIcons: Record<string, React.ReactNode> = {
  fire: <Flame size={12} />,
  medical: <Heart size={12} />,
  crime: <Shield size={12} />,
  natural_disaster: <CloudLightning size={12} />,
  other: <AlertTriangle size={12} />,
}

const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  new: {
    icon: <AlertTriangle size={14} />,
    label: 'New Emergency',
    color: 'text-red-400',
  },
  triaging: {
    icon: <Clock size={14} />,
    label: 'Under Triage',
    color: 'text-yellow-400',
  },
  dispatched: {
    icon: <Truck size={14} />,
    label: 'Units Dispatched',
    color: 'text-blue-400',
  },
  resolved: {
    icon: <CheckCircle2 size={14} />,
    label: 'Resolved',
    color: 'text-green-400',
  },
}

export default function ActivityFeed({ emergencies }: ActivityFeedProps) {
  // Show the most recent 20 emergencies as activity items
  const recentActivity = emergencies.slice(0, 20)

  return (
    <div className="h-full flex flex-col w-80">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Clock size={14} className="text-primary" />
          Activity Feed
        </h2>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Real-time emergency updates
        </p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-2">
        {recentActivity.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            No recent activity
          </p>
        ) : (
          recentActivity.map((emergency, i) => {
            const config = statusConfig[emergency.status] || statusConfig.new
            const catIcon = categoryIcons[emergency.category] || categoryIcons.other

            return (
              <motion.div
                key={emergency.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                className="flex gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors group"
              >
                {/* Status icon */}
                <div className={cn(
                  "flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full",
                  emergency.status === 'new' && 'bg-red-500/15',
                  emergency.status === 'triaging' && 'bg-yellow-500/15',
                  emergency.status === 'dispatched' && 'bg-blue-500/15',
                  emergency.status === 'resolved' && 'bg-green-500/15',
                  config.color
                )}>
                  {config.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={cn('text-xs font-medium', config.color)}>
                      {config.label}
                    </span>
                    <span className={cn(
                      'inline-flex items-center justify-center w-4 h-4 rounded-full text-[8px] font-bold text-white',
                      severityColor(emergency.severity)
                    )}>
                      {emergency.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-foreground/70 truncate mt-0.5">
                    {emergency.description || 'No description'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground capitalize">
                      {catIcon}
                      {emergency.category?.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60">
                      {timeAgo(emergency.created_at)}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}

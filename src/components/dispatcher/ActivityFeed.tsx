import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Truck,
  Clock,
  RefreshCw,
  Bot,
  UserCog,
} from 'lucide-react'
import { api, type DispatchLogEntry } from '@/lib/api'
import { cn, timeAgo, severityColor } from '@/lib/utils'

function actionConfig(entry: DispatchLogEntry): { icon: React.ReactNode; color: string; bg: string } {
  const action = entry.action.toLowerCase()
  if (action.includes('status')) {
    return { icon: <RefreshCw size={14} />, color: 'text-yellow-400', bg: 'bg-yellow-500/15' }
  }
  // dispatch-related (auto or manual)
  return { icon: <Truck size={14} />, color: 'text-blue-400', bg: 'bg-blue-500/15' }
}

export default function ActivityFeed() {
  const [entries, setEntries] = useState<DispatchLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchLog = useCallback(async () => {
    try {
      const data = await api.getActivityLog()
      setEntries(data)
    } catch (err) {
      console.warn('[ActivityFeed] fetch failed:', err)
      // Keep existing data on error — don't clear
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch + poll, mirrors useEmergencies
    fetchLog()
    pollRef.current = setInterval(fetchLog, 5000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [fetchLog])

  return (
    <div className="h-full flex flex-col w-80">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Clock size={14} className="text-primary" />
          Activity Feed
        </h2>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Dispatches and status changes
        </p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-2">
        {loading && entries.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            Loading activity...
          </p>
        ) : entries.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            No recent activity
          </p>
        ) : (
          entries.map((entry, i) => {
            const config = actionConfig(entry)
            const severity = entry.emergencies?.severity
            const category = entry.emergencies?.category

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
                className="flex gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors group"
              >
                {/* Action icon */}
                <div className={cn(
                  'flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full',
                  config.bg,
                  config.color
                )}>
                  {config.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={cn('text-xs font-medium', config.color)}>
                      {entry.action}
                    </span>
                    {severity != null && (
                      <span className={cn(
                        'inline-flex items-center justify-center w-4 h-4 rounded-full text-[8px] font-bold text-white',
                        severityColor(severity)
                      )}>
                        {severity}
                      </span>
                    )}
                  </div>
                  {category && (
                    <p className="text-[11px] text-foreground/70 truncate mt-0.5 capitalize">
                      {category.replace('_', ' ')}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground capitalize">
                      {entry.performed_by === 'ai' ? <Bot size={10} /> : <UserCog size={10} />}
                      {entry.performed_by}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60">
                      {timeAgo(entry.created_at)}
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

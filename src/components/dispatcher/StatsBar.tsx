import { motion } from 'framer-motion'
import { AlertTriangle, Activity, Truck, Clock, TrendingUp, Shield } from 'lucide-react'
import type { Emergency } from '@/lib/api'
import { cn } from '@/lib/utils'

interface StatsBarProps {
  emergencies: Emergency[]
}

interface StatCardProps {
  icon: React.ReactNode
  value: string | number
  label: string
  delay: number
  trend?: 'up' | 'down' | 'neutral'
  accentColor?: string
}

function StatCard({ icon, value, label, delay, trend, accentColor }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        "glass rounded-lg px-5 py-4 flex items-center gap-4 min-w-[180px] flex-1",
        "hover:border-primary/30 transition-all duration-300"
      )}
    >
      <div className={cn(
        "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
        accentColor || "bg-primary/10 text-primary"
      )}>
        {icon}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <motion.p
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: delay + 0.2, type: 'spring', stiffness: 200 }}
            className="text-2xl font-bold text-foreground leading-none"
          >
            {value}
          </motion.p>
          {trend && trend !== 'neutral' && (
            <TrendingUp
              size={14}
              className={cn(
                trend === 'up' ? 'text-red-400' : 'text-green-400',
                trend === 'down' && 'rotate-180'
              )}
            />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </motion.div>
  )
}

export default function StatsBar({ emergencies }: StatsBarProps) {
  const active = emergencies.filter(e => e.status !== 'resolved')
  const activeCount = active.length

  const avgSeverity =
    active.length > 0
      ? (active.reduce((sum, e) => sum + (e.severity || 0), 0) / active.length).toFixed(1)
      : '0.0'

  const unitsDeployed = emergencies.reduce((count, e) => count + (e.dispatched_units?.length ?? 0), 0)

  const totalEmergencies = emergencies.length
  const resolvedCount = emergencies.filter(e => e.status === 'resolved').length
  const responseRate =
    totalEmergencies > 0 ? Math.round((resolvedCount / totalEmergencies) * 100) : 0

  const criticalCount = emergencies.filter(e => e.severity >= 4 && e.status !== 'resolved').length

  return (
    <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
      <StatCard
        icon={<AlertTriangle size={20} />}
        value={activeCount}
        label="Active Emergencies"
        delay={0}
        trend={activeCount > 0 ? 'up' : 'neutral'}
        accentColor="bg-red-500/10 text-red-400"
      />
      <StatCard
        icon={<Shield size={20} />}
        value={criticalCount}
        label="Critical (Sev 4-5)"
        delay={0.05}
        accentColor="bg-orange-500/10 text-orange-400"
      />
      <StatCard
        icon={<Activity size={20} />}
        value={avgSeverity}
        label="Avg Severity"
        delay={0.1}
        accentColor="bg-yellow-500/10 text-yellow-400"
      />
      <StatCard
        icon={<Truck size={20} />}
        value={unitsDeployed}
        label="Units Deployed"
        delay={0.15}
        accentColor="bg-blue-500/10 text-blue-400"
      />
      <StatCard
        icon={<Clock size={20} />}
        value={`${responseRate}%`}
        label="Response Rate"
        delay={0.2}
        accentColor="bg-green-500/10 text-green-400"
      />
    </div>
  )
}

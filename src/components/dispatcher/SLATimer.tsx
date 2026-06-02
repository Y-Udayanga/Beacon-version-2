import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SLATimerProps {
  createdAt: string
  status: string
}

export default function SLATimer({ createdAt, status }: SLATimerProps) {
  const [elapsedMs, setElapsedMs] = useState(0)

  useEffect(() => {
    // If it's dispatched or resolved, we could freeze the timer, but we don't have
    // the exact timestamp of status change. For now, we'll just keep showing time elapsed
    // or maybe not show it as an urgent SLA.
    const createdTime = new Date(createdAt).getTime()
    
    const updateTime = () => {
      setElapsedMs(Date.now() - createdTime)
    }

    updateTime()
    
    // Only tick if it's actively waiting
    if (status === 'new' || status === 'triaging') {
      const interval = setInterval(updateTime, 1000)
      return () => clearInterval(interval)
    }
  }, [createdAt, status])

  const isActive = status === 'new' || status === 'triaging'
  
  if (!isActive) {
    return null // Only show SLA timer for actionable tickets
  }

  const safeElapsedMs = Math.max(0, elapsedMs)
  const totalMins = Math.floor(safeElapsedMs / 60000)

  const formatSLA = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000)
    const mins = Math.floor(totalSecs / 60)
    const hours = Math.floor(mins / 60)
    const days = Math.floor(hours / 24)
    const weeks = Math.floor(days / 7)

    if (weeks > 0) {
      return `${weeks}w ago`
    }
    if (days > 0) {
      return `${days}d ago`
    }
    if (hours > 0) {
      const remainingMins = mins % 60
      return `${hours}h ${remainingMins}m`
    }
    
    const secs = totalSecs % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const timeString = formatSLA(safeElapsedMs)

  // SLA Thresholds
  let slaColor = 'text-green-500 bg-green-500/10 border-green-500/20'
  if (totalMins >= 5) {
    slaColor = 'text-red-500 bg-red-500/10 border-red-500/20'
  } else if (totalMins >= 2) {
    slaColor = 'text-amber-500 bg-amber-500/10 border-amber-500/20'
  }

  return (
    <div className={cn('flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-medium tracking-wider', slaColor)}>
      <Clock size={10} className={totalMins >= 5 ? 'animate-pulse' : ''} />
      <span>{timeString}</span>
    </div>
  )
}

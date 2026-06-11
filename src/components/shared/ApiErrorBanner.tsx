import { AlertTriangle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ApiErrorBannerProps {
  error: string | null
  onRetry?: () => void
  className?: string
}

export default function ApiErrorBanner({ error, onRetry, className }: ApiErrorBannerProps) {
  if (!error) return null

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg',
        'bg-destructive/10 border border-destructive/20 text-destructive text-sm',
        className
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <AlertTriangle size={16} className="flex-shrink-0" />
        <span className="truncate">{error}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-destructive/15 hover:bg-destructive/25 text-xs font-medium flex-shrink-0 transition-colors"
        >
          <RefreshCw size={12} />
          Retry
        </button>
      )}
    </div>
  )
}

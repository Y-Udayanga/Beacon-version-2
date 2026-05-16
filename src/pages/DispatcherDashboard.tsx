import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Radio, Bell, Clock, Search, Filter, UserSearch } from 'lucide-react'
import { useEmergencies } from '@/hooks/useEmergencies'
import type { Emergency } from '@/lib/api'
import { cn, timeAgo } from '@/lib/utils'
import StatsBar from '@/components/dispatcher/StatsBar'
import TicketCard from '@/components/dispatcher/TicketCard'
import TicketDetailPanel from '@/components/dispatcher/TicketDetailPanel'
import ActivityFeed from '@/components/dispatcher/ActivityFeed'

interface KanbanColumnProps {
  title: string
  status: string
  color: string
  emergencies: Emergency[]
  onCardClick: (e: Emergency) => void
}

function KanbanColumn({ title, color, emergencies, onCardClick }: KanbanColumnProps) {
  return (
    <div className="flex flex-col min-w-[300px] w-[300px] flex-shrink-0 lg:flex-1 lg:min-w-0 lg:w-auto">
      {/* Column Header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={cn('w-2.5 h-2.5 rounded-full', color)} />
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <span className="ml-auto px-2 py-0.5 rounded-full bg-muted text-[11px] font-medium text-muted-foreground">
          {emergencies.length}
        </span>
      </div>

      {/* Column Body */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide rounded-lg bg-muted/30 border border-border/30 p-2 min-h-[200px]">
        <AnimatePresence mode="popLayout">
          {emergencies.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-muted-foreground text-center py-8"
            >
              No emergencies
            </motion.p>
          ) : (
            emergencies.map(e => (
              <TicketCard key={e.id} emergency={e} onClick={() => onCardClick(e)} />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default function DispatcherDashboard() {
  const { emergencies, grouped, loading, refetch } = useEmergencies()
  const [selectedEmergency, setSelectedEmergency] = useState<Emergency | null>(null)
  const [showActivity, setShowActivity] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const columns = [
    { title: 'New', status: 'new', color: 'bg-status-new', data: grouped.new },
    { title: 'Triaging', status: 'triaging', color: 'bg-status-triaging', data: grouped.triaging },
    { title: 'Dispatched', status: 'dispatched', color: 'bg-status-dispatched', data: grouped.dispatched },
    { title: 'Resolved', status: 'resolved', color: 'bg-status-resolved', data: grouped.resolved },
  ]

  // Filter by search query
  const filteredColumns = columns.map(col => ({
    ...col,
    data: searchQuery
      ? col.data.filter(e =>
          (e.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (e.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (e.location_address || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
      : col.data,
  }))

  function handleUpdate() {
    refetch()
  }

  const criticalCount = emergencies.filter(e => e.severity >= 4 && e.status !== 'resolved').length

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={16} />
              Back
            </Link>
            <div className="w-px h-5 bg-border" />
            <h1 className="text-lg font-bold text-foreground tracking-tight">
              Crisis Copilot{' '}
              <span className="text-muted-foreground font-normal">&mdash; Dispatch Center</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Critical alert badge */}
            {criticalCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/15 border border-destructive/30 text-destructive text-xs font-medium"
              >
                <Bell size={12} className="animate-pulse" />
                {criticalCount} Critical
              </motion.div>
            )}

            {/* Clock */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock size={12} />
              {currentTime.toLocaleTimeString()}
            </div>

            {/* Live indicator */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
              <Radio size={14} />
              Live
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border/50">
        <StatsBar emergencies={emergencies} />
      </div>

      {/* Toolbar */}
      <div className="flex-shrink-0 px-6 py-3 border-b border-border/30 flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search emergencies..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Action buttons */}
        <button
          onClick={() => setShowActivity(!showActivity)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
            showActivity
              ? "bg-primary/20 text-primary border border-primary/30"
              : "bg-muted border border-border text-muted-foreground hover:text-foreground"
          )}
        >
          <Filter size={14} />
          Activity Log
        </button>

        <Link
          to="/missing"
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm hover:bg-amber-500/20 transition-all"
        >
          <UserSearch size={14} />
          Missing Persons
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Kanban Board */}
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
            <div className="flex gap-4 h-full overflow-x-auto scrollbar-hide pb-2">
              {filteredColumns.map(col => (
                <KanbanColumn
                  key={col.status}
                  title={col.title}
                  status={col.status}
                  color={col.color}
                  emergencies={col.data}
                  onCardClick={setSelectedEmergency}
                />
              ))}
            </div>
          )}
        </main>

        {/* Activity Feed Sidebar */}
        <AnimatePresence>
          {showActivity && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-shrink-0 border-l border-border overflow-hidden"
            >
              <ActivityFeed emergencies={emergencies} />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Detail Panel Overlay */}
      <AnimatePresence>
        {selectedEmergency && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEmergency(null)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            {/* Panel */}
            <TicketDetailPanel
              emergency={selectedEmergency}
              onClose={() => setSelectedEmergency(null)}
              onUpdate={handleUpdate}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

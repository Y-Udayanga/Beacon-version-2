import { useState, useEffect, useCallback } from 'react'
import { api, type Emergency } from '@/lib/api'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

const POLL_FALLBACK_MS = 5_000
const POLL_REALTIME_BACKUP_MS = 30_000

/**
 * Fetch emergencies via the backend API.
 * Uses Supabase Realtime as the primary update mechanism when configured,
 * with polling as a fallback when Realtime is unavailable.
 */
export function useEmergencies() {
  const [emergencies, setEmergencies] = useState<Emergency[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [realtimeConnected, setRealtimeConnected] = useState(false)

  const fetchEmergencies = useCallback(async () => {
    try {
      const data = await api.getEmergencies()
      setEmergencies(data)
      setError(null)
    } catch (err) {
      console.warn('[useEmergencies] fetch failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to load emergencies')
    } finally {
      setLoading(false)
    }
  }, [])

  // Realtime — triggers refetch so dispatched_units joins stay in sync
  useEffect(() => {
    if (!isSupabaseConfigured) return

    const channel = supabase
      .channel('emergencies-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'emergencies' },
        () => fetchEmergencies()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dispatched_units' },
        () => fetchEmergencies()
      )
      .subscribe((status) => {
        const connected = status === 'SUBSCRIBED'
        setRealtimeConnected(connected)
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn('[useEmergencies] Realtime disconnected, falling back to polling')
        }
      })

    return () => {
      supabase.removeChannel(channel)
      setRealtimeConnected(false)
    }
  }, [fetchEmergencies])

  // Initial fetch + polling fallback (5s) or backup heartbeat (30s when Realtime connected)
  useEffect(() => {
    fetchEmergencies()

    const intervalMs = realtimeConnected ? POLL_REALTIME_BACKUP_MS : POLL_FALLBACK_MS
    const id = setInterval(fetchEmergencies, intervalMs)
    return () => clearInterval(id)
  }, [fetchEmergencies, realtimeConnected])

  const grouped = {
    new: emergencies.filter(e => e.status === 'new'),
    triaging: emergencies.filter(e => e.status === 'triaging'),
    dispatched: emergencies.filter(e => e.status === 'dispatched'),
    resolved: emergencies.filter(e => e.status === 'resolved'),
  }

  return {
    emergencies,
    grouped,
    loading,
    error,
    realtimeConnected,
    refetch: fetchEmergencies,
  }
}

import { useState, useEffect, useCallback, useRef } from 'react'
import { api, type Emergency } from '@/lib/api'

/**
 * Fetch emergencies via the backend API instead of direct Supabase calls.
 * Polls every 5 seconds for near-realtime updates.
 * Falls back gracefully if the backend is unreachable.
 */
export function useEmergencies() {
  const [emergencies, setEmergencies] = useState<Emergency[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchEmergencies = useCallback(async () => {
    try {
      const data = await api.getEmergencies()
      setEmergencies(data)
      setError(null)
    } catch (err) {
      console.warn('[useEmergencies] fetch failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to load emergencies')
      // Keep existing data on error — don't clear
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Initial fetch
    fetchEmergencies()

    // Poll every 5 seconds for near-realtime updates
    pollRef.current = setInterval(fetchEmergencies, 5000)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [fetchEmergencies])

  const grouped = {
    new: emergencies.filter(e => e.status === 'new'),
    triaging: emergencies.filter(e => e.status === 'triaging'),
    dispatched: emergencies.filter(e => e.status === 'dispatched'),
    resolved: emergencies.filter(e => e.status === 'resolved'),
  }

  return { emergencies, grouped, loading, error, refetch: fetchEmergencies }
}

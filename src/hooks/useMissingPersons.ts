import { useState, useEffect, useCallback, useRef } from 'react'
import { api, type MissingPerson } from '@/lib/api'

/**
 * Fetch missing persons via the backend API.
 * Polls every 10 seconds for near-realtime updates.
 */
export function useMissingPersons() {
  const [missingPersons, setMissingPersons] = useState<MissingPerson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchMissingPersons = useCallback(async () => {
    try {
      const data = await api.getMissingPersons()
      setMissingPersons(data)
      setError(null)
    } catch (err) {
      console.warn('[useMissingPersons] fetch failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to load missing persons')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMissingPersons()
    pollRef.current = setInterval(fetchMissingPersons, 10000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [fetchMissingPersons])

  return { missingPersons, loading, error, refetch: fetchMissingPersons }
}

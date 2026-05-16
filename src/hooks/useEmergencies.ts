import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Emergency } from '@/lib/api'

export function useEmergencies() {
  const [emergencies, setEmergencies] = useState<Emergency[]>([])
  const [loading, setLoading] = useState(true)

  const fetchEmergencies = useCallback(async () => {
    const { data, error } = await supabase
      .from('emergencies')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setEmergencies(data as Emergency[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchEmergencies()

    const channel = supabase
      .channel('emergencies-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'emergencies' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setEmergencies(prev => [payload.new as Emergency, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setEmergencies(prev =>
              prev.map(e => e.id === (payload.new as Emergency).id ? payload.new as Emergency : e)
            )
          } else if (payload.eventType === 'DELETE') {
            setEmergencies(prev =>
              prev.filter(e => e.id !== (payload.old as Emergency).id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchEmergencies])

  const grouped = {
    new: emergencies.filter(e => e.status === 'new'),
    triaging: emergencies.filter(e => e.status === 'triaging'),
    dispatched: emergencies.filter(e => e.status === 'dispatched'),
    resolved: emergencies.filter(e => e.status === 'resolved'),
  }

  return { emergencies, grouped, loading, refetch: fetchEmergencies }
}

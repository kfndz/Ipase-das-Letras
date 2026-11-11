import { useCallback, useEffect, useState } from 'react'
import type { LiteracyEvent } from '../types'
import { getRepository } from '../services/repositories'

export function usePublicEvents() {
  const [events, setEvents] = useState<LiteracyEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const nextEvents = await getRepository().listEvents({ publishedOnly: true })
      setEvents(nextEvents)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os eventos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    const repository = getRepository()
    const unsubscribe = repository.subscribe((subscriptionError) => {
      if (!active) return
      if (subscriptionError) {
        setError(subscriptionError.message)
      } else {
        void Promise.resolve().then(refresh)
      }
    })

    void Promise.resolve().then(refresh)
    return () => {
      active = false
      unsubscribe()
    }
  }, [refresh])

  return { events, loading, error, refresh }
}

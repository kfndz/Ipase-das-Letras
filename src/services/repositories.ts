import { seededEvents } from '../data/site'
import type { AppMode, LiteracyEvent } from '../types'
import { cuiabaLocalDateTimeToIso } from '../utils/dateUtils'
import { getAppMode } from './admin'

const DEMO_STORAGE_KEY = 'ipase-demo-events'
const EVENTS_CHANGED_EVENT = 'ipase-events-updated'
const CUIABA_TIME_ZONE = 'America/Cuiaba'

export interface EventRepository {
  listEvents: (options?: { publishedOnly?: boolean }) => Promise<LiteracyEvent[]>
  saveEvent: (event: LiteracyEvent) => Promise<LiteracyEvent>
  deleteEvent: (eventId: string) => Promise<void>
  restoreDemoSeed: () => Promise<void>
  subscribe: (listener: (error?: Error) => void) => () => void
}

const notifyEventsChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENTS_CHANGED_EVENT))
  }
}

const readDemoEvents = (): LiteracyEvent[] => {
  if (typeof window === 'undefined') {
    return seededEvents
  }

  const rawValue = window.localStorage.getItem(DEMO_STORAGE_KEY)

  if (rawValue === null) {
    return seededEvents
  }

  try {
    const parsed = JSON.parse(rawValue) as LiteracyEvent[]
    if (!Array.isArray(parsed)) {
      throw new Error('Os dados demonstrativos de eventos estão em formato inválido.')
    }

    return parsed.map((event) => ({ ...event, published: event.published ?? true }))
  } catch (error) {
    throw new Error('Não foi possível ler os eventos demonstrativos.', { cause: error })
  }
}

const writeDemoEvents = (events: LiteracyEvent[]) => {
  if (typeof window === 'undefined') {
    throw new Error('O armazenamento local não está disponível neste ambiente.')
  }

  window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(events))
  notifyEventsChanged()
}

const getSupabaseClient = async () => {
  const url = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('O modo Supabase está selecionado, mas VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não está configurada.')
  }

  const { createClient } = await import('@supabase/supabase-js')
  return createClient(url, anonKey)
}

const getDateInCuiaba = (value: string | null): string => {
  if (!value) {
    return ''
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CUIABA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value))
  const dateParts = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]))
  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`
}

const getTimeInCuiaba = (value: string | null, fallback: string): string => {
  if (!value) {
    return fallback
  }

  if (/^\d{2}:\d{2}/.test(value)) {
    return value.slice(0, 5)
  }

  return new Intl.DateTimeFormat('en-GB', {
    timeZone: CUIABA_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(value))
}

const mapSupabaseEvent = (row: Record<string, unknown>): LiteracyEvent => {
  const startAt = typeof row.start_at === 'string' ? row.start_at : null
  const endAt = typeof row.end_at === 'string' ? row.end_at : null
  const timeStart = typeof row.time_start === 'string' ? row.time_start : null
  const timeEnd = typeof row.time_end === 'string' ? row.time_end : null

  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    summary: String(row.summary ?? ''),
    category: (row.category ?? 'routine') as LiteracyEvent['category'],
    status: (row.status ?? 'scheduled') as LiteracyEvent['status'],
    published: row.published === true,
    startDate: getDateInCuiaba(startAt),
    endDate: getDateInCuiaba(endAt ?? startAt),
    startTime: getTimeInCuiaba(timeStart, getTimeInCuiaba(startAt, '19:00')),
    endTime: getTimeInCuiaba(timeEnd, getTimeInCuiaba(endAt, '21:00')),
    location: String(row.location ?? ''),
  }
}

const throwSupabaseError = (error: { message: string; code?: string } | null) => {
  if (error) {
    throw new Error(`Falha ao persistir eventos no Supabase: ${error.message}`, {
      cause: error.code,
    })
  }
}

export class DemoRepository implements EventRepository {
  listEvents = async (options: { publishedOnly?: boolean } = {}) => {
    const events = readDemoEvents()
    return options.publishedOnly ? events.filter((event) => event.published) : events
  }

  saveEvent = async (event: LiteracyEvent) => {
    const current = readDemoEvents()
    const next = current.some((item) => item.id === event.id)
      ? current.map((item) => (item.id === event.id ? event : item))
      : [...current, event]

    writeDemoEvents(next)
    return event
  }

  deleteEvent = async (eventId: string) => {
    writeDemoEvents(readDemoEvents().filter((item) => item.id !== eventId))
  }

  restoreDemoSeed = async () => {
    writeDemoEvents(seededEvents)
  }

  subscribe = (listener: (error?: Error) => void) => {
    if (typeof window === 'undefined') {
      return () => undefined
    }

    const handleChange = () => listener()
    const handleStorage = (event: StorageEvent) => {
      if (event.key === DEMO_STORAGE_KEY) {
        handleChange()
      }
    }

    window.addEventListener(EVENTS_CHANGED_EVENT, handleChange)
    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener(EVENTS_CHANGED_EVENT, handleChange)
      window.removeEventListener('storage', handleStorage)
    }
  }
}

export class SupabaseRepository implements EventRepository {
  listEvents = async (options: { publishedOnly?: boolean } = {}) => {
    const supabase = await getSupabaseClient()
    let query = supabase.from('events').select('*').order('start_at', { ascending: true })

    if (options.publishedOnly) {
      query = query.eq('published', true)
    }

    const { data, error } = await query
    throwSupabaseError(error)

    if (!data) {
      throw new Error('O Supabase não retornou os eventos solicitados.')
    }

    return data.map((row) => mapSupabaseEvent(row as Record<string, unknown>))
  }

  saveEvent = async (event: LiteracyEvent) => {
    const supabase = await getSupabaseClient()
    const payload = {
      id: event.id,
      title: event.title,
      summary: event.summary,
      category: event.category,
      status: event.status,
      start_at: cuiabaLocalDateTimeToIso(event.startDate, event.startTime),
      end_at: cuiabaLocalDateTimeToIso(event.endDate, event.endTime),
      time_start: event.startTime,
      time_end: event.endTime,
      location: event.location,
      published: event.published,
    }

    const { data, error } = await supabase.from('events').upsert(payload).select('*').single()
    throwSupabaseError(error)

    if (!data) {
      throw new Error('O Supabase não confirmou a gravação do evento.')
    }

    notifyEventsChanged()
    return mapSupabaseEvent(data as Record<string, unknown>)
  }

  deleteEvent = async (eventId: string) => {
    const supabase = await getSupabaseClient()
    const { data, error } = await supabase.from('events').delete().eq('id', eventId).select('id').single()
    throwSupabaseError(error)
    if (!data) {
      throw new Error('O Supabase não confirmou a exclusão do evento.')
    }
    notifyEventsChanged()
  }

  restoreDemoSeed = async () => {
    throw new Error('A restauração dos dados demonstrativos não está disponível no modo Supabase.')
  }

  subscribe = (listener: (error?: Error) => void) => {
    const handleLocalChange = () => listener()
    if (typeof window === 'undefined') return () => undefined
    window.addEventListener(EVENTS_CHANGED_EVENT, handleLocalChange)
    window.addEventListener('focus', handleLocalChange)

    return () => {
      window.removeEventListener(EVENTS_CHANGED_EVENT, handleLocalChange)
      window.removeEventListener('focus', handleLocalChange)
    }
  }
}

let repository: EventRepository | undefined
let repositoryMode: AppMode | undefined

export const getRepository = (): EventRepository => {
  const mode: AppMode = getAppMode()

  if (!repository || mode !== repositoryMode) {
    repository = mode === 'supabase' ? new SupabaseRepository() : new DemoRepository()
    repositoryMode = mode
  }

  return repository
}

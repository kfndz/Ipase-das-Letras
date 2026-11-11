import { createRecurringMeetings, getFutureEvents, getTodayInCuiaba } from './site'
import type { LiteracyEvent } from '../types'
import { cuiabaLocalDateTimeToIso, eventMatchesDate } from '../utils/dateUtils'

const createEvent = (overrides: Partial<LiteracyEvent> = {}): LiteracyEvent => ({
  id: 'event-1',
  title: 'Encontro de leitura',
  summary: '',
  category: 'routine',
  status: 'scheduled',
  published: true,
  startDate: '2026-11-12',
  endDate: '2026-11-12',
  startTime: '19:00',
  endTime: '21:00',
  location: 'Ipase',
  ...overrides,
})

describe('event calendar logic', () => {
  it('generates Tuesday and Thursday meetings across the year boundary without duplicate dates', () => {
    const events = createRecurringMeetings('2026-12-29', 2)
    const january = events.filter((event) => event.startDate.startsWith('2027-01'))

    expect(january.length).toBeGreaterThan(0)
    expect(new Set(events.map((event) => event.id)).size).toBe(events.length)
    expect(events.every((event) => event.startTime === '19:00' && event.endTime === '21:00')).toBe(true)
    expect(events.every((event) => {
      const weekday = new Date(`${event.startDate}T12:00:00Z`).getUTCDay()
      return weekday === 2 || weekday === 4
    })).toBe(true)
  })

  it('matches both endpoints of multi-day events and rejects days outside the interval', () => {
    const event = createEvent({ startDate: '2026-12-30', endDate: '2027-01-02' })

    expect(eventMatchesDate(new Date('2026-12-30T12:00:00'), event)).toBe(true)
    expect(eventMatchesDate(new Date('2027-01-02T12:00:00'), event)).toBe(true)
    expect(eventMatchesDate(new Date('2027-01-03T12:00:00'), event)).toBe(false)
  })

  it('excludes unpublished, cancelled, and past encounters from upcoming events', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-11T12:00:00-04:00'))

    const future = createEvent({ id: 'future', startDate: '2026-11-12' })
    const cancelled = createEvent({ id: 'cancelled', status: 'cancelled' })
    const draft = createEvent({ id: 'draft', published: false })
    const past = createEvent({ id: 'past', startDate: '2026-11-10' })

    expect(getFutureEvents([future, cancelled, draft, past]).map((event) => event.id)).toEqual(['future'])
    vi.useRealTimers()
  })

  it('uses the Cuiaba timezone when interpreting local date and time', () => {
    expect(getTodayInCuiaba(new Date('2026-11-12T02:00:00Z'))).toBe('2026-11-11')
    expect(cuiabaLocalDateTimeToIso('2026-11-12', '19:00')).toBe('2026-11-12T23:00:00.000Z')
  })
})

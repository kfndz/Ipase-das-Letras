import { addMonths, format, isValid, subMonths } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import { CalendarGrid, EventSummary } from '../components/CalendarGrid'
import { usePublicEvents } from '../hooks/usePublicEvents'
import type { EventCategory } from '../types'

const categories: Array<{ value: 'all' | EventCategory; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'routine', label: 'Rotina' },
  { value: 'special', label: 'Especiais' },
  { value: 'cancellation', label: 'Cancelamentos' },
]

const FILTER_KEY = 'ipase-calendar-filter'
const MONTH_KEY = 'ipase-calendar-month'

const readStoredFilter = (): 'all' | EventCategory => {
  const saved = window.localStorage.getItem(FILTER_KEY)
  return saved && categories.some((category) => category.value === saved)
    ? (saved as 'all' | EventCategory)
    : 'all'
}

const readStoredMonth = (): Date => {
  const saved = window.localStorage.getItem(MONTH_KEY)
  if (!saved) return new Date()

  const parsed = new Date(saved)
  return isValid(parsed) ? parsed : new Date()
}

export function CalendarPage() {
  const [month, setMonth] = useState<Date>(() => readStoredMonth())
  const [filter, setFilter] = useState<'all' | EventCategory>(() => readStoredFilter())
  const { events, loading, error } = usePublicEvents()

  useEffect(() => {
    window.localStorage.setItem(FILTER_KEY, filter)
  }, [filter])

  useEffect(() => {
    window.localStorage.setItem(MONTH_KEY, month.toISOString())
  }, [month])

  const filteredEvents = useMemo(
    () => events.filter((event) => (filter === 'all' ? true : event.category === filter)),
    [events, filter],
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="mb-8 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-700">Agenda</p>
            <h1 className="mt-2 text-4xl font-black text-stone-900">Calendário de atividades</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMonth((current) => subMonths(current, 1))}
              className="cursor-pointer rounded-full border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700"
            >
              Mês anterior
            </button>
            <div className="rounded-full bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-700">
              {format(month, 'MMMM yyyy')}
            </div>
            <button
              type="button"
              onClick={() => setMonth((current) => addMonths(current, 1))}
              className="cursor-pointer rounded-full border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700"
            >
              Próximo mês
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {categories.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition ${
                filter === value
                  ? 'bg-amber-700 text-white'
                  : 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          {error && (
            <p role="alert" className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </p>
          )}
          {loading ? (
            <p role="status" className="rounded-2xl border border-stone-200 bg-white p-6 text-sm text-stone-600">Carregando calendário...</p>
          ) : (
            <CalendarGrid month={month} events={filteredEvents} />
          )}
        </div>
        <div className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-bold text-stone-900">Detalhes</h2>
          <p className="mt-2 text-sm text-stone-600">
            O calendário aceita eventos de um único dia e períodos que durem vários dias, com destaque para atividades rotineiras e eventos extraordinários.
          </p>
          <div className="mt-6">
            {loading ? (
              <p role="status" className="text-sm text-stone-600">Carregando eventos...</p>
            ) : filteredEvents.length === 0 ? (
              <p className="rounded-2xl bg-stone-50 p-4 text-sm text-stone-600">Não há eventos publicados para este filtro.</p>
            ) : (
              <EventSummary events={filteredEvents} month={month} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

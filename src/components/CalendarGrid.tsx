import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  endOfDay,
  format,
  isSameDay,
  parseISO,
  startOfMonth,
  startOfWeek,
  startOfDay,
} from 'date-fns'
import { CalendarRange, CircleOff, Sparkles } from 'lucide-react'
import { eventMatchesDate } from '../utils/dateUtils'
import type { LiteracyEvent } from '../types'

interface CalendarGridProps {
  month: Date
  events: LiteracyEvent[]
}

const categoryStyles: Record<string, string> = {
  routine: 'bg-emerald-100 text-emerald-800',
  special: 'bg-amber-100 text-amber-800',
  cancellation: 'bg-rose-100 text-rose-800',
}

const eventLabel = (event: LiteracyEvent) => {
  if (event.status === 'cancelled' || event.category === 'cancellation') return 'Cancelado'
  if (event.status === 'altered') return 'Alterado'
  if (event.category === 'special') return 'Especial'
  return 'Rotina'
}

const eventStyles = (event: LiteracyEvent) =>
  event.status === 'cancelled' || event.category === 'cancellation'
    ? categoryStyles.cancellation
    : event.status === 'altered'
      ? 'bg-orange-100 text-orange-800'
      : categoryStyles[event.category]

export function CalendarGrid({ month, events }: CalendarGridProps) {
  const monthStart = startOfMonth(month)
  const firstDay = startOfWeek(monthStart, { weekStartsOn: 1 })
  const lastDay = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: firstDay, end: lastDay })

  const dayEvents = (date: Date) =>
    events.filter((event) => eventMatchesDate(date, event))

  return (
    <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
      <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-100 px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const list = dayEvents(day)
          const isCurrentMonth = day.getMonth() === month.getMonth()

          return (
            <div
              key={day.toISOString()}
              className={`min-h-28 border-b border-r border-stone-200 p-2 ${
                isCurrentMonth ? 'bg-white' : 'bg-stone-50/80 text-stone-400'
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className={`text-sm font-medium ${isCurrentMonth ? 'text-stone-700' : 'text-stone-400'}`}>
                  {format(day, 'd')}
                </span>
                {list.length > 0 && (
                  <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                    {list.length}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {list.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    className={`rounded-lg px-2 py-1 text-[10px] font-medium ${eventStyles(event)}`}
                  >
                    {event.title}
                  </div>
                ))}
                {list.length > 2 && (
                  <div className="text-[10px] font-medium text-stone-500">+{list.length - 2} mais</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function EventSummary({ events, month }: { events: LiteracyEvent[]; month?: Date }) {
  const monthEvents = month
    ? events.filter((event) => {
        const eventStart = startOfDay(parseISO(event.startDate))
        const eventEnd = endOfDay(parseISO(event.endDate))
        return eventStart <= endOfMonth(month) && eventEnd >= startOfMonth(month)
      })
    : events

  if (monthEvents.length === 0) {
    return <p className="rounded-2xl bg-stone-50 p-4 text-sm text-stone-600">Não há eventos publicados neste mês.</p>
  }

  return (
    <div className="space-y-4">
      {monthEvents.map((event) => {
        const isSingleDay = isSameDay(parseISO(event.startDate), parseISO(event.endDate))
        const summaryIcon =
          event.status === 'cancelled' || event.category === 'cancellation' ? (
            <CircleOff className="h-4 w-4 text-rose-600" />
          ) : event.status === 'altered' ? (
            <Sparkles className="h-4 w-4 text-orange-600" />
          ) : event.category === 'special' ? (
            <Sparkles className="h-4 w-4 text-amber-600" />
          ) : (
            <CalendarRange className="h-4 w-4 text-emerald-600" />
          )

        return (
          <div key={event.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {summaryIcon}
                <span className="text-sm font-semibold text-stone-800">{event.title}</span>
              </div>
              <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${eventStyles(event)}`}>
                {eventLabel(event)}
              </span>
            </div>
            <p className="text-sm text-stone-600">{event.summary}</p>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-stone-500">
              <span>{isSingleDay ? format(parseISO(event.startDate), 'dd/MM') : `${format(parseISO(event.startDate), 'dd/MM')} a ${format(parseISO(event.endDate), 'dd/MM')}`}</span>
              <span>{event.startTime} - {event.endTime}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

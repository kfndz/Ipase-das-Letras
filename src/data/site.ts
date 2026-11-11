import { addWeeks, eachDayOfInterval, endOfMonth, isAfter, startOfMonth, startOfWeek } from 'date-fns'
import type { LiteracyEvent } from '../types'
import { CUIABA_TIME_ZONE, cuiabaLocalDateTimeToIso } from '../utils/dateUtils'

export { CUIABA_TIME_ZONE } from '../utils/dateUtils'

const formatUtcDate = (value: Date) =>
  `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}-${String(value.getUTCDate()).padStart(2, '0')}`

export const getTodayInCuiaba = (now = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CUIABA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year}-${values.month}-${values.day}`
}

export const createRecurringMeetings = (
  fromDate = getTodayInCuiaba(),
  monthsToGenerate = 12,
): LiteracyEvent[] => {
  const [year, month] = fromDate.split('-').map(Number)
  const events: LiteracyEvent[] = []

  for (let index = 0; index < monthsToGenerate; index += 1) {
    const monthDate = new Date(Date.UTC(year, month - 1 + index, 1))
    const monthEnd = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth() + 1, 0))
    const cursor = new Date(monthDate)

    while (cursor <= monthEnd) {
      const weekday = cursor.getUTCDay()
      if (weekday === 2 || weekday === 4) {
        const eventDate = new Date(cursor)
        const recurrenceLabel = weekday === 2 ? 'Terça-feira' : 'Quinta-feira'
        const dateString = formatUtcDate(eventDate)

        events.push({
          id: `leitura-${dateString}`,
          title: `Leitura em grupo - ${recurrenceLabel}`,
          summary: 'Encontro comunitário de leitura com escolha de livros, roda de conversa e troca de experiências.',
          category: 'routine',
          status: 'scheduled',
          published: true,
          startDate: dateString,
          endDate: dateString,
          startTime: '19:00',
          endTime: '21:00',
          location: 'Rua Eurico Gaspar Dutra, 296 - Ipase',
        })
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
  }

  return events
}

export const siteInfo = {
  name: 'Ipase das Letras',
  whatsappNumber: '5565999423691',
  address: 'Rua Eurico Gaspar Dutra, nº 296, bairro Ipase, Várzea Grande–MT, CEP 78125-200',
  schedule: 'Terças e quintas-feiras, das 19h às 21h',
  participation: 'Gratuita',
  audience: 'Crianças e adolescentes de 6 a 16 anos + famílias',
  hours: '19h às 21h',
}

export const seededEvents = createRecurringMeetings()

export const getFutureEvents = (events: LiteracyEvent[] = seededEvents) =>
  [...events]
    .filter((event) =>
      event.published && event.status !== 'cancelled' && event.category !== 'cancellation')
    .filter((event) => {
      const eventStart = new Date(cuiabaLocalDateTimeToIso(event.startDate, event.startTime))
      return isAfter(eventStart, new Date())
    })
    .sort((a, b) =>
      new Date(cuiabaLocalDateTimeToIso(a.startDate, a.startTime)).getTime() -
      new Date(cuiabaLocalDateTimeToIso(b.startDate, b.startTime)).getTime())

export const monthCalendarDays = (month = new Date()) => {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const end = endOfMonth(month)
  const lastDay = startOfWeek(end, { weekStartsOn: 1 })

  return eachDayOfInterval({ start, end: addWeeks(lastDay, 1) })
}

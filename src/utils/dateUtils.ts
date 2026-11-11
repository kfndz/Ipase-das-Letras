import { format } from 'date-fns'
import type { LiteracyEvent } from '../types'

export const CUIABA_TIME_ZONE = 'America/Cuiaba'

export function eventMatchesDate(date: Date, event: LiteracyEvent): boolean {
  const target = format(date, 'yyyy-MM-dd')

  return target >= event.startDate && target <= event.endDate
}

export function cuiabaLocalDateTimeToIso(date: string, time: string): string {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  const targetUtc = Date.UTC(year, month - 1, day, hour, minute)
  let timestamp = targetUtc

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: CUIABA_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date(timestamp))
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, Number(value)]))
    const wallClockAsUtc = Date.UTC(
      values.year,
      values.month - 1,
      values.day,
      values.hour,
      values.minute,
    )
    timestamp += targetUtc - wallClockAsUtc
  }

  return new Date(timestamp).toISOString()
}

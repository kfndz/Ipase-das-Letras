export type EventCategory = 'routine' | 'special' | 'cancellation'
export type EventStatus = 'scheduled' | 'altered' | 'cancelled'

export interface LiteracyEvent {
  id: string
  title: string
  summary: string
  category: EventCategory
  status: EventStatus
  published: boolean
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  location: string
}

export type AppMode = 'demo' | 'supabase'

export interface AdminSession {
  email: string
  role: 'admin'
  mode: AppMode
}

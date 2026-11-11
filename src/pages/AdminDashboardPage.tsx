import { CalendarClock, LogOut, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAppMode, readStoredSession, signOutAdmin, verifySession } from '../services/admin'
import { getRepository } from '../services/repositories'
import type { EventCategory, EventStatus, LiteracyEvent } from '../types'

const localDate = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

const createEmptyEvent = (): LiteracyEvent => ({
  id: '',
  title: '',
  summary: '',
  category: 'special',
  status: 'scheduled',
  published: false,
  startDate: localDate(),
  endDate: localDate(),
  startTime: '19:00',
  endTime: '21:00',
  location: 'Rua Eurico Gaspar Dutra, 296 - Ipase',
})

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const [session, setSession] = useState(() => readStoredSession())
  const [events, setEvents] = useState<LiteracyEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [draft, setDraft] = useState<LiteracyEvent>(createEmptyEvent)
  const [editingId, setEditingId] = useState<string | null>(null)
  const appMode = getAppMode()

  const loadEvents = async () => {
    setLoading(true)
    setError('')
    try {
      setEvents(await getRepository().listEvents())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os eventos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    const validateSession = async () => {
      try {
        const verified = await verifySession()
        if (active) {
          setSession(verified)
          if (!verified) navigate('/admin')
        }
      } catch {
        if (active) {
          setSession(null)
          setError('Não foi possível verificar a sessão administrativa.')
          navigate('/admin')
        }
      }
    }

    void validateSession()
    return () => {
      active = false
    }
  }, [navigate])

  useEffect(() => {
    void Promise.resolve().then(loadEvents)
  }, [])

  const pending = events.filter((event) => event.status !== 'cancelled').length
  const special = events.filter((event) => event.category === 'special').length
  const cancellations = events.filter((event) => event.status === 'cancelled').length

  const saveDraft = async (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault()
    setError('')
    setMessage('')

    if (draft.endDate < draft.startDate) {
      setError('A data final deve ser igual ou posterior à data inicial.')
      return
    }

    setSaving(true)
    try {
      const eventToSave: LiteracyEvent = {
        ...draft,
        id: editingId ?? (appMode === 'supabase' ? crypto.randomUUID() : `demo-${crypto.randomUUID()}`),
      }
      const saved = await getRepository().saveEvent(eventToSave)
      setEvents((current) => current.some((event) => event.id === saved.id)
        ? current.map((event) => event.id === saved.id ? saved : event)
        : [...current, saved])
      setDraft(createEmptyEvent())
      setEditingId(null)
      setMessage(saved.published ? 'Evento salvo e publicado.' : 'Evento salvo como rascunho.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível salvar o evento.')
    } finally {
      setSaving(false)
    }
  }

  const editEvent = (event: LiteracyEvent) => {
    setDraft({ ...event })
    setEditingId(event.id)
    setMessage('')
    setError('')
  }

  const updateEvent = async (event: LiteracyEvent, changes: Partial<LiteracyEvent>, successMessage: string) => {
    setError('')
    setMessage('')
    try {
      const saved = await getRepository().saveEvent({ ...event, ...changes })
      setEvents((current) => current.map((item) => item.id === saved.id ? saved : item))
      setMessage(successMessage)
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Não foi possível atualizar o evento.')
    }
  }

  const handleLogout = async () => {
    try {
      await signOutAdmin()
      setSession(null)
      navigate('/admin')
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : 'Não foi possível encerrar a sessão.')
    }
  }

  const handleRestoreDemoData = async () => {
    if (appMode !== 'demo') return

    setError('')
    setMessage('')
    try {
      await getRepository().restoreDemoSeed()
      await loadEvents()
      setMessage('Dados iniciais da demonstração restaurados.')
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : 'Não foi possível restaurar os dados.')
    }
  }

  if (!session) {
    return null
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-700">Painel administrativo</p>
            <h1 className="mt-2 text-3xl font-black text-stone-900">Bem-vindo, {session.email}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-stone-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-700">
              {appMode === 'demo' ? 'Modo demonstração — dados locais' : 'Modo produção'}
            </span>
            {appMode === 'demo' && (
              <button type="button" onClick={() => void handleRestoreDemoData()} className="rounded-full border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                Restaurar dados
              </button>
            )}
            <button type="button" onClick={() => void handleLogout()} className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700">
              <LogOut size={16} /> Sair
            </button>
          </div>
        </div>

        {error && <p role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {message && <p role="status" className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-stone-50 p-4"><div className="flex items-center justify-between"><span className="text-sm text-stone-600">Atividades não canceladas</span><CalendarClock className="text-amber-700" size={18} /></div><p className="mt-3 text-3xl font-bold text-stone-900">{pending}</p></div>
          <div className="rounded-2xl bg-stone-50 p-4"><div className="flex items-center justify-between"><span className="text-sm text-stone-600">Eventos especiais</span><Sparkles className="text-amber-700" size={18} /></div><p className="mt-3 text-3xl font-bold text-stone-900">{special}</p></div>
          <div className="rounded-2xl bg-stone-50 p-4"><div className="flex items-center justify-between"><span className="text-sm text-stone-600">Cancelados</span><TrendingUp className="text-amber-700" size={18} /></div><p className="mt-3 text-3xl font-bold text-stone-900">{cancellations}</p></div>
        </div>
      </section>

      <section className="mt-8 rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-bold text-stone-900">{editingId ? 'Editar evento' : 'Criar evento'}</h2>
        <p className="mt-1 text-sm text-stone-600">As alterações publicadas serão usadas pela agenda pública do mesmo ambiente.</p>
        <form onSubmit={(event) => void saveDraft(event)} className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-stone-700">Título
            <input required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-stone-700">Categoria
            <select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as EventCategory })} className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2">
              <option value="routine">Rotina</option><option value="special">Especial</option><option value="cancellation">Cancelamento</option>
            </select>
          </label>
          <label className="text-sm font-medium text-stone-700">Estado
            <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as EventStatus })} className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2">
              <option value="scheduled">Agendado</option><option value="altered">Alterado</option><option value="cancelled">Cancelado</option>
            </select>
          </label>
          <label className="text-sm font-medium text-stone-700">Resumo
            <input value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-stone-700">Local
            <input value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-stone-700">Data inicial
            <input required type="date" value={draft.startDate} onChange={(event) => setDraft({ ...draft, startDate: event.target.value })} className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-stone-700">Data final
            <input required type="date" value={draft.endDate} onChange={(event) => setDraft({ ...draft, endDate: event.target.value })} className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-stone-700">Horário inicial
            <input required type="time" value={draft.startTime} onChange={(event) => setDraft({ ...draft, startTime: event.target.value })} className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-stone-700">Horário final
            <input required type="time" value={draft.endTime} onChange={(event) => setDraft({ ...draft, endTime: event.target.value })} className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2" />
          </label>
          <label className="flex items-center gap-2 text-sm text-stone-700"><input type="checkbox" checked={draft.published} onChange={(event) => setDraft({ ...draft, published: event.target.checked })} /> Publicar na agenda</label>
          <div className="flex gap-2 md:justify-end">
            {editingId && <button type="button" onClick={() => { setEditingId(null); setDraft(createEmptyEvent()) }} className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700">Cancelar edição</button>}
            <button disabled={saving} type="submit" className="rounded-full bg-amber-700 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Salvando...' : editingId ? 'Salvar edição' : 'Criar evento'}</button>
          </div>
        </form>
      </section>

      <section className="mt-8 rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-stone-900"><ShieldCheck className="text-amber-700" size={20} /><h2 className="text-2xl font-bold">Eventos cadastrados</h2></div>
        {loading ? <p role="status" className="text-sm text-stone-600">Carregando eventos...</p> : events.length === 0 ? <p className="rounded-2xl bg-stone-50 p-4 text-sm text-stone-600">Nenhum evento cadastrado.</p> : (
          <div className="space-y-3">
            {events.map((event) => (
              <article key={event.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div><h3 className="text-lg font-semibold text-stone-900">{event.title}</h3><p className="text-sm text-stone-600">{event.startDate}{event.endDate !== event.startDate ? ` a ${event.endDate}` : ''} • {event.startTime}–{event.endTime}</p><p className="text-xs text-stone-500">{event.status === 'cancelled' ? 'Cancelado' : event.status === 'altered' ? 'Alterado' : 'Agendado'} · {event.published ? 'Publicado' : 'Rascunho'}</p></div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => editEvent(event)} className="rounded-full border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700">Editar</button>
                    <button type="button" onClick={() => void updateEvent(event, { published: !event.published }, event.published ? 'Evento despublicado.' : 'Evento publicado.')} className="rounded-full border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-800">{event.published ? 'Despublicar' : 'Publicar'}</button>
                    <button type="button" onClick={() => void updateEvent(event, { status: event.status === 'cancelled' ? 'scheduled' : 'cancelled' as EventStatus }, event.status === 'cancelled' ? 'Evento reativado.' : 'Evento cancelado.')} className="rounded-full border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-800">{event.status === 'cancelled' ? 'Reativar' : 'Cancelar'}</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

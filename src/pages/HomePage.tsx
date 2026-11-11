import { ArrowRight, BookHeart, CalendarClock, MapPin, Sparkles, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getFutureEvents, siteInfo } from '../data/site'
import { usePublicEvents } from '../hooks/usePublicEvents'

const highlights = [
  { label: 'Participação', value: 'Gratuita', icon: Sparkles },
  { label: 'Público', value: '6 a 16 anos', icon: Users },
  { label: 'Encontros', value: 'Terças e quintas', icon: CalendarClock },
  { label: 'Local', value: 'Ipase', icon: MapPin },
]

const steps = [
  'Escolhemos livros e histórias que inspiram a leitura em grupo.',
  'Leitura compartilhada, rodas de conversa e troca de obras.',
  'Apoio comunitário para fortalecer o hábito de leitura e a convivência.',
]

export function HomePage() {
  const { events, loading, error } = usePublicEvents()
  const upcoming = getFutureEvents(events).slice(0, 3)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="grid items-center gap-8 rounded-[2rem] border border-amber-100 bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50 p-6 shadow-sm md:p-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="mb-4 inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">
            Literatura e comunidade
          </div>
          <h1 className="max-w-xl text-4xl font-black tracking-tight text-stone-900 md:text-5xl">
            Incentivando a leitura com acolhimento, cultura e pertencimento.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-stone-600">
            O Ipase das Letras organiza encontros de leitura, compartilhamento e troca de livros para crianças, adolescentes e famílias do bairro Ipase.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/calendario"
              className="inline-flex items-center gap-2 rounded-full bg-amber-700 px-5 py-3 font-medium text-white shadow-sm transition hover:bg-amber-800"
            >
              Ver calendário <ArrowRight size={18} />
            </Link>
            <Link
              to="/contato"
              className="inline-flex items-center rounded-full border border-stone-300 bg-white px-5 py-3 font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-100"
            >
              Falar no WhatsApp
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 rounded-full bg-stone-100 px-3 py-2 text-sm font-medium text-stone-800">
            <BookHeart className="text-amber-700" size={18} />
            Projeto em andamento
          </div>
          <div className="mt-5 space-y-4">
            {highlights.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-500">{label}</p>
                  <p className="mt-1 text-base font-semibold text-stone-800">{value}</p>
                </div>
                <div className="rounded-full bg-amber-100 p-2 text-amber-700">
                  <Icon size={18} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-3">
        {steps.map((step, index) => (
          <div key={step} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 font-bold text-amber-800">
              {index + 1}
            </div>
            <p className="text-base text-stone-700">{step}</p>
          </div>
        ))}
      </section>

      <section className="mt-14 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-700">Próximos encontros</p>
            <h2 className="mt-2 text-3xl font-bold text-stone-900">Agenda pública</h2>
          </div>
          <Link to="/calendario" className="text-sm font-semibold text-amber-800 hover:text-amber-900">
            Ver agenda completa
          </Link>
        </div>

        {error && <p role="alert" className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {loading ? (
          <p role="status" className="text-sm text-stone-600">Carregando próximos encontros...</p>
        ) : upcoming.length === 0 ? (
          <p className="rounded-2xl bg-stone-50 p-4 text-sm text-stone-600">Não há próximos encontros publicados.</p>
        ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {upcoming.map((event) => (
            <article key={event.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                event.category === 'routine'
                  ? 'bg-emerald-100 text-emerald-800'
                  : event.category === 'special'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
              }`}>
                {event.category === 'routine' ? 'Rotina' : event.category === 'special' ? 'Especial' : 'Cancelado'}
              </span>
              <h3 className="mt-3 text-xl font-semibold text-stone-900">{event.title}</h3>
              <p className="mt-2 text-sm text-stone-600">{event.summary}</p>
              <div className="mt-4 space-y-1 text-sm text-stone-500">
                <p>{event.startDate} • {event.startTime} às {event.endTime}</p>
                <p>{siteInfo.address}</p>
              </div>
            </article>
          ))}
        </div>
        )}
      </section>
    </div>
  )
}

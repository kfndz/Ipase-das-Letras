import { MapPin, MessageCircle, PhoneCall } from 'lucide-react'
import { siteInfo } from '../data/site'

export function ContactPage() {
  const whatsappLink = `https://wa.me/${siteInfo.whatsappNumber}`

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-700">Contato</p>
        <h1 className="mt-2 text-4xl font-black text-stone-900">Fale com o projeto</h1>
        <p className="mt-4 max-w-2xl text-lg text-stone-600">
          Se você deseja conhecer as atividades, saber mais sobre as reuniões ou apoiar a iniciativa, estamos à disposição pelo WhatsApp e por contato direto.
        </p>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-stone-200 bg-stone-50 p-5 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <MessageCircle size={22} />
          </div>
          <h2 className="text-xl font-semibold text-stone-900">WhatsApp oficial</h2>
          <p className="mt-2 text-stone-600">Contato autorizado para divulgação e informações gerais.</p>
          <a href={whatsappLink} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-full bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700">
            Abrir conversa
          </a>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-stone-50 p-5 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <PhoneCall size={22} />
          </div>
          <h2 className="text-xl font-semibold text-stone-900">Informações</h2>
          <ul className="mt-3 space-y-3 text-stone-600">
            <li className="flex items-start gap-3"><MapPin className="mt-0.5 text-amber-700" size={18} /> <span>{siteInfo.address}</span></li>
          </ul>
        </div>
      </section>
    </div>
  )
}

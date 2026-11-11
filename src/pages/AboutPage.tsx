import { Award, BookHeart, Building2, HeartHandshake, Users } from 'lucide-react'

const pillars = [
  {
    title: 'Leitura e acolhimento',
    text: 'Promovemos encontros em que as pessoas se sentem bem-vindas para explorar histórias, questionar, refletir e compartilhar ideias.',
    icon: HeartHandshake,
  },
  {
    title: 'Comunidade local',
    text: 'A experiência fortalece a convivência entre crianças, adolescentes e famílias, respeitando a diversidade e o tempo de cada um.',
    icon: Users,
  },
  {
    title: 'Cultura e educação',
    text: 'A leitura é entendida como ferramenta de aprendizagem, criatividade, inclusão e desenvolvimento social.',
    icon: BookHeart,
  },
]

export function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">Sobre o projeto</p>
        <h1 className="mt-3 text-4xl font-black text-stone-900">Um espaço de leitura, convivência e cultura.</h1>
        <p className="mt-4 max-w-3xl text-lg text-stone-600">
          O Ipase das Letras nasceu como uma resposta concreta para ampliar o acesso à leitura em um contexto de protagonismo comunitário. O objetivo é incentivar o gosto pela literatura e a troca de saberes em um ambiente afetuoso e acessível.
        </p>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {pillars.map(({ title, text, icon: Icon }) => (
          <article key={title} className="rounded-3xl border border-stone-200 bg-stone-50 p-5 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Icon size={22} />
            </div>
            <h2 className="text-xl font-semibold text-stone-900">{title}</h2>
            <p className="mt-3 text-stone-600">{text}</p>
          </article>
        ))}
      </section>

      <section className="mt-12 grid gap-6 rounded-[2rem] border border-stone-200 bg-gradient-to-br from-stone-900 to-stone-700 p-6 text-white shadow-sm md:grid-cols-2 md:p-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200">Contexto</p>
          <h2 className="mt-2 text-3xl font-bold">Extensão com impacto social.</h2>
        </div>
        <div className="space-y-4 text-stone-200">
          <div className="flex gap-3">
            <Building2 className="mt-0.5 text-amber-300" />
            <p>Projeto vinculado a ações de extensão cultural, em parceria com a comunidade e com foco em leitura, formação e acessibilidade.
            </p>
          </div>
          <div className="flex gap-3">
            <Award className="mt-0.5 text-amber-300" />
            <p>Tratamos a literatura como parte da vida cotidiana, fortalecendo autonomia, criatividade e circulação de conhecimentos.</p>
          </div>
        </div>
      </section>
    </div>
  )
}

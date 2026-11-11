import { BookOpenText, CalendarDays, House, Menu, ShieldCheck, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Início', icon: House },
  { to: '/sobre', label: 'Sobre', icon: BookOpenText },
  { to: '/calendario', label: 'Calendário', icon: CalendarDays },
  { to: '/contato', label: 'Contato', icon: Sparkles },
  { to: '/admin', label: 'Admin', icon: ShieldCheck },
]

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const linkClassName = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition ${
      isActive
        ? 'bg-amber-700 text-white shadow-sm'
        : 'text-stone-600 hover:bg-stone-200 hover:text-stone-900'
    }`

  return (
    <div className="min-h-screen bg-stone-50 text-slate-800">
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-stone-50/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <NavLink to="/" className="flex items-center gap-3 font-medium text-stone-900" onClick={() => setIsMenuOpen(false)}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-800 shadow-sm">
              <BookOpenText size={18} />
            </div>
            <div>
              <p className="text-lg font-semibold">Ipase das Letras</p>
              <p className="text-xs text-stone-500">Projeto comunitário</p>
            </div>
          </NavLink>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={linkClassName}>
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 md:hidden"
          >
            {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {isMenuOpen && (
          <nav className="border-t border-stone-200 bg-white px-4 py-3 md:hidden">
            <div className="flex flex-col gap-2">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium ${
                      isActive
                        ? 'bg-amber-700 text-white'
                        : 'bg-stone-100 text-stone-700'
                    }`
                  }
                >
                  <Icon size={16} />
                  {label}
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main>{children}</main>
    </div>
  )
}

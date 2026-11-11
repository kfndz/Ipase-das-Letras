import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { eventMatchesDate } from './utils/dateUtils'
import { CalendarPage } from './pages/CalendarPage'
import { DemoRepository } from './services/repositories'
import type { LiteracyEvent } from './types'

beforeEach(() => {
  window.localStorage.clear()
  window.sessionStorage.clear()
  vi.stubEnv('VITE_APP_MODE', 'demo')
  vi.stubEnv('VITE_ENABLE_ADMIN_PROTOTYPE', 'true')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('App shell', () => {
  it('renders the home page hero heading on the landing page', () => {
    window.history.pushState({}, '', '/')
    render(<App />)

    expect(
      screen.getByRole('heading', {
        name: /incentivando a leitura com acolhimento, cultura e pertencimento/i,
      }),
    ).toBeInTheDocument()
  })

  it('shows the admin login view on the admin route', () => {
    window.history.pushState({}, '', '/admin')
    render(<App />)

    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument()
  })

  it('enters the demo dashboard directly from the demo access button', async () => {
    const user = userEvent.setup()
    window.history.pushState({}, '', '/admin')
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Entrar na demonstração' }))
    expect(await screen.findByRole('heading', { name: /bem-vindo, admin@ipase\.local/i })).toBeInTheDocument()
  })

  it('matches event dates across a multi-day range', () => {
    const event: LiteracyEvent = {
      id: 'range-1',
      title: 'Leitura especial',
      summary: 'Evento durante vários dias',
      category: 'special',
      status: 'scheduled',
      published: true,
      startDate: '2026-11-10',
      endDate: '2026-11-19',
      startTime: '18:30',
      endTime: '21:00',
      location: 'Ipase',
    }

    expect(eventMatchesDate(new Date('2026-11-12T12:00:00'), event)).toBe(true)
    expect(eventMatchesDate(new Date('2026-11-20T12:00:00'), event)).toBe(false)
  })

  it('updates the public calendar after saving a published demo event', async () => {
    window.localStorage.setItem('ipase-calendar-month', '2099-12-01T12:00:00.000Z')
    render(<MemoryRouter><CalendarPage /></MemoryRouter>)
    await waitFor(() => expect(screen.queryByText('Carregando calendário...')).not.toBeInTheDocument())

    await act(async () => {
      await new DemoRepository().saveEvent({
        id: 'published-calendar-test',
        title: 'Evento de calendário compartilhado',
        summary: 'Teste de fonte única',
        category: 'special',
        status: 'scheduled',
        published: true,
        startDate: '2099-12-29',
        endDate: '2099-12-30',
        startTime: '19:00',
        endTime: '21:00',
        location: 'Ipase',
      })
    })

    expect(await screen.findAllByText('Evento de calendário compartilhado')).not.toHaveLength(0)
  })

  it('shows an empty state when the demo has no saved events', async () => {
    window.localStorage.setItem('ipase-demo-events', '[]')
    render(<MemoryRouter><CalendarPage /></MemoryRouter>)
    expect(await screen.findByText('Não há eventos publicados para este filtro.')).toBeInTheDocument()
  })

  it('opens the mobile navigation and reaches the calendar', async () => {
    const user = userEvent.setup()
    window.history.pushState({}, '', '/')
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Abrir menu' }))
    expect(screen.getByRole('button', { name: 'Fechar menu' })).toHaveAttribute('aria-expanded', 'true')

    const calendarLinks = screen.getAllByRole('link', { name: /calendário/i })
    await user.click(calendarLinks[calendarLinks.length - 1])
    expect(await screen.findByRole('heading', { name: 'Calendário de atividades' })).toBeInTheDocument()
  })
})

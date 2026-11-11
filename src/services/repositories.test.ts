import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DemoRepository, SupabaseRepository } from './repositories'
import type { LiteracyEvent } from '../types'

const mocks = vi.hoisted(() => ({ createClient: vi.fn() }))
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }))

const makeEvent = (overrides: Partial<LiteracyEvent> = {}): LiteracyEvent => ({
  id: 'demo-test-event',
  title: 'Evento de teste',
  summary: 'Teste local',
  category: 'special',
  status: 'scheduled',
  published: true,
  startDate: '2027-02-02',
  endDate: '2027-02-03',
  startTime: '19:00',
  endTime: '21:00',
  location: 'Ipase',
  ...overrides,
})

describe('event repositories', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    vi.stubEnv('VITE_APP_MODE', 'demo')
    vi.stubEnv('VITE_ENABLE_ADMIN_PROTOTYPE', 'true')
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')
    mocks.createClient.mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('persists demo event creation, edit, publication state and cancellation in local storage', async () => {
    const firstRepository = new DemoRepository()
    await firstRepository.saveEvent(makeEvent())

    const afterReload = new DemoRepository()
    expect((await afterReload.listEvents()).find((event) => event.id === 'demo-test-event')?.title).toBe('Evento de teste')

    await afterReload.saveEvent(makeEvent({ title: 'Evento alterado', status: 'cancelled', published: false }))
    expect(await new DemoRepository().listEvents({ publishedOnly: true })).not.toContainEqual(
      expect.objectContaining({ id: 'demo-test-event' }),
    )
    expect((await new DemoRepository().listEvents()).find((event) => event.id === 'demo-test-event')).toMatchObject({
      title: 'Evento alterado',
      status: 'cancelled',
      published: false,
    })
  })

  it('publishes an update notification consumed by public event subscribers', async () => {
    const repository = new DemoRepository()
    const listener = vi.fn()
    const unsubscribe = repository.subscribe(listener)
    await repository.saveEvent(makeEvent())
    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
  })

  it('does not access Supabase when operating on demo data', async () => {
    await new DemoRepository().saveEvent(makeEvent())
    expect(mocks.createClient).not.toHaveBeenCalled()
    expect(window.localStorage.getItem('ipase-demo-events')).toContain('demo-test-event')
  })

  it('surfaces Supabase query failures instead of returning success-shaped empty data', async () => {
    const query = {
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: (resolve: (result: { data: null; error: { message: string } }) => unknown) =>
        Promise.resolve(resolve({ data: null, error: { message: 'permission denied' } })),
    }
    mocks.createClient.mockReturnValue({
      from: vi.fn(() => ({ select: vi.fn(() => query) })),
    })
    vi.stubEnv('VITE_SUPABASE_URL', 'https://project.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-anon-key')

    await expect(new SupabaseRepository().listEvents({ publishedOnly: true })).rejects.toThrow('permission denied')
  })
})

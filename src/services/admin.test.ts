import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearSession, signInAdmin, verifySession } from './admin'

const mocks = vi.hoisted(() => ({ createClient: vi.fn() }))
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }))

describe('admin access by application mode', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    vi.stubEnv('VITE_APP_MODE', 'demo')
    vi.stubEnv('VITE_ENABLE_ADMIN_PROTOTYPE', 'true')
    vi.stubEnv('VITE_ADMIN_PROTOTYPE_EMAIL', 'demo@example.test')
    vi.stubEnv('VITE_ADMIN_PROTOTYPE_PASSWORD', 'demo-password')
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')
    mocks.createClient.mockReset()
  })

  afterEach(() => {
    clearSession()
    vi.unstubAllEnvs()
  })

  it('accepts demo credentials only in demo mode and does not contact Supabase', async () => {
    const session = await signInAdmin(' DEMO@example.test ', 'demo-password')
    expect(session.mode).toBe('demo')
    expect(await verifySession()).toEqual(session)
    expect(mocks.createClient).not.toHaveBeenCalled()
  })

  it('does not reuse a demo session after switching to Supabase mode', async () => {
    await signInAdmin('demo@example.test', 'demo-password')
    vi.stubEnv('VITE_APP_MODE', 'supabase')
    vi.stubEnv('VITE_SUPABASE_URL', 'https://project.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key')
    mocks.createClient.mockReturnValue({
      auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }) },
    })

    expect(await verifySession()).toBeNull()
  })

  it('rejects authenticated users absent from the database administrator list', async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null })
    mocks.createClient.mockReturnValue({
      auth: { signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-id', email: 'not-admin@example.test' } },
        error: null,
      }), signOut },
      rpc: vi.fn().mockResolvedValue({ data: false, error: null }),
    })
    vi.stubEnv('VITE_APP_MODE', 'supabase')
    vi.stubEnv('VITE_SUPABASE_URL', 'https://project.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key')

    await expect(signInAdmin('not-admin@example.test', 'password123')).rejects.toThrow('não está autorizado')
    expect(signOut).toHaveBeenCalledOnce()
  })

  it('rejects access when the database authorization check fails', async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null })
    mocks.createClient.mockReturnValue({
      auth: { signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-id', email: 'admin@example.test' } },
        error: null,
      }), signOut },
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: 'database unavailable' } }),
    })
    vi.stubEnv('VITE_APP_MODE', 'supabase')
    vi.stubEnv('VITE_SUPABASE_URL', 'https://project.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key')

    await expect(signInAdmin('admin@example.test', 'password123')).rejects.toThrow('database unavailable')
    expect(signOut).toHaveBeenCalledOnce()
  })
})

import type { AdminSession, AppMode } from '../types'

const STORAGE_KEY = 'ipase-admin-session'

export const getAppMode = (): AppMode => {
  const configuredMode = import.meta.env.VITE_APP_MODE?.toLowerCase()
  if (configuredMode === 'demo' || configuredMode === 'supabase') {
    return configuredMode
  }

  return import.meta.env.DEV ? 'demo' : 'supabase'
}

export const isDemoMode = () => getAppMode() === 'demo'
export const isSupabaseMode = () => getAppMode() === 'supabase'

export const isPrototypeMode = (): boolean =>
  isDemoMode() &&
  (import.meta.env.VITE_ENABLE_ADMIN_PROTOTYPE === 'true' ||
    import.meta.env.VITE_ENABLE_ADMIN_PROTOTYPE === true)

export const getDemoCredentials = () => ({
  email: (import.meta.env.VITE_ADMIN_PROTOTYPE_EMAIL ?? 'admin@ipase.local').trim().toLowerCase(),
  password: import.meta.env.VITE_ADMIN_PROTOTYPE_PASSWORD ?? 'ipase2026',
})

export const isSupabaseConfigured = () =>
  Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

export const readStoredSession = (): AdminSession | null => {
  const value = window.sessionStorage.getItem(STORAGE_KEY)
  if (!value) return null

  try {
    const parsed = JSON.parse(value) as Partial<AdminSession>
    if (parsed.email && parsed.role === 'admin' && (parsed.mode === 'demo' || parsed.mode === 'supabase')) {
      return { email: parsed.email, role: 'admin', mode: parsed.mode }
    }
  } catch {
    window.sessionStorage.removeItem(STORAGE_KEY)
  }

  return null
}

const persistSession = (session: AdminSession) => {
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export const clearSession = () => {
  window.sessionStorage.removeItem(STORAGE_KEY)
}

const createSupabaseClient = async () => {
  if (!isSupabaseConfigured()) {
    throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para acessar o modo de produção.')
  }

  const { createClient } = await import('@supabase/supabase-js')
  return createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
}

const isAuthorizedAdmin = async (supabase: Awaited<ReturnType<typeof createSupabaseClient>>) => {
  const { data, error } = await supabase.rpc('is_admin')
  if (error) {
    throw new Error(`Não foi possível verificar a autorização administrativa: ${error.message}`)
  }
  return data === true
}

export async function verifySession(): Promise<AdminSession | null> {
  if (isSupabaseMode()) {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase.auth.getSession()
    if (error) throw new Error(`Não foi possível verificar a sessão: ${error.message}`)

    const user = data.session?.user
    if (!user?.email) {
      clearSession()
      return null
    }

    if (!(await isAuthorizedAdmin(supabase))) {
      await supabase.auth.signOut()
      clearSession()
      return null
    }

    const session: AdminSession = { email: user.email, role: 'admin', mode: 'supabase' }
    persistSession(session)
    return session
  }

  const session = readStoredSession()
  if (isPrototypeMode() && session?.mode === 'demo') return session
  clearSession()
  return null
}

export async function signOutAdmin(): Promise<void> {
  const session = readStoredSession()
  clearSession()

  if (session?.mode === 'supabase' && isSupabaseMode() && isSupabaseConfigured()) {
    const supabase = await createSupabaseClient()
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(`Não foi possível encerrar a sessão: ${error.message}`)
  }
}

export async function signInAdmin(email: string, password: string): Promise<AdminSession> {
  const normalizedEmail = email.trim().toLowerCase()

  if (isSupabaseMode()) {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password })

    if (error || !data.user) {
      throw new Error(error?.message ?? 'Credenciais inválidas.')
    }

    let authorized = false
    try {
      authorized = await isAuthorizedAdmin(supabase)
    } catch (authorizationError) {
      await supabase.auth.signOut()
      throw authorizationError
    }

    if (!authorized) {
      await supabase.auth.signOut()
      throw new Error('Este usuário não está autorizado para acessar o painel administrativo.')
    }

    const session: AdminSession = {
      email: data.user.email ?? normalizedEmail,
      role: 'admin',
      mode: 'supabase',
    }
    persistSession(session)
    return session
  }

  if (!isPrototypeMode()) {
    throw new Error('O acesso simplificado está desabilitado. Em produção, configure o Supabase.')
  }

  const credentials = getDemoCredentials()
  if (normalizedEmail !== credentials.email || password !== credentials.password) {
    throw new Error('Credenciais inválidas para a demonstração.')
  }

  const session: AdminSession = { email: credentials.email, role: 'admin', mode: 'demo' }
  persistSession(session)
  return session
}

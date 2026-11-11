import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { getAppMode, getDemoCredentials, isDemoMode, isPrototypeMode, isSupabaseConfigured, signInAdmin } from '../services/admin'

const loginSchema = z.object({
  email: z.string().min(1, 'Informe o e-mail do administrador.').email('E-mail inválido.'),
  password: z.string().min(8, 'A senha deve conter ao menos 8 caracteres.'),
})

type LoginValues = z.infer<typeof loginSchema>

export function AdminLoginPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const appMode = getAppMode()
  const demoCredentials = isPrototypeMode() ? getDemoCredentials() : null

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: demoCredentials?.email ?? '',
      password: demoCredentials?.password ?? '',
    },
  })

  const onSubmit = async (values: LoginValues) => {
    setSubmitting(true)
    setError('')

    try {
      await signInAdmin(values.email, values.password)
      navigate('/admin/dashboard')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Falha na autenticação.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDemoAccess = async () => {
    const credentials = getDemoCredentials()
    setValue('email', credentials.email)
    setValue('password', credentials.password)
    setError('')
    setSubmitting(true)

    try {
      await signInAdmin(credentials.email, credentials.password)
      navigate('/admin/dashboard')
    } catch (demoError) {
      setError(demoError instanceof Error ? demoError.message : 'Não foi possível iniciar a demonstração.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-md rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">Área administrativa</p>
            <h1 className="mt-1 text-2xl font-black text-stone-900">Login</h1>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between gap-2 rounded-full border border-stone-200 bg-stone-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-700">
          <span>{isDemoMode() ? 'Modo demonstração' : 'Modo produção'}</span>
          <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] text-amber-800">
            {appMode}
          </span>
        </div>

        {!isSupabaseConfigured() && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {isPrototypeMode()
              ? 'Acesso demonstrativo local. Os dados ficam neste navegador e não representam autenticação segura.'
              : 'O modo de produção requer VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY. Falhas não ativam o modo demonstração.'}
          </div>
        )}

        {isPrototypeMode() && (
          <button
            type="button"
            onClick={handleDemoAccess}
            className="mb-4 w-full rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
          >
            Entrar na demonstração
          </button>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-stone-700">E-mail</label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-3 py-3 text-stone-800 outline-none ring-0 transition focus:border-amber-500 focus:bg-white"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-stone-700">Senha</label>
            <input
              id="password"
              type="password"
              {...register('password')}
              className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-3 py-3 text-stone-800 outline-none ring-0 transition focus:border-amber-500 focus:bg-white"
            />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="mt-0.5" size={16} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-amber-700 px-4 py-3 font-semibold text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:bg-amber-400"
          >
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

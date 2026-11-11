import { type ReactNode, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AboutPage } from './pages/AboutPage'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { AdminLoginPage } from './pages/AdminLoginPage'
import { CalendarPage } from './pages/CalendarPage'
import { ContactPage } from './pages/ContactPage'
import { HomePage } from './pages/HomePage'
import { readStoredSession, verifySession } from './services/admin'

function AdminRoute({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(() => readStoredSession())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const validateSession = async () => {
      try {
        const verifiedSession = await verifySession()

        if (active) {
          setSession(verifiedSession)
          setLoading(false)
        }
      } catch {
        if (active) {
          setSession(null)
          setLoading(false)
        }
      }
    }

    void validateSession()

    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return <div className="px-4 py-10 text-center text-sm font-medium text-stone-600">Verificando acesso administrativo...</div>
  }

  if (!session) {
    return <Navigate to="/admin" replace />
  }

  return children
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/sobre" element={<AboutPage />} />
          <Route path="/calendario" element={<CalendarPage />} />
          <Route path="/contato" element={<ContactPage />} />
          <Route path="/admin" element={<AdminLoginPage />} />
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App

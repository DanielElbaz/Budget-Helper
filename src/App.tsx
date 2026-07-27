import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Budgets from './pages/Budgets'
import Categories from './pages/Categories'
import Login from './pages/Login'
import { ensureDefaultCategories, generateRecurringOccurrences } from './lib/data'
import { LangProvider } from './lib/i18n'
import { AuthProvider, useAuth } from './lib/auth'

function AuthGate() {
  const { session, loading } = useAuth()

  useEffect(() => {
    if (!session) return
    ensureDefaultCategories().then(() => generateRecurringOccurrences())
  }, [session])

  if (loading) return null
  if (!session) return <Login />

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/budgets" element={<Budgets />} />
        <Route path="/categories" element={<Categories />} />
      </Routes>
    </Layout>
  )
}

function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </LangProvider>
  )
}

export default App

import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Budgets from './pages/Budgets'
import Categories from './pages/Categories'
import { ensureDefaultCategories } from './lib/db'
import { LangProvider } from './lib/i18n'

function App() {
  useEffect(() => {
    ensureDefaultCategories()
  }, [])

  return (
    <LangProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/categories" element={<Categories />} />
        </Routes>
      </Layout>
    </LangProvider>
  )
}

export default App

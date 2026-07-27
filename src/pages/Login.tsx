import { useState } from 'react'
import { Button, Card, Input, Label } from '../components/ui'
import { useAuth } from '../lib/auth'
import { useLang } from '../lib/i18n'

export default function Login() {
  const { signIn } = useAuth()
  const { t } = useLang()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    const { error: signInError } = await signIn(code)
    setSubmitting(false)
    if (signInError) setError(`${t('loginError')} (${signInError})`)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="text-4xl">💰</span>
          <h1 className="mt-2 text-xl font-bold text-purple-950">{t('loginTitle')}</h1>
          <p className="mt-1 text-sm text-purple-400">{t('loginSubtitle')}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t('loginCodeLabel')}</Label>
            <Input
              type="password"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={submitting || !code}>
            {submitting ? t('loginLoading') : t('loginButton')}
          </Button>
        </form>
      </Card>
    </div>
  )
}

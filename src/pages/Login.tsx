import { useState } from 'react'
import { Lock, Wallet } from 'lucide-react'
import { Button, Card, Field, Input } from '../components/ui'
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
      <Card className="w-full max-w-sm p-6 sm:p-6">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <Wallet className="h-7 w-7" aria-hidden />
          </span>
          <h1 className="mt-4 text-xl font-bold text-ink">{t('loginTitle')}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t('loginSubtitle')}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label={t('loginCodeLabel')}>
            {(id) => (
              <Input
                id={id}
                type="password"
                autoComplete="current-password"
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value)}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'login-error' : undefined}
              />
            )}
          </Field>
          {error && (
            <p id="login-error" role="alert" className="text-sm font-medium text-red-600">
              {error}
            </p>
          )}
          <Button type="submit" icon={Lock} className="w-full" disabled={submitting || !code}>
            {submitting ? t('loginLoading') : t('loginButton')}
          </Button>
        </form>
      </Card>
    </div>
  )
}

import { CheckCircle2, AlertCircle } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useLang } from '../lib/i18n'
import { Button } from './ui'

type Toast = { id: number; kind: 'success' | 'error'; text: string }
type ConfirmRequest = { title: string; body?: string; confirmLabel: string; resolve: (ok: boolean) => void }

interface FeedbackContextValue {
  toast: (kind: Toast['kind'], text: string) => void
  confirm: (opts: { title: string; body?: string; confirmLabel?: string }) => Promise<boolean>
  /** Runs a save/delete, shows a success toast, or an error toast if it fails. Returns true on success. */
  run: (action: () => Promise<unknown>, successText?: string) => Promise<boolean>
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null)

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const { t } = useLang()
  const [toasts, setToasts] = useState<Toast[]>([])
  const [request, setRequest] = useState<ConfirmRequest | null>(null)
  const nextId = useRef(0)

  const toast = useCallback((kind: Toast['kind'], text: string) => {
    const id = nextId.current++
    setToasts((list) => [...list, { id, kind, text }])
    setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), kind === 'error' ? 5000 : 2500)
  }, [])

  const confirm = useCallback(
    (opts: { title: string; body?: string; confirmLabel?: string }) =>
      new Promise<boolean>((resolve) => setRequest({ ...opts, confirmLabel: opts.confirmLabel ?? t('deleteButton'), resolve })),
    [t],
  )

  const run = useCallback(
    async (action: () => Promise<unknown>, successText?: string) => {
      try {
        await action()
        if (successText) toast('success', successText)
        return true
      } catch (err) {
        console.error(err)
        toast('error', t('toastError'))
        return false
      }
    },
    [toast, t],
  )

  function answer(ok: boolean) {
    request?.resolve(ok)
    setRequest(null)
  }

  return (
    <FeedbackContext.Provider value={{ toast, confirm, run }}>
      {children}

      {request && <ConfirmDialog request={request} onAnswer={answer} cancelLabel={t('cancelButton')} />}

      <div
        className="pointer-events-none fixed inset-x-0 top-[max(1rem,env(safe-area-inset-top))] z-[70] flex flex-col items-center gap-2 px-4"
        role="status"
        aria-live="polite"
      >
        {toasts.map((x) => (
          <div
            key={x.id}
            className={`animate-sheet pointer-events-auto flex max-w-sm items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
              x.kind === 'success' ? 'bg-slate-900 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {x.kind === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden /> : <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />}
            {x.text}
          </div>
        ))}
      </div>
    </FeedbackContext.Provider>
  )
}

function ConfirmDialog({
  request,
  onAnswer,
  cancelLabel,
}: {
  request: ConfirmRequest
  onAnswer: (ok: boolean) => void
  cancelLabel: string
}) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    // Focus the safe choice first; Escape cancels.
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onAnswer(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onAnswer])

  return (
    <div className="animate-fade fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 p-4 sm:items-center" onClick={() => onAnswer(false)}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby={request.body ? 'confirm-body' : undefined}
        className="animate-sheet w-full max-w-sm rounded-2xl bg-surface p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-title" className="text-lg font-semibold text-ink">
          {request.title}
        </h3>
        {request.body && (
          <p id="confirm-body" className="mt-1 text-sm text-ink-muted">
            {request.body}
          </p>
        )}
        <div className="mt-5 flex gap-2">
          <Button ref={cancelRef} variant="secondary" className="flex-1" onClick={() => onAnswer(false)}>
            {cancelLabel}
          </Button>
          <Button variant="danger" className="flex-1" onClick={() => onAnswer(true)}>
            {request.confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext)
  if (!ctx) throw new Error('useFeedback must be used within FeedbackProvider')
  return ctx
}

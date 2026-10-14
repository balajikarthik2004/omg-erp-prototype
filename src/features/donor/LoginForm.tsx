import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Apple, ArrowRight, Mail, Phone, RotateCcw } from 'lucide-react'

import { toast } from '@/lib/toast'
import { api } from '@/mock/api'
import { useSession } from '@/store/session'

function GoogleIcon() {
  return (
    <svg className="size-4.5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  )
}

const FIELD =
  'w-full rounded-xl border border-sandal-200 bg-sandal-100/70 px-3.5 py-3 text-sm font-medium text-stone-900 placeholder:text-stone-500/70 transition-all focus:border-navy-400 focus:bg-sandal-50 focus:outline-none focus:ring-2 focus:ring-navy-400/30'

const SUBMIT =
  'group flex w-full items-center justify-center gap-2.5 rounded-xl bg-kumkum-600 px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-kumkum-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2 active:bg-kumkum-800 disabled:opacity-60'

/** Mock OTP sign-in. Prototype code is 108108 — there is no real auth here. */
export function LoginForm() {
  const navigate = useNavigate()
  const signIn = useSession((s) => s.signIn)
  const [mode, setMode] = useState<'phone' | 'email'>('phone')
  const [step, setStep] = useState<'contact' | 'otp'>('contact')
  const [contact, setContact] = useState('')
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  async function handleSendOtp(e?: React.FormEvent) {
    if (e) e.preventDefault()
    const cleaned = contact.trim()
    if (mode === 'phone' && cleaned.replace(/\D/g, '').length < 10) {
      setError('Enter a 10-digit mobile number')
      return
    }
    if (mode === 'email' && (!cleaned.includes('@') || cleaned.length < 5)) {
      setError('Enter a valid email address, like devotee@example.com')
      return
    }

    setError(undefined)
    setBusy(true)
    await api.process(800)
    setBusy(false)
    setStep('otp')
    toast.info('Verification code sent', 'Use code 108108 to verify. (Prototype mode)')
  }

  async function handleVerifyOtp(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (otp.replace(/\s/g, '') !== '108108') {
      setError('That code does not match. In this prototype, use 108108.')
      return
    }

    setError(undefined)
    setBusy(true)
    await api.process(700)
    signIn()
    setBusy(false)
    toast.success('Welcome back, devotee', 'Your donation history and tax receipts are ready.')
    navigate('/my/donations')
  }

  async function handleSocialSignIn(provider: 'Google' | 'Apple') {
    setError(undefined)
    setBusy(true)
    await api.process(800)
    signIn()
    setBusy(false)
    toast.success(`Signed in with ${provider}`, 'Opening your devotee account...')
    navigate('/my/donations')
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-center font-display text-[26px] font-semibold leading-tight tracking-tight text-stone-900 sm:text-[30px]">
        {step === 'contact' ? 'Welcome back' : 'Verify your code'}
      </h1>
      <p className="mt-1.5 text-center text-sm text-stone-500">
        {step === 'contact'
          ? 'Sign in to follow your offerings and tax receipts.'
          : `Enter the 6-digit code sent to ${contact}.`}
      </p>

      {step === 'contact' ? (
        <>
          <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl border border-sandal-200 bg-sandal-100 p-1">
            {(['phone', 'email'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m)
                  setError(undefined)
                }}
                className={`flex items-center justify-center gap-2 rounded-lg py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  mode === m
                    ? 'bg-sandal-50 text-navy-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                {m === 'phone' ? <Phone className="size-3.5" /> : <Mail className="size-3.5" />}
                <span>{m === 'phone' ? 'Mobile' : 'Email'}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSendOtp} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="login-contact"
                className="block text-[11px] font-bold uppercase tracking-[0.06em] text-stone-700"
              >
                {mode === 'phone' ? 'Mobile number' : 'Email address'}
              </label>
              <input
                id="login-contact"
                type={mode === 'phone' ? 'tel' : 'email'}
                autoFocus
                autoComplete={mode === 'phone' ? 'tel' : 'email'}
                placeholder={mode === 'phone' ? '98765 43210' : 'devotee@example.com'}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                aria-invalid={!!error}
                className={`mt-1.5 ${FIELD}`}
              />
              {error && <p className="mt-1.5 text-xs font-semibold text-danger-600">{error}</p>}
            </div>

            <button type="submit" disabled={busy} className={SUBMIT}>
              <span>{busy ? 'Sending code...' : 'Send verification code'}</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </form>
        </>
      ) : (
        <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="login-otp"
                className="text-[11px] font-bold uppercase tracking-[0.06em] text-stone-700"
              >
                6-digit code
              </label>
              <button
                type="button"
                onClick={() => {
                  setStep('contact')
                  setError(undefined)
                }}
                className="text-xs font-bold text-navy-600 transition-colors hover:text-kumkum-600"
              >
                Change {mode === 'phone' ? 'number' : 'email'}
              </button>
            </div>
            <input
              id="login-otp"
              type="text"
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="108108"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              aria-invalid={!!error}
              className={`mt-1.5 text-center font-mono text-[22px] font-bold tracking-[0.35em] tabular-nums ${FIELD}`}
            />
            {error && (
              <p className="mt-1.5 text-center text-xs font-semibold text-danger-600">{error}</p>
            )}
          </div>

          <button type="submit" disabled={busy} className={SUBMIT}>
            <span>{busy ? 'Verifying...' : 'Verify and sign in'}</span>
            <ArrowRight className="size-4" />
          </button>

          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-500">Didn&rsquo;t get the code?</span>
            <button
              type="button"
              onClick={() => void handleSendOtp()}
              className="inline-flex items-center gap-1 font-bold text-navy-600 hover:text-kumkum-600"
            >
              <RotateCcw className="size-3" />
              <span>Resend</span>
            </button>
          </div>
        </form>
      )}

      <div className="mt-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-sandal-200" aria-hidden />
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
          or continue with
        </span>
        <span className="h-px flex-1 bg-sandal-200" aria-hidden />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleSocialSignIn('Google')}
          className="flex items-center justify-center gap-2 rounded-xl border border-sandal-200 bg-sandal-50 px-4 py-2.5 text-xs font-bold text-stone-700 transition-colors hover:bg-sandal-100 disabled:opacity-60"
        >
          <GoogleIcon />
          <span>Google</span>
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleSocialSignIn('Apple')}
          className="flex items-center justify-center gap-2 rounded-xl border border-sandal-200 bg-sandal-50 px-4 py-2.5 text-xs font-bold text-stone-700 transition-colors hover:bg-sandal-100 disabled:opacity-60"
        >
          <Apple className="size-4.5" />
          <span>Apple</span>
        </button>
      </div>
    </div>
  )
}

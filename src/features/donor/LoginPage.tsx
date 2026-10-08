import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Apple, Globe, Mail, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from '@/lib/toast'
import { Divider, Kolam } from '@/components/ui/Ornament'
import { api } from '@/mock/api'
import { useSession } from '@/store/session'

export function LoginPage() {
  const navigate = useNavigate()
  const signIn = useSession((s) => s.signIn)
  const [step, setStep] = useState<'contact' | 'otp'>('contact')
  const [contact, setContact] = useState('')
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  async function sendOtp() {
    if (contact.trim().length < 5) {
      setError('Enter the email address or phone number you give with.')
      return
    }
    setError(undefined)
    setBusy(true)
    await api.process(900)
    setBusy(false)
    setStep('otp')
    toast.info('Code sent', `Use 1 0 8 1 0 8 to continue. This is a prototype — no message was actually sent.`)
  }

  async function verify() {
    if (otp.replace(/\s/g, '') !== '108108') {
      setError('That code does not match. Use 108108 in this prototype.')
      return
    }
    setError(undefined)
    setBusy(true)
    await api.process(800)
    signIn()
    setBusy(false)
    toast.success('Signed in', 'Your donation history is available under My donations.')
    navigate('/my/donations')
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-14 sm:px-6">
      <div className="flex justify-center">
        <Kolam className="text-turmeric-500/70" size={80} />
      </div>
      <h1 className="mt-4 text-center font-display text-[30px] text-stone-900">Sign in</h1>
      <p className="mt-1 text-center text-[15px] text-stone-500">
        So your receipts and annual statement stay in one place.
      </p>
      <Divider className="mx-auto mt-6 w-40" />

      <div className="mt-8 rounded-card border border-sandal-200 bg-sandal-50 p-6 shadow-lift">
        {step === 'contact' ? (
          <>
            <Input
              label="Email or phone"
              placeholder="lakshmi@example.com"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void sendOtp()}
              leading={<Mail className="size-4" aria-hidden />}
              error={error}
              autoComplete="email"
            />
            <Button className="mt-4" fullWidth loading={busy} onClick={() => void sendOtp()}>
              Send me a code
            </Button>
          </>
        ) : (
          <>
            <Input
              label="Six-digit code"
              placeholder="108108"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void verify()}
              error={error}
              hint={`Sent to ${contact}. In this prototype the code is always 108108.`}
              inputMode="numeric"
              className="font-mono tracking-[0.3em] tabular-nums"
            />
            <Button className="mt-4" fullWidth loading={busy} onClick={() => void verify()}>
              Verify and continue
            </Button>
            <button
              type="button"
              onClick={() => {
                setStep('contact')
                setError(undefined)
              }}
              className="mt-3 w-full text-[13px] text-stone-500 hover:text-stone-900"
            >
              Use a different email or phone
            </button>
          </>
        )}

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-sandal-200" aria-hidden />
          <span className="text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">or</span>
          <span className="h-px flex-1 bg-sandal-200" aria-hidden />
        </div>

        <div className="flex flex-col gap-2">
          <Button variant="secondary" fullWidth icon={<Apple className="size-4" aria-hidden />} onClick={toast.soon}>
            Continue with Apple
          </Button>
          <Button variant="secondary" fullWidth icon={<Globe className="size-4" aria-hidden />} onClick={toast.soon}>
            Continue with Google
          </Button>
        </div>
      </div>

      <p className="mt-5 flex items-start justify-center gap-2 text-center text-[13px] text-stone-500">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-tulsi-700" aria-hidden />
        We never store card details. Payments are handled by Square.
      </p>
    </div>
  )
}

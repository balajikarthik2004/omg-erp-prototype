import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Apple,
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  FileText,
  Lock,
  Mail,
  Phone,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react'

import { DiyaIcon, Etching, OmgMark } from '@/components/ui/Ornament'
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

export function LoginPage() {
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
    if (mode === 'phone') {
      if (cleaned.length < 10) {
        setError('Please enter a valid 10-digit mobile number')
        return
      }
    } else {
      if (!cleaned.includes('@') || cleaned.length < 5) {
        setError('Please enter a valid email address')
        return
      }
    }

    setError(undefined)
    setBusy(true)
    await api.process(800)
    setBusy(false)
    setStep('otp')
    toast.info('Verification Code Sent', 'Use code 1 0 8 1 0 8 to verify. (Prototype mode)')
  }

  async function handleVerifyOtp(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (otp.replace(/\s/g, '') !== '108108') {
      setError('Incorrect code. In this prototype, use: 108108')
      return
    }

    setError(undefined)
    setBusy(true)
    await api.process(700)
    signIn()
    setBusy(false)
    toast.success('Welcome back, Devotee!', 'Your sacred ledger and tax receipts are ready.')
    navigate('/my/donations')
  }

  async function handleSocialSignIn(provider: 'Google' | 'Apple') {
    setError(undefined)
    setBusy(true)
    await api.process(800)
    signIn()
    setBusy(false)
    toast.success(`Signed in with ${provider}`, 'Accessing your sacred devotee account...')
    navigate('/my/donations')
  }

  function fillDemoCode() {
    setOtp('108108')
    setError(undefined)
  }

  return (
    <div className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-linear-to-b from-[#F2F4FC] via-[#E8ECFA] to-[#F1F3FB] py-8 sm:py-12 lg:py-16">
      {/* Background Watermark Etching */}
      <div
        className="pointer-events-none absolute -left-16 top-10 -z-10 hidden h-160 w-90 opacity-[0.14] lg:block"
        aria-hidden
      >
        <Etching
          src="/images/bg-gopuram-etching.png"
          className="bg-navy-600"
          position="top left"
        />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb / Back to Home */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-navy-700 hover:text-kumkum-600 transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Devotee Portal</span>
          </Link>
        </div>

        {/* Grand 2-Column Split Card */}
        <div className="overflow-hidden rounded-3xl border-2 border-navy-200/80 bg-white shadow-2xl lg:grid lg:grid-cols-[1.1fr_1fr]">
          {/* LEFT COLUMN: Sacred Devotee Experience Showcase */}
          <div className="relative isolate flex flex-col justify-between overflow-hidden bg-linear-to-br from-navy-950 via-navy-900 to-[#2A0E0B] p-8 text-white sm:p-10 lg:p-12">
            {/* Ambient Radial Spiritual Glow */}
            <div
              className="pointer-events-none absolute inset-0 -z-10"
              style={{
                background:
                  'radial-gradient(circle at 85% 15%, rgba(226, 46, 38, 0.28) 0%, transparent 55%), radial-gradient(circle at 15% 85%, rgba(255, 193, 7, 0.16) 0%, transparent 50%)',
              }}
              aria-hidden
            />

            <div>
              {/* Brand Tag */}
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-turmeric-300 backdrop-blur-xs">
                <span className="size-2 rounded-full bg-turmeric-400 animate-pulse" />
                <span>One Honest Ledger</span>
              </div>

              {/* Headline */}
              <h1 className="mt-6 font-heritage text-[32px] sm:text-[42px] leading-[1.08] font-bold text-white">
                <span>Your sacred offerings,</span>
                <span className="block text-turmeric-400">always illuminated.</span>
              </h1>

              <p className="mt-4 text-[15px] sm:text-[16px] leading-relaxed text-white/80">
                Sign in to follow your contributions to the temple, retrieve double-signed 80G tax receipts, and keep track of your family pooja dates.
              </p>

              {/* Devotee Value Cards */}
              <div className="mt-8 space-y-3.5">
                <div className="flex items-center gap-3.5 rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-xs transition-colors hover:bg-white/10">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-kumkum-500/20 text-kumkum-300 ring-1 ring-kumkum-400/40">
                    <FileText className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">Instant 80G Tax Receipts</p>
                    <p className="text-xs text-white/70">Double-signed audit certificates generated in real-time</p>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-xs transition-colors hover:bg-white/10">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-tulsi-500/20 text-tulsi-300 ring-1 ring-tulsi-400/40">
                    <DiyaIcon className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">Direct Seva Allocation</p>
                    <p className="text-xs text-white/70">Verify exact fund delivery to the sanctum, annadhanam or sangam</p>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-xs transition-colors hover:bg-white/10">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-turmeric-400/20 text-turmeric-300 ring-1 ring-turmeric-400/40">
                    <Calendar className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">Family Pooja Reminders</p>
                    <p className="text-xs text-white/70">Automated alerts for Nakshatra homams and auspicious thithis</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Sacred Blessing Quote */}
            <div className="mt-10 border-t border-white/15 pt-5 flex items-center justify-between text-xs text-white/75">
              {/* <span className="font-heritage tracking-wider text-turmeric-300 font-semibold italic text-sm">
                Om Namah Shivaya
              </span> */}
              <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-emerald-300">
                <CheckCircle2 className="size-3.5" />
                100% CA Certified
              </span>
            </div>
          </div>

          {/* RIGHT COLUMN: Interactive Devotee Sign In Form */}
          <div className="flex flex-col justify-between p-7 sm:p-10 lg:p-12">
            <div>
              {/* Header inside Form */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <OmgMark size={36} />
                  <div>
                    <span className="block font-heritage text-[20px] font-bold text-stone-900 leading-tight">
                      OMG Devotee Portal
                    </span>
                    <span className="block text-[10px] font-extrabold uppercase tracking-[0.2em] text-kumkum-500">
                      Secure Sign In
                    </span>
                  </div>
                </div>

                {/* Live Secure Badge */}
                <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                  <Lock className="size-3 text-emerald-600" />
                  <span>256-bit SSL</span>
                </div>
              </div>

              {/* Headline */}
              <div className="mt-6">
                <h2 className="font-heritage text-[26px] sm:text-[30px] font-bold text-stone-900 leading-tight">
                  {step === 'contact' ? 'Sign In to Your Account' : 'Verify One-Time Password'}
                </h2>
                <p className="mt-1 text-sm text-stone-600">
                  {step === 'contact'
                    ? 'Enter your mobile number or email address to receive an instant OTP.'
                    : `Enter the 6-digit verification code sent to ${contact}.`}
                </p>
              </div>

              {/* Prototype Helper Banner */}
              <div className="mt-4 flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200/80 px-3.5 py-2.5 text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-amber-600 shrink-0" />
                  <span className="font-semibold">
                    Prototype Mode: Use code <strong className="font-mono font-bold text-amber-950">108108</strong> to enter.
                  </span>
                </div>
                {step === 'otp' && (
                  <button
                    type="button"
                    onClick={fillDemoCode}
                    className="shrink-0 text-[11px] font-extrabold text-kumkum-600 hover:text-kumkum-700 underline"
                  >
                    Auto-Fill
                  </button>
                )}
              </div>

              {step === 'contact' ? (
                <>
                  {/* Mode Tabs: Phone vs Email */}
                  <div className="mt-5 grid grid-cols-2 rounded-xl bg-navy-50/80 p-1 border border-navy-100">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('phone')
                        setError(undefined)
                      }}
                      className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                        mode === 'phone'
                          ? 'bg-white text-navy-900 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <Phone className="size-3.5" />
                      <span>Mobile Number</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('email')
                        setError(undefined)
                      }}
                      className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                        mode === 'email'
                          ? 'bg-white text-navy-900 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <Mail className="size-3.5" />
                      <span>Email Address</span>
                    </button>
                  </div>

                  {/* Input Form */}
                  <form onSubmit={handleSendOtp} className="mt-5 space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                        {mode === 'phone' ? 'Mobile Number' : 'Email Address'}
                      </label>
                      <div className="mt-1.5 relative flex rounded-xl border-2 border-navy-200/80 bg-white shadow-2xs focus-within:border-kumkum-500 focus-within:ring-2 focus-within:ring-kumkum-200 transition-all">
                        {mode === 'phone' && (
                          <div className="flex items-center gap-1 border-r border-navy-200/80 bg-navy-50/50 px-3.5 text-xs font-bold text-navy-900">
                            <span>🇮🇳</span>
                            <span>+91</span>
                          </div>
                        )}
                        <input
                          type={mode === 'phone' ? 'tel' : 'email'}
                          autoFocus
                          placeholder={mode === 'phone' ? '98765 43210' : 'devotee@example.com'}
                          value={contact}
                          onChange={(e) => setContact(e.target.value)}
                          className="w-full bg-transparent px-3.5 py-3 text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-none"
                        />
                      </div>
                      {error && <p className="mt-1.5 text-xs font-bold text-kumkum-600">{error}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={busy}
                      className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-linear-to-r from-kumkum-500 via-kumkum-600 to-kumkum-700 hover:from-kumkum-600 hover:to-kumkum-800 text-white font-bold text-sm uppercase tracking-wider py-3.5 shadow-md shadow-kumkum-500/25 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <span>{busy ? 'Sending OTP Code...' : 'Send OTP Verification Code'}</span>
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </form>
                </>
              ) : (
                /* Step 2: OTP Verification */
                <form onSubmit={handleVerifyOtp} className="mt-5 space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                        6-Digit Verification Code
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setStep('contact')
                          setError(undefined)
                        }}
                        className="text-xs font-bold text-navy-600 hover:text-kumkum-600 transition-colors"
                      >
                        Change {mode === 'phone' ? 'Number' : 'Email'}
                      </button>
                    </div>

                    <div className="mt-1.5">
                      <input
                        type="text"
                        autoFocus
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="108108"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full rounded-xl border-2 border-navy-200/80 bg-white px-4 py-3 text-center font-mono text-[24px] font-black tracking-[0.35em] text-navy-950 placeholder:text-stone-300 focus:border-kumkum-500 focus:ring-2 focus:ring-kumkum-200 focus:outline-none transition-all"
                      />
                    </div>
                    {error && <p className="mt-1.5 text-xs font-bold text-kumkum-600 text-center">{error}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-kumkum-500 via-kumkum-600 to-kumkum-700 hover:from-kumkum-600 hover:to-kumkum-800 text-white font-bold text-sm uppercase tracking-wider py-3.5 shadow-md shadow-kumkum-500/25 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <span>{busy ? 'Verifying...' : 'Verify and Enter Portal'}</span>
                    <ArrowRight className="size-4" />
                  </button>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-stone-500">Didn't receive the code?</span>
                    <button
                      type="button"
                      onClick={() => void handleSendOtp()}
                      className="inline-flex items-center gap-1 font-bold text-navy-700 hover:text-kumkum-600"
                    >
                      <RotateCcw className="size-3" />
                      <span>Resend OTP</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Social Login Divider */}
              <div className="my-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-navy-200/60" aria-hidden />
                <span className="text-[11px] font-bold tracking-[0.14em] text-stone-500 uppercase">
                  or continue with
                </span>
                <span className="h-px flex-1 bg-navy-200/60" aria-hidden />
              </div>

              {/* Social Login Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleSocialSignIn('Google')}
                  className="flex items-center justify-center gap-2 rounded-xl border-2 border-navy-200/80 bg-white py-2.5 px-4 text-xs font-bold text-stone-800 shadow-2xs hover:bg-navy-50/50 hover:border-navy-300 transition-all active:scale-95 disabled:opacity-50"
                >
                  <GoogleIcon />
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleSocialSignIn('Apple')}
                  className="flex items-center justify-center gap-2 rounded-xl border-2 border-navy-200/80 bg-white py-2.5 px-4 text-xs font-bold text-stone-800 shadow-2xs hover:bg-navy-50/50 hover:border-navy-300 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Apple className="size-4.5" />
                  <span>Apple</span>
                </button>
              </div>
            </div>

            {/* Privacy & Trust Footer */}
            <div className="mt-8 border-t border-navy-100 pt-4 text-center">
              <p className="flex items-center justify-center gap-1.5 text-xs text-stone-500">
                <ShieldCheck className="size-4 text-emerald-600" />
                <span>Double-Signed CA Ledger. Zero card data stored.</span>
              </p>
              <p className="mt-1 text-[11px] text-stone-400">
                By signing in, you agree to the temple terms of seva and privacy policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useRef, useTransition, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useActionState } from 'react'
import { AuthCard } from '@/app/components/auth/AuthCard'
import {
  verifyOtpAction,
  resendCodeAction,
  type VerifyOtpFormState,
} from '@/app/actions/auth'

function VerifyEmailForm() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [resendState, setResendState] = useState<{ error?: string; resent?: boolean }>({})
  const [isResending, startResendTransition] = useTransition()
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  
  const [state, formAction, isPending] = useActionState<VerifyOtpFormState, FormData>(
    verifyOtpAction,
    null
  )

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const next = [...otp]
    next[index] = value.slice(-1)
    setOtp(next)
    if (value && index < 5) inputs.current[index + 1]?.focus()
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const next = [...otp]
      next[index - 1] = ''
      setOtp(next)
      inputs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = Array(6).fill('')
    pasted.split('').forEach((char, i) => {
      if (i < 6) next[i] = char
    })
    setOtp(next)
    const lastFilled = Math.min(pasted.length - 1, 5)
    inputs.current[lastFilled]?.focus()
  }

  function handleResend() {
    if (!email || isResending) return
    setResendState({})

    startResendTransition(async () => {
      const result = await resendCodeAction(email)
      if (result.success) {
        setResendState({ resent: true })
        setOtp(['', '', '', '', '', ''])
        inputs.current[0]?.focus()
      } else {
        setResendState({ error: result.error })
      }
    })
  }

  const filled = otp.join('').length

  return (
    <AuthCard mascotSrc="/SignUpMascot.jpg">
      <div className="w-full">
        <h1 className="text-[38px] font-semibold text-gray-900 mb-2 tracking-tight font-sans">
          Check your inbox
        </h1>
        <p className="text-sm text-gray-500 mb-2 font-poppins leading-relaxed">
          We sent a 6-digit code to
        </p>
        <p className="text-sm font-semibold text-gray-800 mb-7 font-poppins">
          {email || 'your email address'}
        </p>

        <form action={formAction} className="space-y-5">
          {/* Pass search parameter email and concatenated OTP token to Server Action */}
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="token" value={otp.join('')} />

          <div className="flex gap-2.5 justify-between" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputs.current[i] = el
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-11 h-12 text-center text-xl font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 transition-colors font-poppins"
              />
            ))}
          </div>

          {resendState.resent && (
            <p className="text-xs text-green-600 font-poppins">
              New code sent — check your inbox.
            </p>
          )}
          {resendState.error && (
            <p className="text-xs text-red-500 font-poppins">{resendState.error}</p>
          )}
          {state?.error && (
            <p className="text-xs text-red-500 font-poppins">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={isPending || filled < 6}
            className="w-full bg-gray-900 text-white rounded-full py-3 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-60 font-poppins"
          >
            {isPending ? 'Verifying…' : 'Verify & continue'}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-5 font-poppins">
          Didn&apos;t receive a code?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || isPending}
            className="text-gray-900 font-semibold hover:underline disabled:opacity-50"
          >
            {isResending ? 'Sending…' : 'Resend'}
          </button>
          {' · '}
          <Link href="/signup" className="text-gray-900 font-semibold hover:underline">
            Wrong email
          </Link>
        </p>
      </div>
    </AuthCard>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  )
}
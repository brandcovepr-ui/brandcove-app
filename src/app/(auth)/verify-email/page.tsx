'use client'

import { useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AuthCard } from '@/components/auth/AuthCard'
import { getAuthErrorMessage } from '@/lib/utils/authErrors'

function VerifyEmailForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resent, setResent] = useState(false)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

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
    pasted.split('').forEach((char, i) => { if (i < 6) next[i] = char })
    setOtp(next)
    const lastFilled = Math.min(pasted.length - 1, 5)
    inputs.current[lastFilled]?.focus()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const token = otp.join('')
    if (token.length < 6) { setError('Please enter the full 6-digit code.'); return }

    setLoading(true)
    setError('')
    const supabase = createClient()

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    })

    if (verifyError) {
      setError(getAuthErrorMessage(verifyError))
      setLoading(false)
      return
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, onboarding_complete, review_status, subscription_status')
        .eq('id', data.user.id)
        .single()

      if (profile?.role === 'creative') {
        if (!profile.onboarding_complete) { router.push('/creator'); return }
        if (profile.review_status !== 'approved') { router.push('/creator/pending-review'); return }
        if (profile.subscription_status !== 'active') { router.push('/subscribe'); return }
        router.push('/creator/dashboard')
      } else {
        router.push(profile?.onboarding_complete ? '/founder/dashboard' : '/founder')
      }
    } else {
      router.push('/founder')
    }
  }

  async function resendCode() {
    if (!email || loading) return
    setLoading(true)
    setError('')
    setResent(false)
    const supabase = createClient()
    const { error: resendError } = await supabase.auth.resend({ type: 'signup', email })
    setLoading(false)
    if (resendError) {
      setError(getAuthErrorMessage(resendError))
    } else {
      setResent(true)
      setOtp(['', '', '', '', '', ''])
      inputs.current[0]?.focus()
    }
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex gap-2.5 justify-between" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className="w-11 h-12 text-center text-xl font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 transition-colors font-poppins"
              />
            ))}
          </div>

          {resent && (
            <p className="text-xs text-green-600 font-poppins">New code sent — check your inbox.</p>
          )}
          {error && <p className="text-xs text-red-500 font-poppins">{error}</p>}

          <button
            type="submit"
            disabled={loading || filled < 6}
            className="w-full bg-gray-900 text-white rounded-full py-3 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-60 font-poppins"
          >
            {loading ? 'Verifying…' : 'Verify & continue'}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-5 font-poppins">
          Didn&apos;t receive a code?{' '}
          <button
            type="button"
            onClick={resendCode}
            disabled={loading}
            className="text-gray-900 font-semibold hover:underline disabled:opacity-50"
          >
            Resend
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

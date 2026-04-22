'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')

  useEffect(() => {
    const reference = searchParams.get('reference') ?? searchParams.get('trxref')
    if (!reference) {
      setError('No payment reference found. Please contact support.')
      return
    }

    async function verify() {
      const supabase = createClient()
      const [{ data: { user } }, { data: { session } }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.auth.getSession(),
      ])

      if (!user || !session) {
        router.replace('/login')
        return
      }

      try {
        const res = await fetch('/api/paystack/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ reference }),
        })

        if (!res.ok) {
          const body = await res.json()
          setError(body.error ?? 'Payment verification failed. Please contact support.')
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        router.replace(profile?.role === 'creative' ? '/creator/dashboard' : '/founder/dashboard')
      } catch {
        setError('Network error during verification. Please contact support.')
      }
    }

    verify()
  }, [searchParams, router])

  if (error) {
    return (
      <div className="auth-bg h-screen flex flex-col items-center justify-center gap-4 font-poppins">
        <p className="text-sm text-red-500 max-w-sm text-center">{error}</p>
        <button
          onClick={() => router.replace('/subscribe')}
          className="text-sm text-gray-600 underline"
        >
          Go back and try again
        </button>
      </div>
    )
  }

  return (
    <div className="auth-bg h-screen flex flex-col items-center justify-center gap-3 font-poppins">
      <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      <p className="text-sm text-gray-500">Confirming your payment…</p>
    </div>
  )
}

export default function PaystackCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-bg h-screen flex flex-col items-center justify-center gap-3 font-poppins">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Confirming your payment…</p>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  )
}

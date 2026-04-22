'use client'

import { useState } from 'react'
import { useUser } from '@/lib/hooks/useUser'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

export default function SubscribePage() {
  const { profile, loading: profileLoading } = useUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (profileLoading || !profile) {
    return (
      <div className="auth-bg h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    )
  }

  const isCreative = profile.role === 'creative'
  const planLabel = isCreative ? 'Creative Plan' : 'Founder Plan'
  const planCode = isCreative
    ? process.env.NEXT_PUBLIC_PAYSTACK_CREATIVE_PLAN_CODE!
    : process.env.NEXT_PUBLIC_PAYSTACK_FOUNDER_PLAN_CODE!
  const planPrice = isCreative ? '₦1,000' : '₦3,000'
  const totalSteps = isCreative ? 5 : 4
  async function handleSubscribe() {
    if (!profile || loading) return
    setError('')
    setLoading(true)

    const supabase = createClient()
    const [{ data: { user } }, { data: { session } }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getSession(),
    ])

    if (!user || !session) {
      setError('Session expired. Please log in again.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan: planCode }),
      })

      if (!res.ok) {
        const body = await res.json()
        setError(body.error ?? 'Could not start payment. Please try again.')
        setLoading(false)
        return
      }

      const { authorization_url } = await res.json()
      window.location.href = authorization_url
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg h-screen font-poppins">
      <div className="w-full max-w-4xl h-full max-h-[92vh] bg-white rounded-2xl border-2 border-white overflow-hidden shadow-xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-50 shrink-0">
          <span className="text-xl font-bold text-gray-900 tracking-tight">BrandCove</span>
          <span className="text-xs text-gray-400 uppercase tracking-widest">
            Step {totalSteps} of {totalSteps}: Subscribe
          </span>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-10 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Subscribe to get access</h1>
            <p className="text-sm text-gray-500 mb-6">
              {isCreative
                ? `Get full access to inquiries and messages from founders for ${planPrice}/month.`
                : `Get unlimited access to pre-vetted top talent for ${planPrice}/month. No hidden fees. Cancel anytime.`}
            </p>

            {/* Plan card */}
            <div className="border border-gray-200 rounded-xl p-5 mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{planLabel}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Billed monthly. Cancel anytime.</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{planPrice}</p>
                  <p className="text-xs text-gray-400">/month</p>
                </div>
              </div>
              <ul className="mt-4 space-y-1.5">
                {(isCreative
                  ? ['Receive inquiries from vetted founders', 'Real-time messaging', 'Manage your creative profile']
                  : ['Browse all vetted creatives', 'Unlimited messaging', 'Shortlist & manage talent']
                ).map(item => (
                  <li key={item} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="w-4 h-4 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
                      <svg width="8" height="6" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Progress dots */}
            <div className="flex gap-1.5 mb-6">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <span key={i} className="w-2 h-2 rounded-full bg-gray-900" />
              ))}
            </div>

            {error && (
              <p className="text-xs text-red-500 mb-3">{error}</p>
            )}

            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full bg-gray-900 text-white rounded-full py-3 text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-60"
            >
              {loading ? 'Processing…' : `Pay ${planPrice} & Subscribe`}
            </button>
          </div>

          {/* Mascot */}
          <div className="hidden md:flex w-72 items-center justify-center p-8 border-l border-gray-50 shrink-0">
            <Image
              src="/SubscribeMascot.png"
              alt=""
              width={220}
              height={220}
              className="object-contain w-auto h-auto max-h-64"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

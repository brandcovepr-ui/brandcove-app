import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import { SubscribeButton } from './SubscribeButton'

export default async function SubscribePage() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  const isCreative = profile.role === 'creative'
  const planLabel = isCreative ? 'Creative Plan' : 'Founder Plan'
  const planPrice = isCreative ? '₦1,000' : '₦3,000'
  const totalSteps = isCreative ? 5 : 4

  const planFeatures = isCreative
    ? [
        'Receive inquiries from vetted founders',
        'Real-time messaging',
        'Manage your creative profile',
      ]
    : [
        'Browse all vetted creatives',
        'Unlimited messaging',
        'Shortlist & manage talent',
      ]

  return (
    <div className="auth-bg h-screen font-poppins flex items-center justify-center">
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
          <div className="flex-1 overflow-y-auto px-5 md:px-10 py-8">
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
                {planFeatures.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="w-4 h-4 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
                      <svg width="8" height="6" viewBox="0 0 10 8" fill="none">
                        <path
                          d="M1 4L3.5 6.5L9 1"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
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

            {/* Submit Control */}
            <SubscribeButton planPrice={planPrice} />
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
'use client'

import { Check, AlertCircle } from 'lucide-react'
import { ProgressDots } from '../../ui/ProgressDots'

interface Props {
  totalSteps: number
  loading: boolean
  error?: string
  onPay: () => void
  onDotClick: (step: number) => void
}

export function Step5Subscribe({ totalSteps, loading, error, onPay, onDotClick }: Props) {
  return (
    <div>
      <h1 className="text-2xl sm:text-[28px] font-editorial text-gray-900 mb-1 leading-tight">
        You&apos;re almost in.
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Get full access to BrandCove&apos;s curated network of top creatives. Cancel anytime.
      </p>

      <div className="border border-gray-200 rounded-2xl p-6 mb-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Founder Plan</p>
            <p className="text-3xl font-editorial text-gray-900">₦3,000</p>
          </div>
          <p className="text-sm text-gray-400 mb-1">/ month</p>
        </div>

        <ul className="space-y-2 text-sm text-gray-600">
          {[
            'Browse verified creatives',
            'Send unlimited inquiries',
            'Direct messaging',
            'Shortlist & compare talent',
          ].map((feat) => (
            <li key={feat} className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
                <Check size={8} className="text-white" strokeWidth={3} />
              </span>
              {feat}
            </li>
          ))}
        </ul>
      </div>

      <ProgressDots current={5} total={totalSteps} onDotClick={onDotClick} />

      {error && (
        <div className="mb-3 flex items-center gap-1.5 text-xs text-red-500">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      <button
        type="button"
        onClick={onPay}
        disabled={loading}
        className="w-full bg-gray-900 text-white rounded-full py-3 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40"
      >
        {loading ? 'Processing…' : 'Pay ₦3,000 & Enter BrandCove'}
      </button>
      <p className="text-xs text-gray-400 text-center mt-3">Billed monthly. Cancel anytime.</p>
    </div>
  )
}
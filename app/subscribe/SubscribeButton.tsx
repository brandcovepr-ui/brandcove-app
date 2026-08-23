'use client'

import { useState, useTransition } from 'react'
import { initializeSubscription } from '../actions/subscribe'

interface SubscribeButtonProps {
  planPrice: string
}

export function SubscribeButton({ planPrice }: SubscribeButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubscribe = () => {
    setError(null)
    startTransition(async () => {
      const result = await initializeSubscription()
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div>
      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

      <button
        onClick={handleSubscribe}
        disabled={isPending}
        className="w-full bg-gray-900 text-white rounded-full py-3 text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-60"
      >
        {isPending ? 'Processing…' : `Pay ${planPrice} & Subscribe`}
      </button>
    </div>
  )
}
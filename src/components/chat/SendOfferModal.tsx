'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  inquiryId: string
  founderId: string
  creativeId: string
  onClose: () => void
}

export function SendOfferModal({ inquiryId, founderId, creativeId, onClose }: Props) {
  const [rate, setRate] = useState('')
  const [rateType, setRateType] = useState<'fixed' | 'monthly' | 'hourly'>('fixed')
  const [terms, setTerms] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rate || !terms.trim()) {
      setError('Please fill in the rate and terms.')
      return
    }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: insertError } = await supabase.from('offers').insert({
      inquiry_id: inquiryId,
      founder_id: founderId,
      creative_id: creativeId,
      rate: Number(rate),
      rate_type: rateType,
      terms: terms.trim(),
      status: 'pending',
    })
    setLoading(false)
    if (insertError) {
      setError('Failed to send offer. Please try again.')
      return
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">Send New Offer</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Rate (₦)
              </label>
              <input
                type="number"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="e.g. 150000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Rate Type
              </label>
              <select
                value={rateType}
                onChange={(e) => setRateType(e.target.value as 'fixed' | 'monthly' | 'hourly')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                <option value="fixed">Fixed</option>
                <option value="monthly">Monthly</option>
                <option value="hourly">Hourly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Offer Terms
            </label>
            <textarea
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              rows={4}
              placeholder="Describe what's included, deliverables, and any conditions…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 rounded-full py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#6b1d2b] text-white rounded-full py-2.5 text-sm font-medium hover:bg-[#4e1520] transition-colors disabled:opacity-60"
            >
              {loading ? 'Sending…' : 'Send Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

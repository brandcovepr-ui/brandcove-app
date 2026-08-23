'use client'

const AVAILABILITY_OPTIONS = [
  { value: 'available', label: 'Available', description: 'Open to new projects right now' },
  { value: 'open_to_offers', label: 'Open to offers', description: 'Busy but accepting the right fit' },
  { value: 'busy', label: 'Busy', description: 'Not available at the moment' },
] as const

interface StepSixProps {
  monthlyRate: string
  setMonthlyRate: (val: string) => void
  availability: 'available' | 'open_to_offers' | 'busy'
  setAvailability: (val: 'available' | 'open_to_offers' | 'busy') => void
  onSubmit: () => void
  isPending: boolean
  serverError?: string
}

export function StepSixRates({
  monthlyRate,
  setMonthlyRate,
  availability,
  setAvailability,
  onSubmit,
  isPending,
  serverError,
}: StepSixProps) {
  return (
    <>
      <h1 className="mb-1 font-editorial text-2xl text-gray-900 sm:text-3xl">Set your rate &amp; availability</h1>
      <p className="mb-6 text-sm text-gray-500">Provide transparent compensation expectations for potential clients.</p>

      <div className="mb-5 space-y-5">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Monthly Rate (₦)</label>
          <input
            type="number"
            value={monthlyRate}
            onChange={(e) => setMonthlyRate(e.target.value)}
            placeholder="e.g. 150000"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-gray-700">Availability</label>
          {AVAILABILITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setAvailability(opt.value)}
              className={`mb-2 w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                availability === opt.value ? 'border-gray-900 bg-pink-50 font-medium' : 'border-gray-200'
              }`}
            >
              <div className="font-medium text-gray-900">{opt.label}</div>
              <div className="text-xs text-gray-500">{opt.description}</div>
            </button>
          ))}
        </div>
      </div>

      {serverError && <p className="mb-3 text-xs text-red-500">{serverError}</p>}

      <button
        type="button"
        onClick={onSubmit}
        disabled={isPending}
        className="w-full rounded-full bg-gray-900 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
      >
        {isPending ? 'Submitting Application...' : 'Complete Application'}
      </button>
    </>
  )
}
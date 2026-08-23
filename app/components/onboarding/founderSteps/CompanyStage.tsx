'use client'

import { Check, AlertCircle } from 'lucide-react'
import { ProgressDots } from '../../ui/ProgressDots'

export const ROLES = [
  'Social Media Manager',
  'Graphic Designer',
  'Sales Representative',
  'Customer Service Specialist',
  'Operations Manager',
  'Marketing Associate',
]

interface Props {
  selectedRoles: string[]
  totalSteps: number
  loading: boolean
  error?: string
  onToggleRole: (role: string) => void
  onSubmit: () => void
  onDotClick: (step: number) => void
}

export function Step4RequiredRoles({
  selectedRoles,
  totalSteps,
  loading,
  error,
  onToggleRole,
  onSubmit,
  onDotClick,
}: Props) {
  return (
    <div>
      <h1 className="text-2xl sm:text-[28px] font-editorial text-gray-900 mb-1 leading-tight">
        Which roles do you need right now?
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Select the roles to filter your curated marketplace.
      </p>

      <div className="space-y-2 mb-6">
        {ROLES.map((role) => {
          const selected = selectedRoles.includes(role)
          return (
            <button
              key={role}
              type="button"
              onClick={() => onToggleRole(role)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-full border text-left text-sm transition-colors ${
                selected ? 'border-gray-900 bg-pink-50 font-medium' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              {role}
              <span
                className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center ${
                  selected ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                }`}
              >
                {selected && <Check size={10} className="text-white" strokeWidth={3} />}
              </span>
            </button>
          )
        })}
      </div>

      <ProgressDots current={4} total={totalSteps} onDotClick={onDotClick} />

      {error && (
        <div className="mb-3 flex items-center gap-1.5 text-xs text-red-500">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={loading || selectedRoles.length === 0}
        className="w-full bg-gray-900 text-white rounded-full py-3 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40"
      >
        {loading ? 'Saving…' : 'Continue'}
      </button>
    </div>
  )
}
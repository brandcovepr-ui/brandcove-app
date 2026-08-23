'use client'
import { ProgressDots } from "../../ui/ProgressDots"

export const STAGES = ['Pre-launch', 'Early stage', 'Growth', 'Established']

interface Props {
  companyStage: string
  totalSteps: number
  onSelectStage: (stage: string) => void
  onNext: () => void
  onDotClick: (step: number) => void
}

export function Step3CompanyStage({
  companyStage,
  totalSteps,
  onSelectStage,
  onNext,
  onDotClick,
}: Props) {
  return (
    <div>
      <h1 className="text-2xl sm:text-[28px] font-editorial text-gray-900 mb-1 leading-tight">
        What stage is your company in?
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Help us tailor the experience to your current needs.
      </p>

      <div className="space-y-2 mb-6">
        {STAGES.map((stage) => (
          <button
            key={stage}
            type="button"
            onClick={() => onSelectStage(stage)}
            className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-full border text-left text-sm transition-colors ${
              companyStage === stage
                ? 'border-gray-900 bg-pink-50 font-medium'
                : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            {stage}
            <span
              className={`w-4 h-4 shrink-0 rounded-full border-2 flex items-center justify-center ${
                companyStage === stage ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
              }`}
            >
              {companyStage === stage && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </span>
          </button>
        ))}
      </div>

      <ProgressDots current={3} total={totalSteps} onDotClick={onDotClick} />

      <button
        type="button"
        onClick={onNext}
        disabled={!companyStage}
        className="w-full bg-gray-900 text-white rounded-full py-3 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40"
      >
        Continue
      </button>
    </div>
  )
}
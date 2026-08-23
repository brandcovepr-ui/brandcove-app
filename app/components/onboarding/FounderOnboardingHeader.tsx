import Image from 'next/image'

interface Props {
  currentStep: number
  totalSteps: number
  label: string
}

export function OnboardingHeader({ currentStep, totalSteps, label }: Props) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 bg-[#F6F4F3] px-4 py-3 sm:px-8">
      <Image
        src="/BrandCovePr.png"
        alt="BrandCove"
        width={100}
        height={26}
        className="h-auto w-24 object-contain"
      />
      <span className="min-w-0 text-right text-[10px] uppercase tracking-widest text-gray-400 sm:text-xs">
        Step {currentStep} of {totalSteps} : {label}
      </span>
    </div>
  )
}
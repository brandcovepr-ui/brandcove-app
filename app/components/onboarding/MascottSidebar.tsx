import Image from 'next/image'

interface Props {
  step: number
}

export function MascotSidebar({ step }: Props) {
  const getMascotSrc = () => {
    switch (step) {
      case 1:
        return '/OnboardingMascot.png'
      case 2:
      case 3:
        return '/Welcome Mascot.svg'
      case 4:
        return '/Search Mascot.png'
      default:
        return '/SubscribeMascot.png'
    }
  }

  return (
    <div className="hidden lg:flex w-1/2 items-center justify-center p-8 shrink-0">
      <Image
        src={getMascotSrc()}
        alt="Onboarding Mascot"
        width={420}
        height={420}
        className="object-contain w-auto h-auto max-h-[80%]"
        priority
      />
    </div>
  )
}
import Image from 'next/image'

interface AuthCardProps {
  children: React.ReactNode
  mascotSrc?: string
}

export function AuthCard({ children, mascotSrc }: AuthCardProps) {
  return (
    <div className="w-full h-full bg-white rounded-2xl border-white border-2 overflow-hidden shadow-xl flex flex-col">
      {/* BrandCove — centered at top of the whole card */}
      <div className="text-center py-5 shrink-0">
        <span className="text-2xl font-editorial text-gray-900 tracking-tight">BrandCove</span>
      </div>

      {/* Two-column body */}
      <div className="flex flex-1 min-h-0 md:px-48">
        {/* Form side — vertically and horizontally centered */}
        <div className="flex-1 flex items-center justify-center px-10 py-6">
          {children}
        </div>

        {/* Mascot side */}
        {mascotSrc && (
          <div className="hidden md:flex flex-1 items-center justify-center p-8">
            <Image
              src={mascotSrc}
              alt="Mascot"
              width={300}
              height={300}
              loading="eager"
              className="object-contain w-auto h-full max-w-[300px] max-h-[50vh]"
            />
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { usePathname } from 'next/navigation'

export function AuthTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div key={pathname} className="animate-in slide-in-from-right duration-500 ease-out w-full h-full">
      {children}
    </div>
  )
}

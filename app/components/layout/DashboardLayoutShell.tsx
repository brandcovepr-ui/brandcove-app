'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar,Profile } from './SideBar'
import { TopBar } from './TopBar'

interface DashboardLayoutShellProps {
  profile: Profile | null
  children: React.ReactNode
}

export function DashboardLayoutShell({ profile, children }: DashboardLayoutShellProps) {
  const pathname = usePathname()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  // Close drawer on route change
  // useEffect(() => {
  //   setMobileNavOpen(false)
  // }, [pathname])

  return (
    <div className="flex h-dvh overflow-hidden font-poppins" style={{ background: '#FBF8F4' }}>
      {/* Mobile Overlay */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <Sidebar profile={profile} onNavClick={() => setMobileNavOpen(false)} />
      </div>

      {/* Main View Area */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TopBar onMenuClick={() => setMobileNavOpen((prev) => !prev)} />
        <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
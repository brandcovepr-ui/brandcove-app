'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { TopBar } from '@/components/layout/TopBar'
import { useUser } from '@/lib/hooks/useUser'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  useUser()
  const pathname = usePathname()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  // Auto-close sidebar on route change
  useEffect(() => { setMobileNavOpen(false) }, [pathname])

  return (
    <div className="flex h-dvh overflow-hidden font-poppins" style={{ background: '#FBF8F4' }}>

      {/* Mobile sidebar backdrop */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden bg-black/40"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Sidebar — slides in on mobile, always visible on desktop */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <AdminSidebar onNavClick={() => setMobileNavOpen(false)} />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* Mobile top bar — hidden on desktop */}
        <TopBar onMenuClick={() => setMobileNavOpen(v => !v)} />

        <main className="flex-1 overflow-y-auto flex flex-col">
          {children}
        </main>
      </div>
    </div>
  )
}

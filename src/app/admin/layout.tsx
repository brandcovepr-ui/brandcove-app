'use client'

import { useState } from 'react'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { TopBar } from '@/components/layout/TopBar'
import { useUser } from '@/lib/hooks/useUser'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  useUser()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden font-poppins" style={{ background: '#FBF8F4' }}>
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden bg-black/30"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-200 md:static md:translate-x-0 ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <AdminSidebar onNavClick={() => setMobileNavOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        <TopBar onMenuClick={() => setMobileNavOpen((v) => !v)} />
        <main className="flex-1 overflow-y-auto flex flex-col">
          {children}
        </main>
      </div>
    </div>
  )
}

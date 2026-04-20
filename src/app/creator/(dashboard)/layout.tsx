'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { CreativeSidebar } from '@/components/layout/CreativeSidebar'
import { TopBar } from '@/components/layout/TopBar'
import { useUser } from '@/lib/hooks/useUser'

export default function CreatorDashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const showTopBar = pathname !== '/creator/dashboard'

  useEffect(() => {
    if (loading) return
    if (!profile) { router.replace('/login'); return }
    if (profile.role !== 'creative') { router.replace('/founder/dashboard'); return }
    if (!profile.onboarding_complete) { router.replace('/creator'); return }
    if (profile.review_status !== 'approved') { router.replace('/creator/pending-review'); return }
    if (profile.subscription_status !== 'active') { router.replace('/subscribe') }
  }, [profile, loading, router])

  if (loading || !profile) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: '#FBF8F4' }}>
        <div className="w-6 h-6 border-2 border-gray-300 border-t-[#6b1d2b] rounded-full animate-spin" />
      </div>
    )
  }

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
        <CreativeSidebar onNavClick={() => setMobileNavOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* {showTopBar && <TopBar onMenuClick={() => setMobileNavOpen((v) => !v)} />} */}
        <main className="flex-1 overflow-y-auto flex flex-col">
          {children}
        </main>
      </div>
    </div>
  )
}

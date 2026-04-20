'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, MessageSquare, User, Settings } from 'lucide-react'
import { CreativeSidebar } from '@/components/layout/CreativeSidebar'
import { TopBar } from '@/components/layout/TopBar'
import { useUser } from '@/lib/hooks/useUser'

const bottomNav = [
  { label: 'Dashboard', href: '/creator/dashboard', icon: LayoutDashboard },
  { label: 'Inquiries',  href: '/creator/messages',  icon: MessageSquare },
  { label: 'Profile',    href: '/creator/profile',   icon: User },
  { label: 'Settings',   href: '/creator/settings',  icon: Settings },
]

export default function CreatorDashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  // Auto-close sidebar on route change
  useEffect(() => { setMobileNavOpen(false) }, [pathname])

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
      <div className="flex h-dvh items-center justify-center" style={{ background: '#FBF8F4' }}>
        <div className="w-6 h-6 border-2 border-gray-300 border-t-[#6b1d2b] rounded-full animate-spin" />
      </div>
    )
  }

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
        <CreativeSidebar onNavClick={() => setMobileNavOpen(false)} />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* Mobile top bar — hidden on desktop */}
        <TopBar onMenuClick={() => setMobileNavOpen(v => !v)} />

        {/* Page content — extra padding-bottom on mobile for bottom nav */}
        <main className="flex-1 overflow-y-auto flex flex-col pb-16 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar — hidden on desktop */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex items-stretch"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {bottomNav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
                active ? 'text-[#6b1d2b]' : 'text-gray-400'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

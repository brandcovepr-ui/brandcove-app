'use client'

import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'

const TITLES: [string, string][] = [
  ['/creator/dashboard', 'Dashboard'],
  ['/creator/messages', 'Inquiries'],
  ['/creator/profile/edit', 'Edit Profile'],
  ['/creator/profile', 'My Profile'],
  ['/creator/settings', 'Settings'],
  ['/founder/dashboard', 'Dashboard'],
  ['/founder/browse', 'Browse Talent'],
  ['/founder/shortlist', 'Shortlist'],
  ['/founder/messages', 'Messages'],
  ['/founder/inquiries', 'Inquiries'],
  ['/founder/settings', 'Settings'],
  ['/founder/profile', 'Profile'],
  ['/admin', 'Creator Applications'],
]

function getTitle(pathname: string): string {
  // Longest prefix match
  const match = TITLES.find(([prefix]) => pathname === prefix || pathname.startsWith(prefix + '/'))
  return match?.[1] ?? 'Brandcove'
}

interface TopBarProps {
  onMenuClick: () => void
  action?: React.ReactNode
}

export function TopBar({ onMenuClick, action }: TopBarProps) {
  const pathname = usePathname()
  const title = getTitle(pathname)

  return (
    <div className="h-14 border-b border-gray-200 flex items-center px-4 md:px-6 shrink-0 gap-3" style={{ background: '#FBF8F4' }}>
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-1.5 -ml-1 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <h2 className="text-sm font-semibold text-gray-900 flex-1">{title}</h2>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

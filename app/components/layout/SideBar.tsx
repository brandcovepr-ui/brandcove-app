'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  MessageSquare,
  User,
  Settings,
  LogOut,
  X,
  Users,
  Bookmark,
  ShieldAlert,
  MessageSquareDot,
  SearchIcon
} from 'lucide-react'
import { signOutAction } from '@/app/actions/auth'

export type UserRole = 'creator' | 'creative' | 'founder' | 'admin'

export interface Profile {
  id: string
  full_name?: string | null
  role?: UserRole | string | null
}

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

interface SidebarProps {
  profile: Profile | null
  onNavClick?: () => void
}

function getRoleNavItems(role?: string | null): { basePath: string; items: NavItem[] } {
  const normalizedRole = role?.toLowerCase()

  if (normalizedRole === 'admin') {
    return {
      basePath: '/dashboard/admin',
      items: [
        { label: 'Overview', href: '/dashboard/admin', icon: <LayoutDashboard size={18} /> },
        { label: 'Onboard', href: '/dashboard/admin/onboard', icon: <Users size={18} /> },
        // { label: 'Inquiries', href: '/dashboard/admin/inquiries', icon: <MessageSquare size={18} /> },
        // { label: 'System', href: '/dashboard/admin/settings', icon: <ShieldAlert size={18} /> },
      ],
    }
  }

  if (normalizedRole === 'founder') {
    return {
      basePath: '/dashboard/founder',
      items: [
        { label: 'Dashboard', href: '/dashboard/founder', icon: <LayoutDashboard size={18} /> },
        { label: 'Browse', href: '/dashboard/founder/browse', icon: <SearchIcon size={18} /> },
        // { label: 'Inquiries', href: '/dashboard/founder/inquiries', icon: <MessageSquare size={18} /> },
        { label: 'Inquiries', href: '/dashboard/founder/inquiries', icon: <MessageSquareDot size={18} /> },
        { label: 'Shortlist', href: '/dashboard/founder/shortlist', icon: <Bookmark size={18} /> },
      ],
    }
  }

  // Default: Creator / Creative
  return {
    basePath: '/dashboard/creator',
    items: [
      { label: 'Dashboard', href: '/dashboard/creator', icon: <LayoutDashboard size={18} /> },
      { label: 'Inquiries', href: '/dashboard/creator/inquiries', icon: <MessageSquare size={18} /> },
      { label: 'Profile', href: '/dashboard/creator/profile', icon: <User size={18} /> },
    ],
  }
}

export function Sidebar({ profile, onNavClick }: SidebarProps) {
  const pathname = usePathname()
  const { basePath, items: navItems } = getRoleNavItems(profile?.role)

  const settingsHref = `${basePath}/settings`
  const roleDisplay = profile?.role
    ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
    : 'User'

  function NavLink({ item }: { item: NavItem }) {
    const isExact = pathname === item.href
    const isChild = item.href !== basePath && pathname.startsWith(item.href + '/')
    const active = isExact || isChild

    return (
      <Link
        href={item.href}
        onClick={onNavClick}
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
          active
            ? 'bg-[#551A25] font-medium text-white'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        {item.icon}
        <span className="flex-1">{item.label}</span>
      </Link>
    )
  }

  return (
    <aside
      className="flex h-full w-64 shrink-0 flex-col border-r border-gray-200 md:w-56"
      style={{ background: '#EFE9E2' }}
    >
      {/* Brand Header */}
      <div className="relative flex items-center justify-center border-b border-gray-200/60 py-4">
        <Image
          src="/BrandCovePr.png"
          alt="BrandCove"
          width={120}
          height={32}
          className="object-contain"
          priority
        />
        <button
          type="button"
          onClick={onNavClick}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 transition-colors hover:text-gray-800 md:hidden"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Dynamic Role Navigation */}
      <nav className="flex-1 overflow-y-auto space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      {/* Footer / Account Section */}
      <div className="space-y-1 border-t border-gray-100 px-3 pb-4 pt-3">
        <Link
          href={settingsHref}
          onClick={onNavClick}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
            pathname === settingsHref || pathname.startsWith(settingsHref + '/')
              ? 'bg-[#551A25] text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Settings size={18} />
          Settings
        </Link>

        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-gray-600 transition-colors hover:bg-gray-100"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </form>

        {/* User Card */}
        {profile && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#551A25] text-xs font-bold text-white">
              {profile.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-gray-900">
                {profile.full_name || 'Account'}
              </p>
              <p className="truncate text-[10px] text-gray-400">{roleDisplay}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
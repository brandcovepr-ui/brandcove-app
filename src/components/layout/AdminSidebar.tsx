'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, LogOut, X } from 'lucide-react'
import { useUser } from '@/lib/hooks/useUser'
import { useAppStore } from '@/lib/stores/useAppStore'
import { useQueryClient } from '@tanstack/react-query'
import { signOutUser } from '@/lib/utils/signout'

export function AdminSidebar({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname()
  const { profile } = useUser()
  const { setProfile } = useAppStore()
  const queryClient = useQueryClient()

  function handleSignOut() {
    signOutUser(() => { setProfile(null); queryClient.clear() })
  }

  const nav = [
    { label: 'Applications', href: '/admin', icon: <LayoutDashboard size={18} /> },
  ]

  return (
    <aside className="w-64 md:w-56 border-r border-gray-200 flex flex-col shrink-0 h-full" style={{ background: '#EFE9E2' }}>
      <div className="px-4 py-5 border-b border-gray-50 flex items-center justify-between">
        <div>
          <Image src="/BrandCovePr.png" alt="BrandCove" width={120} height={32} className="object-contain" />
          <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">Admin</p>
        </div>
        <button
          onClick={onNavClick}
          className="md:hidden p-1 text-gray-500 hover:text-gray-800 rounded transition-colors"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Admin</p>
        {nav.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-[#6b1d2b] text-white font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="px-3 pb-4 border-t border-gray-100 pt-3 space-y-1">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 w-full text-left transition-colors"
        >
          <LogOut size={18} />
          Sign out
        </button>

        {profile && (
          <div className="flex items-center gap-2 px-3 py-2 mt-2">
            <div className="w-7 h-7 rounded-full bg-[#6b1d2b] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {profile.full_name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{profile.full_name}</p>
              <p className="text-[10px] text-gray-400 truncate">Admin</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Search, Bookmark, MessageSquare, Settings, LogOut } from 'lucide-react'
import { useUser } from '@/lib/hooks/useUser'
import { useAppStore } from '@/lib/stores/useAppStore'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { signOutUser } from '@/lib/utils/signout'
import { getReadStateMap } from '@/lib/utils/readState'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: number
}

function useUnreadCount(userId: string | undefined) {
  return useQuery({
    queryKey: ['unread-count', userId],
    queryFn: async () => {
      if (!userId) return 0
      const supabase = createClient()

      // Scope to inquiries the user is part of
      const { data: inquiries } = await supabase
        .from('inquiries')
        .select('id')
        .or(`founder_id.eq.${userId},creative_id.eq.${userId}`)

      if (!inquiries?.length) return 0
      const inquiryIds = inquiries.map((i: { id: string }) => i.id)

      // Fetch messages sent by others in those inquiries
      const { data: messages } = await supabase
        .from('messages')
        .select('id, inquiry_id, created_at')
        .neq('sender_id', userId)
        .in('inquiry_id', inquiryIds)

      if (!messages?.length) return 0

      // Only count messages newer than the last time the user read each conversation
      const readMap = getReadStateMap()
      return messages.filter((msg: { inquiry_id: string; created_at: string }) => {
        const lastRead = readMap[msg.inquiry_id]
        return !lastRead || new Date(msg.created_at) > new Date(lastRead)
      }).length
    },
    enabled: !!userId,
    refetchInterval: 30000,
  })
}

export function Sidebar({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname()
  const { profile } = useUser()
  const { data: unreadCount } = useUnreadCount(profile?.id)

  const mainNav: NavItem[] = [
    { label: 'Dashboard', href: '/founder/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'Browse Talent', href: '/founder/browse', icon: <Search size={18} /> },
  ]

  const hiringNav: NavItem[] = [
    { label: 'Shortlist', href: '/founder/shortlist', icon: <Bookmark size={18} /> },
    { label: 'Messages', href: '/founder/messages', icon: <MessageSquare size={18} />, badge: unreadCount ?? undefined },
  ]

  const { setProfile } = useAppStore()
  const queryClient = useQueryClient()

  function handleSignOut() {
    signOutUser(() => { setProfile(null); queryClient.clear() })
  }

  function NavLink({ item }: { item: NavItem }) {
    const active = pathname === item.href || pathname.startsWith(item.href + '/')
    return (
      <Link
        href={item.href}
        onClick={onNavClick}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
          active
            ? 'bg-[#6b1d2b] text-white font-medium'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        {item.icon}
        <span className="flex-1">{item.label}</span>
        {item.badge ? (
          <span className="bg-[#6b1d2b] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {item.badge > 9 ? '9+' : item.badge}
          </span>
        ) : null}
      </Link>
    )
  }

  return (
    <aside className="w-56 border-r border-gray-200 flex flex-col shrink-0 h-full" style={{ background: '#EFE9E2' }}>
      {/* Logo */}
      <div className="px-4 py-5 ">
        <span className="font-bold text-sm tracking-widest  font-regular font-sans text-gray-900 uppercase">BRANDCOVE</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* Main */}
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Main</p>
        {mainNav.map(item => <NavLink key={item.href} item={item} />)}

        {/* Hiring */}
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mt-4 mb-2 pt-2">Hiring</p>
        {hiringNav.map(item => <NavLink key={item.href} item={item} />)}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4  pt-3 space-y-1">
        <Link
          href="/founder/settings"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
            pathname === '/founder/settings' ? 'bg-[#6b1d2b] text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Settings size={18} />
          Settings
        </Link>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 w-full text-left transition-colors"
        >
          <LogOut size={18} />
          Sign out
        </button>

        {/* User info */}
        {profile && (
          <div className="flex items-center gap-2 px-3 py-2 mt-2">
            <div className="w-7 h-7 rounded-full bg-[#6b1d2b] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {profile.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{profile.full_name}</p>
              <p className="text-[10px] text-gray-400 capitalize truncate">{profile.role}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

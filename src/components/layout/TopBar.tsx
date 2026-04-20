'use client'

import { Menu } from 'lucide-react'

interface TopBarProps {
  onMenuClick: () => void
  action?: React.ReactNode
}

// Mobile-only header bar — hidden on md+ (desktop uses the sidebar instead)
export function TopBar({ onMenuClick, action }: TopBarProps) {
  return (
    <div className="md:hidden h-14 border-b border-gray-100 flex items-center px-4 shrink-0 gap-3 bg-white">
      <button
        onClick={onMenuClick}
        className="p-1.5 -ml-1 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>
      <span className="font-bold text-sm tracking-widest text-gray-900 uppercase flex-1">
        BRANDCOVE
      </span>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

'use client'

import { Menu } from 'lucide-react'

interface TopBarProps {
  onMenuClick: () => void
  action?: React.ReactNode
}

export function TopBar({ onMenuClick, action }: TopBarProps) {
  return (
    <div className="flex h-14 shrink-0 items-center gap-3 border-b border-gray-100 bg-white px-4 md:hidden">
      <button
        type="button"
        onClick={onMenuClick}
        className="-ml-1 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>
      <span className="flex-1 text-sm font-bold tracking-widest text-gray-900 uppercase">
        BRANDCOVE
      </span>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
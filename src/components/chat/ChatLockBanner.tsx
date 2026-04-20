'use client'

import { Lock } from 'lucide-react'
import type { ChatAccessResult } from '@/lib/chat-access'

interface ChatLockBannerProps {
  access: ChatAccessResult
  userRole: 'founder' | 'creative'
  onSendOffer?: () => void
  onBrowseCreatives?: () => void
}

export function ChatLockBanner({
  access,
  userRole,
  onSendOffer,
  onBrowseCreatives,
}: ChatLockBannerProps) {
  if (access.isOpen) return null

  const message =
    userRole === 'founder' ? access.founderMessage : access.creativeMessage

  return (
    <div className="border-t border-gray-100 bg-white px-6 py-6 flex flex-col items-center gap-3 text-center">
      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
        <Lock size={15} className="text-gray-400" />
      </div>

      <p className="text-sm text-gray-500 max-w-xs leading-relaxed">{message}</p>

      {access.showSendOfferButton && userRole === 'founder' && onSendOffer && (
        <button
          onClick={onSendOffer}
          className="mt-1 bg-[#6b1d2b] text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-[#4e1520] transition-colors"
        >
          Send new offer
        </button>
      )}

      {access.showNewInquiryButton && userRole === 'founder' && onBrowseCreatives && (
        <button
          onClick={onBrowseCreatives}
          className="mt-1 border border-gray-200 text-gray-700 text-sm font-medium px-5 py-2.5 rounded-full hover:bg-gray-50 transition-colors"
        >
          Browse other creatives
        </button>
      )}
    </div>
  )
}

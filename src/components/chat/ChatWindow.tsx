'use client'

import { useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useChat } from '@/lib/hooks/useChat'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { ChatLockBanner } from './ChatLockBanner'
import { isToday, isYesterday, format } from 'date-fns'
import { markInquiryAsRead } from '@/lib/utils/readState'

interface Props {
  inquiryId: string
  currentUserId: string
  userRole: 'founder' | 'creative'
  recipientName?: string
  onSendOffer?: () => void
}

function dateSeparatorLabel(dateStr: string) {
  const d = new Date(dateStr)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'MMM d, yyyy')
}

export function ChatWindow({
  inquiryId,
  currentUserId,
  userRole,
  recipientName,
  onSendOffer,
}: Props) {
  const { messages, loading, sendMessage, chatAccess } = useChat(inquiryId)
  const bottomRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const router = useRouter()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Mark as read whenever the user is actively viewing this conversation
  useEffect(() => {
    markInquiryAsRead(inquiryId)
    queryClient.invalidateQueries({ queryKey: ['unread-count'] })
    queryClient.invalidateQueries({ queryKey: ['creative-unread'] })
  }, [inquiryId, messages.length])

  // Build list with date separators
  const items: Array<
    { type: 'separator'; label: string } | { type: 'message'; msg: (typeof messages)[0] }
  > = []
  let lastDay = ''
  for (const msg of messages) {
    const day = format(new Date(msg.created_at), 'yyyy-MM-dd')
    if (day !== lastDay) {
      items.push({ type: 'separator', label: dateSeparatorLabel(msg.created_at) })
      lastDay = day
    }
    items.push({ type: 'message', msg })
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#faf9f7]">
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-[#6b1d2b] rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-gray-400">
            No messages yet. Start the conversation!
          </div>
        ) : (
          items.map((item, i) =>
            item.type === 'separator' ? (
              <div key={`sep-${i}`} className="flex items-center justify-center">
                <span className="text-[11px] text-gray-400 bg-[#faf9f7] px-3">
                  {item.label}
                </span>
              </div>
            ) : (
              <ChatMessage
                key={item.msg.id}
                message={item.msg}
                isOwn={item.msg.sender_id === currentUserId}
              />
            )
          )
        )}
        <div ref={bottomRef} />
      </div>

      {chatAccess.isOpen ? (
        <ChatInput
          onSend={async (content) => {
            await sendMessage(content, currentUserId)
            // Notify the recipient by email — fire and forget
            fetch('/api/email/message', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                inquiry_id: inquiryId,
                sender_id: currentUserId,
                preview: content.slice(0, 200),
              }),
            }).catch(() => {})
          }}
          recipientName={recipientName}
        />
      ) : (
        <ChatLockBanner
          access={chatAccess}
          userRole={userRole}
          onSendOffer={onSendOffer}
          onBrowseCreatives={() => router.push('/browse')}
        />
      )}
    </div>
  )
}

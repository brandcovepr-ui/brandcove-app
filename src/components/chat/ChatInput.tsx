'use client'

import { useState } from 'react'
import { Paperclip, Send } from 'lucide-react'

interface Props {
  onSend: (content: string) => void
  recipientName?: string
}

export function ChatInput({ onSend, recipientName }: Props) {
  const [value, setValue] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSend() {
    const trimmed = value.trim()
    if (!trimmed || sending) return
    setSending(true)
    setValue('')
    await onSend(trimmed)
    setSending(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-gray-100 bg-white px-5 py-4">
      <div className="flex items-end gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
        <button className="text-gray-400 hover:text-gray-600 transition-colors shrink-0 pb-0.5">
          <Paperclip size={17} />
        </button>
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={recipientName ? `Reply to ${recipientName}…` : 'Write a message…'}
          rows={1}
          className="flex-1 bg-transparent text-sm resize-none focus:outline-none max-h-32 overflow-y-auto"
        />
        <button
          onClick={handleSend}
          disabled={!value.trim() || sending}
          className="flex items-center gap-1.5 bg-[#6b1d2b] text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-[#4e1520] transition-colors disabled:opacity-40 shrink-0"
        >
          Send
          <Send size={13} />
        </button>
      </div>
    </div>
  )
}

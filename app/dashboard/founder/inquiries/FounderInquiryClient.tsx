'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ArrowLeftCircle, CheckCircle, Send, Sparkles, Loader2 } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import { sendMessageAction, updateInquiryStatusAction } from './actions'
interface Props {
  inquiries: any[]
  selectedId: string | null
  initialMessages: any[]
  userId: string
}

export function FounderInquiryClient({ inquiries, selectedId, initialMessages, userId }: Props) {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const [messages, setMessages] = useState(initialMessages)
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Sync state when server props update
  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Realtime subscription for messages
  useEffect(() => {
    if (!selectedId) return

    const channel = supabase
      .channel(`realtime-messages-${selectedId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `inquiry_id=eq.${selectedId}` },
        (payload) => {
          const newMsg = payload.new
          setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedId])

  const selectedInquiry = inquiries.find((i) => i.id === selectedId) || null
  const creative = selectedInquiry?.creative
  const cp = Array.isArray(creative?.creative_profiles)
    ? creative.creative_profiles[0]
    : creative?.creative_profiles

  const handleSelect = (id: string | null) => {
    const params = new URLSearchParams()
    if (id) params.set('id', id)
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !selectedId) return

    const content = inputText
    setInputText('')

    startTransition(async () => {
      await sendMessageAction(selectedId, content)
    })
  }

  const handleStatusUpdate = (status: 'hired' | 'declined') => {
    if (!selectedId) return
    startTransition(async () => {
      await updateInquiryStatusAction(selectedId, status)
    })
  }

  // ── DETAIL / CHAT VIEW ────────────────────────────────────────────────────
  if (selectedId && selectedInquiry) {
    const isHired = selectedInquiry.status === 'hired' || selectedInquiry.status === 'accepted'
    const isDeclined = selectedInquiry.status === 'declined' || selectedInquiry.status === 'cancelled'

    return (
      <div className="flex flex-col h-full min-h-0 bg-white">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSelect(null)}
              className="text-gray-400 hover:text-gray-700 transition-colors"
            >
              <ArrowLeftCircle size={22} />
            </button>
            <div>
              <p className="text-sm font-semibold text-gray-900">{creative?.full_name}</p>
              {cp?.discipline && <p className="text-xs text-gray-400">{cp.discipline}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isHired && !isDeclined && (
              <>
                <button
                  onClick={() => handleStatusUpdate('declined')}
                  disabled={isPending}
                  className="text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-md hover:bg-gray-200 disabled:opacity-50"
                >
                  Not a fit
                </button>
                <button
                  onClick={() => handleStatusUpdate('hired')}
                  disabled={isPending}
                  className="text-xs text-white bg-[#6b1d2b] px-3 py-1.5 rounded-md hover:bg-[#4e1520] disabled:opacity-50"
                >
                  Confirm hire
                </button>
              </>
            )}
            {isHired && (
              <span className="text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-full flex items-center gap-1">
                <CheckCircle size={12} /> Hired
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Chat Panel */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-4 bg-gray-50 border-b border-gray-100 shrink-0">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Original Project Description
              </p>
              <p className="text-xs text-gray-700 leading-relaxed">{selectedInquiry.project_description}</p>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => {
                const isMe = msg.sender_id === userId
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-xs ${
                        isMe ? 'bg-[#6b1d2b] text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 px-1">
                      {format(new Date(msg.created_at), 'h:mm a')}
                    </span>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Send Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 flex gap-2 shrink-0">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Write a message..."
                className="flex-1 text-xs border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#6b1d2b]"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isPending}
                className="bg-[#6b1d2b] text-white p-2.5 rounded-lg disabled:opacity-50"
              >
                {isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:flex w-56 border-l border-gray-100 p-6 flex-col gap-6 bg-[#F6F3EF]">
            {selectedInquiry.budget && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Budget</p>
                <p className="text-lg font-bold text-gray-900">₦{Number(selectedInquiry.budget).toLocaleString()}</p>
              </div>
            )}
            {cp?.skills?.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Skills</p>
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Sparkles size={12} className="text-gray-400" />
                  <span>{cp.skills.slice(0, 2).join(', ')}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── LIST VIEW ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-8 py-5 border-b border-gray-100 shrink-0">
        <h1 className="text-2xl font-serif text-gray-900">Your Inquiries</h1>
      </div>

      <div className="p-8 flex-1 overflow-y-auto">
        {inquiries.length > 0 ? (
          <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100">
            {inquiries.map((inq) => {
              const c = inq.creative
              return (
                <button
                  key={inq.id}
                  onClick={() => handleSelect(inq.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center font-bold text-xs text-gray-700">
                      {c?.full_name?.[0] || 'C'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{c?.full_name}</p>
                      <p className="text-xs text-gray-400 line-clamp-1">{inq.project_description}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400">{format(new Date(inq.updated_at), 'MMM d')}</span>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p className="text-sm">No inquiries found.</p>
            <Link href="/founder/browse" className="text-xs text-[#6b1d2b] font-medium underline mt-2 block">
              Browse Creatives
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
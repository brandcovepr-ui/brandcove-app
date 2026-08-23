'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Send, Lock, AlertCircle } from 'lucide-react'
import { computeChatAccess } from '@/lib/utils'
import { Inquiry,Offer } from '@/lib/types/inquiry'
import { useInquiryActions } from '@/app/hooks/useInquiryActions'
import { Avatar } from './Avatar'
import { ConfirmationModal } from './ConfirmationModal'
import { getSupabaseBrowserClient,  } from '@/lib/supabase/browser-client'
interface InquiryChatShellProps {
  inquiry: Inquiry
  profileId: string
  offer?: Offer
}

export function InquiryChatShell({ inquiry, profileId, offer }: InquiryChatShellProps) {
  const router = useRouter()
  const [replyText, setReplyText] = useState('')
  const threadBottomRef = useRef<HTMLDivElement>(null)

  const {
    sending,
    accepting,
    declining,
    decliningOffer,
    actionError,
    confirmModal,
    setActionError,
    setConfirmModal,
    sendReply,
    confirmAction,
  } = useInquiryActions({
    profileId,
    selectedId: inquiry.id,
    onInquiryDeclined: () => router.push('/creator/inquiries'),
  })

  // Realtime subscription for incoming messages & offer updates
  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    const channel = supabase
      .channel(`creative-offer-watch-${inquiry.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offers', filter: `inquiry_id=eq.${inquiry.id}` }, () => {
        router.refresh()
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `inquiry_id=eq.${inquiry.id}` }, () => {
        router.refresh()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [inquiry.id, router])

  useEffect(() => {
    threadBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [inquiry.messages?.length])

  const founder = inquiry.founder
  const fp = Array.isArray(founder?.founder_profiles) ? founder.founder_profiles[0] : founder?.founder_profiles
  const founderName = founder?.full_name || 'the founder'
  const companyName = fp?.company_name || null

  const isDeclined = inquiry.status === 'declined'
  const isCancelled = inquiry.status === 'cancelled'
  const isAccepted = inquiry.status === 'accepted' || inquiry.status === 'hired'
  const hasPendingOffer = offer && offer.status === 'pending'

  const chatAccess = computeChatAccess({
    inquiryStatus: inquiry.status,
    latestOfferStatus: offer?.status ?? null,
  })

  const thread = [...(inquiry.messages || [])]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .filter((m) => m.content !== inquiry.project_description)

  const handleSend = async () => {
    try {
      await sendReply(replyText, () => setReplyText(''))
      router.refresh()
    } catch (failedContent: any) {
      if (typeof failedContent === 'string') setReplyText(failedContent)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Top Action Bar */}
      <div className="px-4 md:px-8 py-3 md:py-4 border-b border-gray-100 shrink-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-base md:text-lg font-bold text-gray-900 leading-snug">
            {companyName ? (
              <>
                <span>{companyName}</span>
                <span className="text-gray-400 font-normal text-sm md:text-base"> · {founderName}</span>
              </>
            ) : (
             ""
            )}
           
          </h2>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {hasPendingOffer && !isDeclined && !isAccepted && (
              <>
                <button
                  onClick={() => { setActionError(''); setConfirmModal({ type: 'accept_offer', offerId: offer.id }) }}
                  disabled={accepting || decliningOffer}
                  className="bg-[#6b1d2b] text-white text-xs font-medium px-4 py-2 rounded-full hover:bg-[#4e1520] transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {accepting ? 'Accepting…' : 'Accept Offer'}
                </button>
                <button
                  onClick={() => { setActionError(''); setConfirmModal({ type: 'decline_offer', offerId: offer.id }) }}
                  disabled={accepting || decliningOffer}
                  className="text-xs font-medium text-gray-600 border border-gray-200 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {decliningOffer ? 'Declining…' : 'Decline Offer'}
                </button>
              </>
            )}
            {!hasPendingOffer && !isDeclined && !isAccepted && !isCancelled && (
              <>
                <button
                  onClick={() => { setActionError(''); setConfirmModal({ type: 'accept' }) }}
                  disabled={accepting || declining}
                  className="bg-[#6b1d2b] text-white text-xs font-medium px-4 py-2 rounded-full hover:bg-[#4e1520] transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {accepting ? 'Accepting…' : 'Accept'}
                </button>
                <button
                  onClick={() => { setActionError(''); setConfirmModal({ type: 'decline' }) }}
                  disabled={accepting || declining}
                  className="text-xs font-medium text-gray-600 border border-gray-200 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  {declining ? 'Declining…' : 'Decline'}
                </button>
              </>
            )}
            {isAccepted && <span className="text-xs font-medium text-green-600 bg-green-50 border border-green-100 px-4 py-2 rounded-full whitespace-nowrap">Offer accepted</span>}
            {isDeclined && <span className="text-xs font-medium text-red-500 bg-red-50 border border-red-100 px-4 py-2 rounded-full">Declined</span>}
            {isCancelled && <span className="text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 px-4 py-2 rounded-full">Cancelled</span>}
          </div>
        </div>

        {actionError && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-600">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <p>{actionError}</p>
          </div>
        )}
      </div>

      {/* Message History */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar name={founder?.full_name} url={founder?.avatar_url} size="md" />
              <div>
                <p className="text-sm font-semibold text-gray-900">{founder?.full_name || 'Founder'}</p>
                {companyName && <p className="text-xs text-gray-400">{companyName}</p>}
              </div>
            </div>
            <p className="text-xs text-gray-400 shrink-0 ml-4">{format(new Date(inquiry.created_at), 'MMM d, yyyy')}</p>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{inquiry.project_description}</p>
          {offer?.terms && (
            <div className="mt-5 pt-5 border-t border-gray-50">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Formal Offer Terms</p>
              <p className="text-sm text-gray-700 leading-relaxed">{offer.terms}</p>
            </div>
          )}
        </div>

        {thread.map((msg) => {
          const isOwn = msg.sender_id === profileId
          return (
            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs md:max-w-md rounded-2xl px-4 py-3 text-sm leading-relaxed ${isOwn ? 'bg-[#6b1d2b] text-white rounded-br-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'}`}>
                <p>{msg.content}</p>
                <p className={`text-[10px] mt-1.5 ${isOwn ? 'text-[#d4a0a8]' : 'text-gray-400'}`}>{format(new Date(msg.created_at), 'h:mm a')}</p>
              </div>
            </div>
          )
        })}
        <div ref={threadBottomRef} />
      </div>

      {/* Input Box */}
      <div className="shrink-0 bg-white border-t border-gray-100 px-4 md:px-8 py-4">
        {chatAccess.isOpen ? (
          <>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={hasPendingOffer ? 'Counter the offer or ask a question…' : 'Your reply to the founder…'}
              rows={2}
              className="w-full text-sm text-gray-700 placeholder-gray-300 resize-none focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend()
              }}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-[10px] text-gray-300 hidden md:block">⌘ + Enter to send</p>
              <button
                onClick={handleSend}
                disabled={!replyText.trim() || sending}
                className="flex items-center gap-2 bg-[#6b1d2b] text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-[#4e1520] transition-colors disabled:opacity-40 ml-auto"
              >
                {sending ? 'Sending…' : 'Send'}
                <Send size={13} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <Lock size={13} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">{chatAccess.creativeMessage}</p>
          </div>
        )}
      </div>

      {confirmModal && (
        <ConfirmationModal
          modal={confirmModal}
          actionError={actionError}
          accepting={accepting}
          declining={declining}
          decliningOffer={decliningOffer}
          onClose={() => { setActionError(''); setConfirmModal(null) }}
          onConfirm={confirmAction}
        />
      )}
    </div>
  )
}
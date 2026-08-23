'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { AlertCircle, ChevronRight, Send, Lock } from 'lucide-react'
import { computeChatAccess } from '@/lib/utils'
import { sendReplyAction, updateInquiryStatusAction, respondToOfferAction } from './actions'

function Avatar({ name, url, size = 'md' }: { name?: string | null; url?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'lg' ? 'w-12 h-12 text-lg' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-11 h-11 text-base'
  return (
    <div className={`${dim} rounded-full bg-[#d4a0a8] flex items-center justify-center text-white font-semibold shrink-0 overflow-hidden`}>
      {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : name?.[0]?.toUpperCase() || 'F'}
    </div>
  )
}

interface InquiryDetailClientProps {
  inquiry: any
  currentUserId: string
}

export function InquiryDetailClient({ inquiry, currentUserId }: InquiryDetailClientProps) {
  const router = useRouter()
  const [replyText, setReplyText] = useState('')
  const [actionError, setActionError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [confirmModal, setConfirmModal] = useState<{
    type: 'accept' | 'decline' | 'accept_offer' | 'decline_offer'
    offerId?: string
  } | null>(null)

  const threadBottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    threadBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [inquiry?.messages?.length])

  const founder = inquiry.founder as any
  const fp = Array.isArray(founder?.founder_profiles) ? founder.founder_profiles[0] : founder?.founder_profiles
  const founderName = founder?.full_name || 'the founder'
  const companyName = fp?.company_name || null
  const industry = fp?.industry || null

  const sortedOffers = [...(inquiry.offers || [])].sort(
    (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  const offer = sortedOffers[0] as any
  const latestOfferStatus: string | null = offer?.status ?? null

  const displayRate = offer?.rate ?? inquiry.budget
  const isDeclined = inquiry.status === 'declined'
  const isCancelled = inquiry.status === 'cancelled'
  const isAccepted = inquiry.status === 'accepted' || inquiry.status === 'hired'
  const hasPendingOffer = offer && offer.status === 'pending'

  const chatAccess = computeChatAccess({
    inquiryStatus: inquiry.status,
    latestOfferStatus,
  })

  const thread = [...(inquiry.messages || [])]
    .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .filter((m: any) => m.content !== inquiry.project_description)

  function handleSendReply() {
    if (!replyText.trim() || isPending) return
    const content = replyText
    setReplyText('')

    startTransition(async () => {
      const res = await sendReplyAction(inquiry.id, content)
      if (res?.error) {
        setActionError(res.error)
        setReplyText(content)
      } else {
        router.refresh()
      }
    })
  }

  function handleConfirmAction() {
    if (!confirmModal || isPending) return
    setActionError('')
  
    startTransition(async () => {
      let res: { error?: string; success?: boolean } = {}
  
      if (confirmModal.type === 'accept') {
        // Set inquiry status to 'accepted'
        res = await updateInquiryStatusAction(inquiry.id, 'accepted')
      } else if (confirmModal.type === 'decline') {
        res = await updateInquiryStatusAction(inquiry.id, 'declined')
        if (res.success) {
          router.push('/inquiries')
          return
        }
      } else if (confirmModal.type === 'accept_offer' && confirmModal.offerId) {
        res = await respondToOfferAction(inquiry.id, confirmModal.offerId, 'accepted')
      } else if (confirmModal.type === 'decline_offer' && confirmModal.offerId) {
        res = await respondToOfferAction(inquiry.id, confirmModal.offerId, 'declined')
      }
  
      if (res?.error) {
        setActionError(res.error)
      } else {
        setConfirmModal(null)
        router.refresh()
      }
    })
  }
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Breadcrumb Header */}
      <div className="px-4 md:px-8 py-4 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <Link
            href="/inquiries"
            className="font-editorial text-lg md:text-2xl text-gray-400 hover:text-gray-700 transition-colors leading-none"
          >
            Inquiries
          </Link>
          <ChevronRight size={16} className="text-gray-300 shrink-0" />
          <span className="font-editorial text-lg md:text-2xl text-gray-900 leading-none truncate">
            {companyName || founderName}
          </span>
        </div>
      </div>

      {/* Action Header */}
      <div className="px-4 md:px-8 py-3 md:py-4 shrink-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-base md:text-lg font-bold text-gray-900 leading-snug">
            {companyName ? (
              <>
                <span>{companyName}</span>
                <span className="text-gray-400 font-normal text-sm md:text-base"> · {founderName}</span>
              </>
            ) : ""}
          </h2>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {hasPendingOffer && !isDeclined && !isAccepted && (
              <>
                <button
                  onClick={() => setConfirmModal({ type: 'accept_offer', offerId: offer.id })}
                  disabled={isPending}
                  className="bg-[#6b1d2b] text-white text-xs font-medium px-4 py-2 rounded-full hover:bg-[#4e1520] transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  Accept Offer
                </button>
                <button
                  onClick={() => setConfirmModal({ type: 'decline_offer', offerId: offer.id })}
                  disabled={isPending}
                  className="text-xs font-medium text-gray-600 border border-gray-200 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  Decline Offer
                </button>
              </>
            )}
            {!hasPendingOffer && !isDeclined && !isAccepted && !isCancelled && (
              <>
                <button
                  onClick={() => setConfirmModal({ type: 'accept' })}
                  disabled={isPending}
                  className="bg-[#6b1d2b] text-white text-xs font-medium px-4 py-2 rounded-full hover:bg-[#4e1520] transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  Accept
                </button>
                <button
                  onClick={() => setConfirmModal({ type: 'decline' })}
                  disabled={isPending}
                  className="text-xs font-medium text-gray-600 border border-gray-200 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  Decline
                </button>
              </>
            )}
            {isAccepted && (
              <span className="text-xs font-medium text-green-600 bg-green-50 border border-green-100 px-4 py-2 rounded-full whitespace-nowrap">
                Offer accepted
              </span>
            )}
            {isDeclined && (
              <span className="text-xs font-medium text-red-500 bg-red-50 border border-red-100 px-4 py-2 rounded-full">
                Declined
              </span>
            )}
            {isCancelled && (
              <span className="text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 px-4 py-2 rounded-full">
                Cancelled
              </span>
            )}
          </div>
        </div>
        {actionError && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-600">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <p>{actionError}</p>
          </div>
        )}
      </div>

      {/* Body: Chat & Sidebar */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0">
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
                <p className="text-xs text-gray-400 shrink-0 ml-4">
                  {format(new Date(inquiry.created_at), 'MMM d, yyyy')}
                </p>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{inquiry.project_description}</p>
              {offer?.terms && (
                <div className="mt-5 pt-5 border-t border-gray-50">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Formal Offer Terms</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{offer.terms}</p>
                </div>
              )}
            </div>

            {thread.map((msg: any) => {
              const isOwn = msg.sender_id === currentUserId
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-xs md:max-w-md rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      isOwn
                        ? 'bg-[#6b1d2b] text-white rounded-br-sm'
                        : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className={`text-[10px] mt-1.5 ${isOwn ? 'text-[#d4a0a8]' : 'text-gray-400'}`}>
                      {format(new Date(msg.created_at), 'h:mm a')}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={threadBottomRef} />
          </div>

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
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSendReply()
                  }}
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[10px] text-gray-300 hidden md:block">⌘ + Enter to send</p>
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || isPending}
                    className="flex items-center gap-2 bg-[#6b1d2b] text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-[#4e1520] transition-colors disabled:opacity-40 ml-auto"
                  >
                    {isPending ? 'Sending…' : 'Send'}
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
        </div>

        {/*<div className="hidden md:flex w-56 lg:w-64 shrink-0 border-l border-gray-100 flex-col overflow-y-auto p-6 space-y-6" style={{ background: '#EFE9E2' }}>
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Founder</p>
            <div className="flex items-center gap-2.5">
              <Avatar name={founder?.full_name} url={founder?.avatar_url} size="sm" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{founder?.full_name || '—'}</p>
                {companyName && <p className="text-xs text-gray-500 truncate">{companyName}</p>}
                {industry && <p className="text-xs text-gray-400 truncate">{industry}</p>}
              </div>
            </div>
            {fp?.website_url && (
              <a
                href={fp.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-[#6b1d2b] font-medium hover:underline mt-3"
              >
                <Globe size={12} />
                View website
              </a>
            )}
          </div>

          {displayRate != null && (
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Budget</p>
              <p className="text-2xl font-bold text-gray-900">₦{Number(displayRate).toLocaleString()}</p>
              <p className="text-xs text-gray-500">/ month</p>
            </div>
          )}

          {inquiry.timeline && (
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Timeline</p>
              <p className="text-sm font-semibold text-gray-900">{inquiry.timeline}</p>
            </div>
          )}

          {offer?.start_date && (
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Start Date</p>
              <p className="text-sm font-semibold text-gray-900">{format(new Date(offer.start_date), 'MMM d, yyyy')}</p>
            </div>
          )}

          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</p>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                isAccepted
                  ? 'bg-green-100 text-green-700'
                  : isDeclined
                  ? 'bg-red-100 text-red-700'
                  : isCancelled
                  ? 'bg-gray-100 text-gray-600'
                  : hasPendingOffer
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {isAccepted
                ? 'Accepted'
                : isDeclined
                ? 'Declined'
                : isCancelled
                ? 'Cancelled'
                : hasPendingOffer
                ? 'Offer pending'
                : 'Active'}
            </span>
          </div>
        </div>*/}
      </div>

      {confirmModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              {confirmModal.type.includes('accept') ? 'Accept this request?' : 'Decline this request?'}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {confirmModal.type.includes('accept')
                ? 'This will update the inquiry status and notify the founder.'
                : 'This action will reject the current proposal and notify the founder.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                disabled={isPending}
                className="flex-1 border border-gray-200 rounded-full py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Go back
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={isPending}
                className={`flex-1 rounded-full py-2.5 text-sm font-medium text-white transition-colors ${
                  confirmModal.type.includes('decline') ? 'bg-red-500 hover:bg-red-600' : 'bg-[#6b1d2b] hover:bg-[#4e1520]'
                } disabled:opacity-50`}
              >
                {isPending ? 'Processing…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
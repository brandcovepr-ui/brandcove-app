'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/useUser'
import { formatDistanceToNow, format } from 'date-fns'
import { ChevronRight, Globe, Send, MessageSquare, Lock } from 'lucide-react'
import { markInquiryAsRead } from '@/lib/utils/readState'
import { computeChatAccess } from '@/lib/chat-access'

type Tab = 'all' | 'replied' | 'declined'

function relativeTime(dateStr: string) {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
    .replace('about ', '')
    .replace('less than a minute ago', 'Just now')
}

function Avatar({
  name,
  url,
  size = 'md',
}: {
  name?: string | null
  url?: string | null
  size?: 'sm' | 'md' | 'lg'
}) {
  const dim =
    size === 'lg' ? 'w-12 h-12 text-lg' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-11 h-11 text-base'
  return (
    <div
      className={`${dim} rounded-full bg-[#d4a0a8] flex items-center justify-center text-white font-semibold shrink-0 overflow-hidden`}
    >
      {url ? (
        <img src={url} alt="" className="w-full h-full object-cover" />
      ) : (
        name?.[0]?.toUpperCase() || 'F'
      )}
    </div>
  )
}

export default function CreatorInquiriesPage() {
  const { profile } = useUser()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [declining, setDeclining] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [decliningOffer, setDecliningOffer] = useState(false)
  const [confirmModal, setConfirmModal] = useState<{
    type: 'accept' | 'decline' | 'accept_offer' | 'decline_offer'
    offerId?: string
  } | null>(null)
  const threadBottomRef = useRef<HTMLDivElement>(null)

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ['creative-inquiries', profile?.id],
    staleTime: 0,
    queryFn: async () => {
      if (!profile?.id) return []
      const supabase = createClient()
      const { data } = await supabase
        .from('inquiries')
        .select(`
          id, status, updated_at, created_at, project_description, timeline, budget,
          founder:profiles!founder_id(
            id, full_name, avatar_url,
            founder_profiles(company_name, industry, website_url, company_description)
          ),
          messages(id, content, created_at, sender_id),
          offers(id, rate, terms, start_date, status, created_at)
        `)
        .eq('creative_id', profile.id)
        .order('updated_at', { ascending: false })
      return data || []
    },
    enabled: !!profile?.id,
  })

  function hasReplied(inq: any) {
    return inq.messages?.some((m: any) => m.sender_id === profile?.id)
  }

  const filtered = inquiries.filter((inq: any) => {
    if (tab === 'declined') return inq.status === 'declined'
    if (tab === 'replied') return hasReplied(inq) && inq.status !== 'declined'
    return true
  })

  const selected: any = inquiries.find((i: any) => i.id === selectedId) ?? null

  useEffect(() => {
    if (!selectedId) return
    markInquiryAsRead(selectedId)
    queryClient.invalidateQueries({ queryKey: ['creative-unread'] })
  }, [selectedId])

  useEffect(() => {
    threadBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selected?.messages?.length])

  useEffect(() => {
    if (!selectedId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`creative-offer-watch-${selectedId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'offers', filter: `inquiry_id=eq.${selectedId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['creative-inquiries', profile?.id] })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'offers', filter: `inquiry_id=eq.${selectedId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['creative-inquiries', profile?.id] })
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `inquiry_id=eq.${selectedId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['creative-inquiries', profile?.id] })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [selectedId, profile?.id])

  async function sendReply() {
    if (!replyText.trim() || !profile || !selectedId) return
    setSending(true)
    const supabase = createClient()
    await supabase.from('messages').insert({
      inquiry_id: selectedId,
      sender_id: profile.id,
      content: replyText.trim(),
    })
    await supabase
      .from('inquiries')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', selectedId)
    fetch('/api/email/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inquiry_id: selectedId, sender_id: profile.id, preview: replyText.trim().slice(0, 200) }),
    }).catch(() => {})
    setReplyText('')
    setSending(false)
    queryClient.invalidateQueries({ queryKey: ['creative-inquiries', profile.id] })
  }

  async function confirmAction() {
    if (!confirmModal || !selectedId || !profile) return
    const supabase = createClient()

    if (confirmModal.type === 'accept') {
      setAccepting(true)
      setConfirmModal(null)
      await supabase.from('inquiries').update({ status: 'hired' }).eq('id', selectedId)
      setAccepting(false)
      await queryClient.invalidateQueries({ queryKey: ['creative-inquiries', profile.id] })
    }

    if (confirmModal.type === 'decline') {
      setDeclining(true)
      setConfirmModal(null)
      await supabase.from('inquiries').update({ status: 'declined' }).eq('id', selectedId)
      setDeclining(false)
      await queryClient.invalidateQueries({ queryKey: ['creative-inquiries', profile.id] })
      setSelectedId(null)
    }

    if (confirmModal.type === 'accept_offer' && confirmModal.offerId) {
      setAccepting(true)
      setConfirmModal(null)
      await supabase.from('offers').update({ status: 'accepted' }).eq('id', confirmModal.offerId)
      await supabase.from('inquiries').update({ status: 'accepted' }).eq('id', selectedId)
      fetch('/api/email/offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inquiry_id: selectedId, action: 'accepted' }),
      }).catch(() => {})
      setAccepting(false)
      await queryClient.invalidateQueries({ queryKey: ['creative-inquiries', profile.id] })
    }

    if (confirmModal.type === 'decline_offer' && confirmModal.offerId) {
      setDecliningOffer(true)
      setConfirmModal(null)
      await createClient().from('offers').update({ status: 'declined' }).eq('id', confirmModal.offerId)
      fetch('/api/email/offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inquiry_id: selectedId, action: 'declined' }),
      }).catch(() => {})
      setDecliningOffer(false)
      await queryClient.invalidateQueries({ queryKey: ['creative-inquiries', profile.id] })
    }
  }

  // ── Chat / detail view ─────────────────────────────────────────────────────
  if (selectedId && selected) {
    const founder = selected.founder as any
    const fp = Array.isArray(founder?.founder_profiles) ? founder.founder_profiles[0] : founder?.founder_profiles
    const founderName = founder?.full_name || 'the founder'
    const companyName = fp?.company_name || null
    const industry = fp?.industry || null

    const sortedOffers = [...(selected.offers || [])].sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    const offer = sortedOffers[0] as any
    const latestOfferStatus: string | null = offer?.status ?? null

    const displayRate = offer?.rate ?? selected.budget
    const isDeclined = selected.status === 'declined'
    const isCancelled = selected.status === 'cancelled'
    const isAccepted = selected.status === 'accepted' || selected.status === 'hired'
    const hasPendingOffer = offer && offer.status === 'pending'

    const chatAccess = computeChatAccess({
      inquiryStatus: selected.status,
      latestOfferStatus,
    })

    const thread = [...(selected.messages || [])]
      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .filter((m: any) => m.content !== selected.project_description)

    return (
      <div className="flex flex-col h-full min-h-0">

        {/* ── Persistent header: breadcrumb ── */}
        <div className="px-4 md:px-8 py-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedId(null)}
              className="font-editorial text-2xl text-gray-400 hover:text-gray-700 transition-colors leading-none"
            >
              Inquiries
            </button>
            <ChevronRight size={16} className="text-gray-300 shrink-0" />
            <span className="font-editorial text-2xl text-gray-900 leading-none truncate">
              {companyName || founderName}
            </span>
          </div>
        </div>

        {/* ── "Wants to work with you" + action buttons (no bg, blends) ── */}
        <div className="px-4 md:px-8 py-4 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-bold text-gray-900 leading-snug">
              {companyName ? (
                <>
                  <span>{companyName}</span>
                  <span className="text-gray-400 font-normal text-base"> · {founderName}</span>
                </>
              ) : founderName}{' '}
              wants to work with you.
            </h2>

            <div className="flex items-center gap-2 shrink-0">
              {hasPendingOffer && !isDeclined && !isAccepted && (
                <>
                  <button
                    onClick={() => setConfirmModal({ type: 'accept_offer', offerId: offer.id })}
                    disabled={accepting}
                    className="bg-[#6b1d2b] text-white text-xs font-medium px-4 py-2 rounded-full hover:bg-[#4e1520] transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {accepting ? 'Accepting…' : 'Accept Offer'}
                  </button>
                  <button
                    onClick={() => setConfirmModal({ type: 'decline_offer', offerId: offer.id })}
                    disabled={decliningOffer}
                    className="text-xs font-medium text-gray-600 border border-gray-200 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {decliningOffer ? 'Declining…' : 'Decline Offer'}
                  </button>
                </>
              )}
              {!hasPendingOffer && !isDeclined && !isAccepted && !isCancelled && (
                <>
                  <button
                    onClick={() => setConfirmModal({ type: 'accept' })}
                    disabled={accepting}
                    className="bg-[#6b1d2b] text-white text-xs font-medium px-4 py-2 rounded-full hover:bg-[#4e1520] transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {accepting ? 'Accepting…' : 'Accept'}
                  </button>
                  <button
                    onClick={() => setConfirmModal({ type: 'decline' })}
                    disabled={declining}
                    className="text-xs font-medium text-gray-600 border border-gray-200 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    {declining ? 'Declining…' : 'Decline'}
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
        </div>

        {/* ── Body: chat + sidebar ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 space-y-4">
              {/* Original inquiry card */}
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
                    {format(new Date(selected.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {selected.project_description}
                </p>
                {offer?.terms && (
                  <div className="mt-5 pt-5 border-t border-gray-50">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Formal Offer Terms
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">{offer.terms}</p>
                  </div>
                )}
              </div>

              {thread.map((msg: any) => {
                const isOwn = msg.sender_id === profile?.id
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

            {/* Reply input */}
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
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendReply()
                    }}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[10px] text-gray-300 hidden md:block">⌘ + Enter to send</p>
                    <button
                      onClick={sendReply}
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
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {chatAccess.creativeMessage}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div
            className="hidden md:flex w-56 lg:w-64 shrink-0 border-l border-gray-100 flex-col overflow-y-auto p-6 space-y-6"
            style={{ background: '#EFE9E2' }}
          >
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

            {selected.timeline && (
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Timeline</p>
                <p className="text-sm font-semibold text-gray-900">{selected.timeline}</p>
              </div>
            )}

            {offer?.start_date && (
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Start Date</p>
                <p className="text-sm font-semibold text-gray-900">
                  {format(new Date(offer.start_date), 'MMM d, yyyy')}
                </p>
              </div>
            )}

            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</p>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                isAccepted ? 'bg-green-100 text-green-700' :
                isDeclined ? 'bg-red-100 text-red-700' :
                isCancelled ? 'bg-gray-100 text-gray-600' :
                hasPendingOffer ? 'bg-blue-100 text-blue-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {isAccepted ? 'Accepted' : isDeclined ? 'Declined' : isCancelled ? 'Cancelled' : hasPendingOffer ? 'Offer pending' : 'Active'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Confirmation modal ── */}
        {confirmModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
              {confirmModal.type === 'accept' && (
                <>
                  <h2 className="text-base font-semibold text-gray-900 mb-2">Accept this inquiry?</h2>
                  <p className="text-sm text-gray-500 mb-6">
                    This will open a conversation with the founder so you can discuss the project and next steps.
                  </p>
                </>
              )}
              {confirmModal.type === 'decline' && (
                <>
                  <h2 className="text-base font-semibold text-gray-900 mb-2">Decline this inquiry?</h2>
                  <p className="text-sm text-gray-500 mb-6">
                    The founder will be notified that you are not available for this project. This cannot be undone.
                  </p>
                </>
              )}
              {confirmModal.type === 'accept_offer' && (
                <>
                  <h2 className="text-base font-semibold text-gray-900 mb-2">Accept this offer?</h2>
                  <p className="text-sm text-gray-500 mb-6">
                    You are agreeing to the terms set by the founder. The founder will be notified and you can continue chatting.
                  </p>
                </>
              )}
              {confirmModal.type === 'decline_offer' && (
                <>
                  <h2 className="text-base font-semibold text-gray-900 mb-2">Decline this offer?</h2>
                  <p className="text-sm text-gray-500 mb-6">
                    Declining will close the chat. The founder will need to send a new offer to reopen it.
                  </p>
                </>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 border border-gray-200 rounded-full py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Go back
                </button>
                <button
                  onClick={confirmAction}
                  className={`flex-1 rounded-full py-2.5 text-sm font-medium transition-colors text-white ${
                    confirmModal.type === 'decline' || confirmModal.type === 'decline_offer'
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-[#6b1d2b] hover:bg-[#4e1520]'
                  }`}
                >
                  {confirmModal.type === 'accept' ? 'Yes, accept' :
                   confirmModal.type === 'decline' ? 'Yes, decline' :
                   confirmModal.type === 'accept_offer' ? 'Accept offer' :
                   'Decline offer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── List view ──────────────────────────────────────────────────────────────
  const tabs: { id: Tab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'replied', label: 'Replied' },
    { id: 'declined', label: 'Declined' },
  ]

  return (
    <div className="flex flex-col h-full">

      {/* Persistent header */}
      <div className="px-4 md:px-8 py-8 border-b border-gray-100 shrink-0">
        <h1 className="text-2xl font-editorial  font-regular text-gray-900 mb-8">Your Inquiries</h1>
      </div>

      <div className="p-4 md:p-8 flex-1 overflow-y-auto">
        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200 mb-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.id
                  ? 'border-[#6b1d2b] text-[#6b1d2b]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-gray-100 shrink-0" />
                <div className="w-11 h-11 rounded-full bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
                <div className="h-3 bg-gray-100 rounded w-14 shrink-0" />
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {filtered.map((inq: any) => {
              const founder = inq.founder as any
              const fp = Array.isArray(founder?.founder_profiles) ? founder.founder_profiles[0] : founder?.founder_profiles
              const companyName = fp?.company_name
              const listIndustry = fp?.industry
              const replied = hasReplied(inq)
              const isUnread = !replied && inq.status !== 'declined'

              return (
                <button
                  key={inq.id}
                  onClick={() => setSelectedId(inq.id)}
                  className="w-full flex items-center gap-3 md:gap-4 px-4 md:px-6 py-4 text-left border-b border-gray-50 last:border-0 hover:bg-gray-50/70 transition-colors"
                >
                  <div className="w-2 h-2 shrink-0">
                    {isUnread && <span className="block w-2 h-2 rounded-full bg-[#6b1d2b]" />}
                  </div>
                  <Avatar name={founder?.full_name} url={founder?.avatar_url} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {founder?.full_name || 'Founder'}
                      {companyName && (
                        <span className="font-normal text-gray-400"> · {companyName}</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {listIndustry ? `${listIndustry} · ` : ''}{inq.project_description}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 shrink-0 ml-2">{relativeTime(inq.updated_at)}</p>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 text-center py-16">
            <MessageSquare size={36} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-600 font-medium mb-1">No inquiries here</p>
            <p className="text-xs text-gray-400">
              {tab === 'replied'
                ? "You haven't replied to any inquiries yet."
                : tab === 'declined'
                ? "You haven't declined any inquiries."
                : 'When a founder reaches out, their message will appear here.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

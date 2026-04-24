'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/useUser'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { SendOfferModal } from '@/components/chat/SendOfferModal'
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'
import { MessageSquare, ChevronRight, CheckCircle, Sparkles, ChevronLeft, ArrowLeftCircle, Send } from 'lucide-react'
import Link from 'next/link'

function relativeTime(dateStr: string) {
  const d = new Date(dateStr)
  if (isToday(d)) return format(d, 'h:mm aa')
  if (isYesterday(d)) return 'Yesterday'
  return formatDistanceToNow(d, { addSuffix: true }).replace('about ', '')
}

function Avatar({
  name,
  avatarUrl,
  size = 'md',
}: {
  name?: string | null
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
}) {
  const dim =
    size === 'lg' ? 'w-11 h-11 text-base' :
    size === 'sm' ? 'w-8 h-8 text-xs' :
    'w-10 h-10 text-sm'
  return (
    <div className={`${dim} rounded-full bg-[#d4a0a8] flex items-center justify-center text-white font-semibold shrink-0 overflow-hidden`}>
      {avatarUrl
        ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        : name?.[0]?.toUpperCase() || 'U'}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    pending:  { label: 'Pending',  className: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
    hired:    { label: 'Hired',    className: 'bg-green-50 text-green-700 border-green-100' },
    accepted: { label: 'Accepted', className: 'bg-green-50 text-green-700 border-green-100' },
    declined: { label: 'Declined', className: 'bg-red-50 text-red-600 border-red-100' },
    cancelled:{ label: 'Closed',   className: 'bg-gray-100 text-gray-500 border-gray-200' },
  }
  const s = map[status] ?? { label: status, className: 'bg-gray-100 text-gray-500 border-gray-200' }
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${s.className}`}>
      {s.label}
    </span>
  )
}

export default function FounderMessagesPage() {
  const { profile } = useUser()
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [offerModalOpen, setOfferModalOpen] = useState(false)
  const [actioning, setActioning] = useState(false)

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ['founder-messages', profile?.id],
    staleTime: 0,
    queryFn: async () => {
      if (!profile?.id) return []
      const supabase = createClient()
      const { data } = await supabase
        .from('inquiries')
        .select(`
          id, status, updated_at, budget, project_description, created_at,
          creative:profiles!creative_id(id, full_name, avatar_url, bio, creative_profiles(discipline, skills))
        `)
        .eq('founder_id', profile.id)
        .order('updated_at', { ascending: false })
      return data || []
    },
    enabled: !!profile?.id,
  })

  const selected: any = inquiries.find((i: any) => i.id === selectedId) ?? null
  const creative = selected?.creative as any
  const cp = Array.isArray(creative?.creative_profiles)
    ? creative.creative_profiles[0]
    : creative?.creative_profiles

  async function setStatus(status: 'hired' | 'declined' | 'cancelled') {
    if (!selectedId || !profile) return
    setActioning(true)
    await createClient()
      .from('inquiries')
      .update({ status })
      .eq('id', selectedId)
      .eq('founder_id', profile.id)
    queryClient.invalidateQueries({ queryKey: ['founder-messages', profile.id] })
    setActioning(false)
  }

  const isHired    = selected?.status === 'hired' || selected?.status === 'accepted'
  const isDeclined = selected?.status === 'declined' || selected?.status === 'cancelled'
  const isPending  = !isHired && !isDeclined

  // ── Chat / detail view ────────────────────────────────────────────────────
  if (selectedId && selected && profile) {
    return (
      <div className="flex flex-col h-full min-h-0">

        {/* Persistent header: breadcrumb */}
        {/* <div className="px-4 md:px-8 py-5 border-b border-black/10 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedId(null)}
              className="text-sm text-gray-400 hover:text-gray-700 transition-colors leading-none"
            >
              Inquiries
            </button>
            <ChevronRight size={16} className="text-gray-300 shrink-0" />
            <span className="text-sm text-gray-900 leading-none truncate">
              Inquiry details
            </span>
          </div>
        </div> */}

        {/* Action bar (no bg — blends with page) */}
        <div className="px-4 md:px-8 py-4 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedId(null)}
                className="text-sm text-gray-400 hover:text-gray-700 transition-colors leading-none"
              >
                 <ArrowLeftCircle size={24} />
              </button>
              <Avatar name={creative?.full_name} avatarUrl={creative?.avatar_url} size="lg" />
              <div>
                <p className="text-sm font-semibold text-gray-900 leading-tight">{creative?.full_name}</p>
                {cp?.discipline && <p className="text-xs text-gray-400">{cp.discipline}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isPending && (
                <>
                  <button
                    onClick={() => setStatus('declined')}
                    disabled={actioning}
                    className="text-xs font-medium text-gray-600 border bg-[#F2E6E8] border-maroon px-4 py-2 rounded-md hover:bg-maroon/10 transition-colors disabled:opacity-50"
                  >
                    Not a fit
                  </button>
                  <button
                    onClick={() => setStatus('hired')}
                    disabled={actioning}
                    className="text-xs font-medium bg-[#6b1d2b] text-white px-4 py-2 rounded-md hover:bg-[#4e1520] transition-colors disabled:opacity-50"
                  >
                    Confirm hire
                  </button>
                </>
              )}
              {isHired && (
                <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-100 px-4 py-2 rounded-full flex items-center gap-1.5">
                  <CheckCircle size={12} />
                  Hired
                </span>
              )}
              {isDeclined && (
                <span className="text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 px-4 py-2 rounded-full">
                  Closed
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Hire confirmed banner */}
        {isHired && (
          <div className="bg-green-50 border-b border-green-100 px-6 py-2.5 flex items-center gap-2 shrink-0">
            <CheckCircle size={14} className="text-green-600 shrink-0" />
            <p className="text-xs text-green-700 font-medium">
              Hire confirmed! {creative?.full_name?.split(' ')[0]} has been notified.
            </p>
          </div>
        )}

        {/* Body: chat + sidebar */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Chat */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Original inquiry card */}
            <div className="px-6 pt-5 pb-0 shrink-0">
              <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Original Inquiry · {format(new Date(selected.created_at), 'MMM d, yyyy')}
                </p>
                <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                  {selected.project_description}
                </p>
              </div>
            </div>

            <ChatWindow
              inquiryId={selectedId}
              currentUserId={profile.id}
              userRole="founder"
              recipientName={creative?.full_name?.split(' ')[0]}
              onSendOffer={() => setOfferModalOpen(true)}
            />
          </div>

          {/* Right info panel */}
          <div className="hidden lg:flex w-52 shrink-0 border-l border-gray-100 flex-col p-6 gap-6 overflow-y-auto" style={{ background: '#F6F3EF' }}>
            {selected.budget && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                  Budget Shared
                </p>
                <p className="text-xl font-bold text-gray-900 leading-tight">
                  ₦{Number(selected.budget).toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">/ month</p>
              </div>
            )}

            {cp?.skills?.length > 0 && (
              <>
                {selected.budget && <div className="border-t border-gray-200" />}
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                    Talent Snapshot
                  </p>
                  <div className="flex items-start gap-2">
                    <Sparkles size={13} className="text-gray-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Specializes in {cp.skills.slice(0, 2).join(' & ')}.
                    </p>
                  </div>
                </div>
              </>
            )}

            {creative?.bio && (
              <>
                <div className="border-t border-gray-200" />
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">About</p>
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-6">{creative.bio}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {offerModalOpen && (
          <SendOfferModal
            inquiryId={selectedId}
            founderId={profile.id}
            creativeId={creative?.id}
            onClose={() => setOfferModalOpen(false)}
          />
        )}
      </div>
    )
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">

      {/* Persistent header */}
      <div className="px-4 md:px-8 py-5 border-b border-gray-100 shrink-0">
        <h1 className="font-editorial text-2xl text-gray-900">Your Inquiries</h1>
      </div>

      <div className="p-4 md:p-8 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
                <div className="h-3 bg-gray-100 rounded w-14 shrink-0" />
              </div>
            ))}
          </div>
        ) : inquiries.length > 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {inquiries.map((inq: any) => {
              const c = inq.creative as any
              const cDisc = (Array.isArray(c?.creative_profiles) ? c.creative_profiles[0] : c?.creative_profiles)?.discipline

              return (
                <button
                  key={inq.id}
                  onClick={() => setSelectedId(inq.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left border-b border-gray-50 last:border-0 hover:bg-gray-50/70 transition-colors"
                >
                  <Avatar name={c?.full_name} avatarUrl={c?.avatar_url} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-gray-900 truncate">{c?.full_name}</p>
                      <StatusBadge status={inq.status} />
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      {cDisc ? `${cDisc} · ` : ''}{inq.project_description}
                    </p>
                  </div>
                  <p className="text-[11px] text-gray-400 shrink-0 ml-2">
                    {relativeTime(inq.updated_at)}
                  </p>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-24">
            <div className="w-20 h-20 rounded-full bg-[#f5eeee] flex items-center justify-center mb-6">
              <Send size={32} className="text-[#6b1d2b]" />
            </div>
            <h2 className="font-editorial text-3xl text-gray-900 mb-3">No inquiries sent yet.</h2>
            <p className="text-sm text-gray-400 text-center max-w-xs leading-relaxed mb-7">
              When you&apos;re ready to reach out to a talent, tap Hire on their profile.
              Your active inquiries will appear here so you can track every conversation.
            </p>
            <Link
              href="/founder/browse"
              className="bg-[#6b1d2b] text-white px-7 py-2.5 rounded-lg text-sm font-medium hover:bg-[#4e1520] transition-colors"
            >
              Browse Talent
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

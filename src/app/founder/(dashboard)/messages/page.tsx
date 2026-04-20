'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/useUser'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { SendOfferModal } from '@/components/chat/SendOfferModal'
import Link from 'next/link'
import { format, isToday, isYesterday } from 'date-fns'
import { MessageSquare, ArrowLeft, Sparkles, CheckCircle } from 'lucide-react'

function convTime(dateStr: string) {
  const d = new Date(dateStr)
  if (isToday(d)) return format(d, 'h:mm aa')
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'MMM d')
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

export default function MessagesPage() {
  const { profile } = useUser()
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [offerModalOpen, setOfferModalOpen] = useState(false)
  const [actioning, setActioning] = useState(false)

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ['messages-list', profile?.id],
    staleTime: 0,
    queryFn: async () => {
      if (!profile?.id) return []
      const supabase = createClient()
      const col = profile.role === 'founder' ? 'founder_id' : 'creative_id'
      const { data } = await supabase
        .from('inquiries')
        .select(`
          id, status, updated_at, budget, project_description, created_at,
          creative:profiles!creative_id(id, full_name, avatar_url, bio, creative_profiles(discipline, skills))
        `)
        .eq(col, profile.id)
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
    const supabase = createClient()
    await supabase.from('inquiries').update({ status }).eq('id', selectedId).eq('founder_id', profile.id)
    queryClient.invalidateQueries({ queryKey: ['messages-list', profile.id] })
    setActioning(false)
  }

  const isHired = selected?.status === 'hired'
  const isDeclined = selected?.status === 'declined' || selected?.status === 'cancelled'
  const isPending = !isHired && !isDeclined

  return (
    <div className="h-full flex overflow-hidden">

      {/* ── Conversation list ─────────────────────────────── */}
      <div className="w-72 border-r border-gray-100 flex flex-col shrink-0 bg-white">
        <div className="px-6 py-5 border-b border-gray-50 shrink-0">
          <h1 className="text-lg font-semibold text-gray-900">Messages</h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-px">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 animate-pulse h-[72px] bg-white border-b border-gray-50" />
              ))}
            </div>
          ) : inquiries.length > 0 ? (
            inquiries.map((inq: any) => {
              const c = inq.creative as any
              const isActive = inq.id === selectedId
              return (
                <button
                  key={inq.id}
                  onClick={() => setSelectedId(inq.id)}
                  className={`w-full flex items-center gap-3 px-5 py-4 text-left border-b border-gray-50 transition-colors ${
                    isActive ? 'bg-[#f5eeee]' : 'hover:bg-gray-50'
                  }`}
                >
                  <Avatar name={c?.full_name} avatarUrl={c?.avatar_url} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-semibold text-gray-900 truncate">{c?.full_name}</p>
                      <p className="text-[11px] text-gray-400 shrink-0 ml-2">
                        {convTime(inq.updated_at)}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      {(Array.isArray(c?.creative_profiles) ? c.creative_profiles[0] : c?.creative_profiles)?.discipline || 'Creative'}
                    </p>
                  </div>
                </button>
              )
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center px-6">
              <MessageSquare size={32} className="text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">No conversations yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Chat area ─────────────────────────────────────── */}
      {selected && profile ? (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

          {/* Header */}
          <div className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedId(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors mr-1"
              >
                <ArrowLeft size={16} />
              </button>
              <Avatar name={creative?.full_name} avatarUrl={creative?.avatar_url} size="lg" />
              <div>
                <p className="text-sm font-semibold text-gray-900 leading-tight">{creative?.full_name}</p>
                {cp?.discipline && (
                  <p className="text-xs text-gray-400">{cp.discipline}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isPending && (
                <>
                  <button
                    onClick={() => setStatus('declined')}
                    disabled={actioning}
                    className="text-xs font-medium text-gray-600 border border-gray-200 px-4 py-1.5 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Not a fit
                  </button>
                  <button
                    onClick={() => setStatus('hired')}
                    disabled={actioning}
                    className="text-xs font-medium bg-[#6b1d2b] text-white px-4 py-1.5 rounded-full hover:bg-[#4e1520] transition-colors disabled:opacity-50"
                  >
                    Confirm hire
                  </button>
                </>
              )}
              {isHired && (
                <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-100 px-4 py-1.5 rounded-full">
                  Hired
                </span>
              )}
              {isDeclined && (
                <span className="text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 px-4 py-1.5 rounded-full">
                  Closed
                </span>
              )}
              <Link
                href={`/founder/profile/${creative?.id}`}
                className="text-xs text-[#6b1d2b] hover:underline font-medium ml-2"
              >
                View profile
              </Link>
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

          {/* Body: chat + right sidebar */}
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
                inquiryId={selectedId!}
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
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#faf9f7] text-center">
          <MessageSquare size={40} className="text-gray-200 mb-3" />
          <p className="text-sm text-gray-400">Select a conversation to start messaging</p>
        </div>
      )}

      {offerModalOpen && selectedId && selected && profile && (
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

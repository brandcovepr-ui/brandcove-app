'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/useUser'
import { Bookmark, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { SendInquiryModal } from '@/components/inquiries/SendInquiryModal'

function abbrevName(name: string | null) {
  if (!name) return '—'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

export default function ShortlistPage() {
  const { profile } = useUser()
  const queryClient = useQueryClient()
  const [inquiryTarget, setInquiryTarget] = useState<{ id: string; name: string } | null>(null)

  const { data: shortlisted, isLoading } = useQuery({
    queryKey: ['shortlist', profile?.id],
    staleTime: 0,
    queryFn: async () => {
      if (!profile?.id) return []
      const supabase = createClient()
      const { data } = await supabase
        .from('shortlists')
        .select('*, creative:profiles!creative_id(*, creative_profiles(*))')
        .eq('founder_id', profile.id)
        .order('created_at', { ascending: false })
      return data || []
    },
    enabled: !!profile?.id,
  })

  async function removeFromShortlist(creativeId: string) {
    if (!profile) return
    const supabase = createClient()
    await supabase.from('shortlists').delete().match({ founder_id: profile.id, creative_id: creativeId })
    queryClient.invalidateQueries({ queryKey: ['shortlist', profile.id] })
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-editorial  font-regular text-gray-900 mb-8">Your Shortlist</h1>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 h-16 animate-pulse" />
          ))}
        </div>
      ) : shortlisted && shortlisted.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1.5fr_auto] gap-4 px-6 py-3 border-b border-gray-100">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Talent</p>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Role</p>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Rate</p>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Saved On</p>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Actions</p>
          </div>

          {shortlisted.map((item: any) => {
            const creative = item.creative
            const cp = creative?.creative_profiles
            return (
              <div
                key={item.id}
                className="grid grid-cols-[2fr_1.5fr_1.5fr_1.5fr_auto] gap-4 items-center px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#d4a0a8] flex items-center justify-center text-white text-sm font-semibold shrink-0 overflow-hidden">
                    {creative?.avatar_url
                      ? <img src={creative.avatar_url} alt="" className="w-full h-full object-cover" />
                      : creative?.full_name?.[0]?.toUpperCase() || 'C'
                    }
                  </div>
                  <Link href={`/founder/profile/${creative?.id}`} className="text-sm font-medium text-gray-900 hover:text-[#6b1d2b] transition-colors">
                    {abbrevName(creative?.full_name)}
                  </Link>
                </div>

                <p className="text-sm text-gray-600">{cp?.discipline || '—'}</p>

                <p className="text-sm text-gray-700 font-medium">
                  {cp?.hourly_rate ? `₦${(cp.hourly_rate / 1000).toFixed(0)}k/mo` : '—'}
                </p>

                <p className="text-sm text-gray-500">
                  {format(new Date(item.created_at), 'MMM d, yyyy')}
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => removeFromShortlist(creative?.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={() => setInquiryTarget({ id: creative?.id, name: creative?.full_name || 'Creative' })}
                    className="bg-[#6b1d2b] text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-[#4e1520] transition-colors whitespace-nowrap"
                  >
                    Send Inquiry
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <Bookmark size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 text-sm mb-4">You haven&apos;t shortlisted anyone yet.</p>
          <Link
            href="/founder/browse"
            className="inline-flex items-center gap-2 bg-[#6b1d2b] text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-[#4e1520] transition-colors"
          >
            Browse Talent
          </Link>
        </div>
      )}

      {inquiryTarget && (
        <SendInquiryModal
          creativeId={inquiryTarget.id}
          creativeName={inquiryTarget.name}
          onClose={() => setInquiryTarget(null)}
        />
      )}
    </div>
  )
}

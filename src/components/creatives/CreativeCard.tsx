'use client'

import Link from 'next/link'
import { Heart, HeartOff } from 'lucide-react'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/useUser'

interface CreativeCardProps {
  creative: {
    id: string
    full_name: string | null
    avatar_url: string | null
    bio: string | null
    creative_profiles?: {
      discipline?: string
      hourly_rate?: number | null
      availability?: string
    } | null
  }
  initialShortlisted?: boolean
}

export function CreativeCard({ creative, initialShortlisted = false }: CreativeCardProps) {
  const { profile } = useUser()
  const queryClient = useQueryClient()
  const [shortlisted, setShortlisted] = useState(initialShortlisted)
  const [saving, setSaving] = useState(false)

  const cp = creative.creative_profiles

  async function toggleShortlist(e: React.MouseEvent) {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    const supabase = createClient()

    if (shortlisted) {
      await supabase.from('shortlists').delete().match({
        founder_id: profile.id,
        creative_id: creative.id,
      })
      setShortlisted(false)
    } else {
      await supabase.from('shortlists').insert({
        founder_id: profile.id,
        creative_id: creative.id,
      })
      setShortlisted(true)
    }
    setSaving(false)
    // Refresh shortlist page and dashboard stat immediately
    queryClient.invalidateQueries({ queryKey: ['shortlist'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  function abbrevName(name: string | null) {
    if (!name) return '—'
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0]
    return `${parts[0]} ${parts[parts.length - 1][0]}.`
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow flex flex-col">
      {/* Top row: avatar + bookmark */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-20 h-20 rounded-xl bg-[#d4a0a8] flex items-center justify-center text-white text-2xl font-semibold shrink-0 overflow-hidden">
          {creative.avatar_url
            ? <img src={creative.avatar_url} alt="" className="w-full h-full object-cover" />
            : creative.full_name?.[0]?.toUpperCase() || 'C'
          }
        </div>
        <button
          onClick={toggleShortlist}
          disabled={saving}
          className="text-gray-300 hover:text-[#6b1d2b] transition-colors mt-1"
        >
          {shortlisted
            ? <Heart size={18} className="text-[#6b1d2b] fill-[#6b1d2b]" />
            : <Heart size={18} />
          }
        </button>
      </div>

      {/* Name + discipline pill */}
      <p className="text-sm font-bold text-gray-900 mb-1.5">{abbrevName(creative.full_name)}</p>
      {cp?.discipline && (
        <span className="inline-block self-start text-[11px] font-medium text-[#6b1d2b] bg-[#f5eeee] px-2.5 py-0.5 rounded-full mb-3">
          {cp.discipline}
        </span>
      )}

      {/* Bio */}
      <p className="text-xs text-gray-500 line-clamp-2 mb-4 flex-1 leading-relaxed">
        {creative.bio || 'Creative professional available for hire.'}
      </p>

      <hr className="border-gray-100 mb-4" />

      {/* Rate + View Profile */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Rate</p>
          <p className="text-sm font-bold text-gray-900">
            {cp?.hourly_rate ? `₦${(cp.hourly_rate / 1000).toFixed(0)}k/mo` : 'TBD'}
          </p>
        </div>
        <Link
          href={`/founder/profile/${creative.id}`}
          className="bg-[#6b1d2b] text-white rounded-lg px-4 py-2 text-xs font-medium hover:bg-[#4e1520] transition-colors whitespace-nowrap"
        >
          View Profile
        </Link>
      </div>
    </div>
  )
}

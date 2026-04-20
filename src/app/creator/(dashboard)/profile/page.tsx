'use client'

import Link from 'next/link'
import { useUser } from '@/lib/hooks/useUser'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { FileText, Film, ImageIcon } from 'lucide-react'
import type { CreativeProfile, WorkSample } from '@/lib/types'

export default function CreatorProfileViewPage() {
  const { profile, loading: profileLoading } = useUser()

  const { data: creativeProfile, isLoading: cpLoading } = useQuery({
    queryKey: ['creative-profile', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null
      const { data } = await createClient()
        .from('creative_profiles')
        .select('*')
        .eq('id', profile.id)
        .single()
      return data as CreativeProfile | null
    },
    enabled: !!profile?.id,
  })

  const { data: workSamples = [], isLoading: samplesLoading } = useQuery({
    queryKey: ['work-samples', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []
      const { data } = await createClient()
        .from('work_samples')
        .select('*')
        .eq('creative_id', profile.id)
        .order('created_at', { ascending: false })
      return (data || []) as WorkSample[]
    },
    enabled: !!profile?.id,
  })

  const isLoading = (!profile && profileLoading) || cpLoading || samplesLoading
  const firstName = profile?.full_name?.split(' ')[0] || 'You'

  if (isLoading) {
    return (
      <div className="p-8 animate-pulse space-y-4">
        <div className="h-8 w-48 bg-gray-100 rounded" />
        <div className="flex gap-6">
          <div className="w-56 h-80 bg-white rounded-xl border border-gray-100" />
          <div className="flex-1 space-y-4">
            <div className="h-40 bg-white rounded-xl border border-gray-100" />
            <div className="h-64 bg-white rounded-xl border border-gray-100" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <Link
          href="/creator/profile/edit"
          className="bg-[#6b1d2b] text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-[#4e1520] transition-colors"
        >
          Edit Profile
        </Link>
      </div>

      <div className="flex gap-6 items-start">

        {/* Left card */}
        <div className="w-56 shrink-0 bg-white rounded-xl border border-gray-100 p-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-[#6b1d2b] flex items-center justify-center text-white text-2xl font-bold mb-3 overflow-hidden">
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              : profile?.full_name?.[0]?.toUpperCase() || 'C'}
          </div>
          <p className="text-base font-semibold text-gray-900 leading-tight">
            {profile?.full_name?.split(' ')[0]} {profile?.full_name?.split(' ')[1]?.[0]}.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {creativeProfile?.discipline}
            {creativeProfile?.years_experience != null && (
              <> · {creativeProfile.years_experience} years exp.</>
            )}
          </p>

          {creativeProfile?.hourly_rate != null && (
            <div className="w-full mt-5 pt-5 border-t border-gray-100 text-left">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Rate</p>
              <p className="text-sm font-bold text-gray-900">
                ₦{Number(creativeProfile.hourly_rate).toLocaleString()}
                <span className="text-xs font-normal text-gray-400"> / month</span>
              </p>
            </div>
          )}

          {creativeProfile?.skills && creativeProfile.skills.length > 0 && (
            <div className="w-full mt-5 pt-5 border-t border-gray-100 text-left">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {creativeProfile.skills.map((skill: string) => (
                  <span
                    key={skill}
                    className="text-[11px] px-2.5 py-0.5 rounded-full border border-gray-200 text-gray-600 bg-gray-50"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right content */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* About */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">About {firstName}</h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {profile?.bio || (
                <span className="text-gray-400 italic">No bio added yet. <Link href="/creator/profile/edit" className="text-[#6b1d2b] hover:underline">Add one</Link></span>
              )}
            </p>
          </div>

          {/* Portfolio */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Portfolio</h2>
            {workSamples.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {workSamples.map((sample) => (
                  <a
                    key={sample.id}
                    href={sample.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block rounded-xl overflow-hidden border border-gray-100 hover:border-gray-300 transition-colors"
                  >
                    {sample.file_type === 'image' ? (
                      <div className="aspect-video bg-gray-100 overflow-hidden">
                        <img
                          src={sample.url}
                          alt={sample.title || ''}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-gray-50 flex flex-col items-center justify-center gap-2">
                        {sample.file_type === 'pdf'
                          ? <FileText size={28} className="text-gray-300" />
                          : sample.file_type === 'video'
                          ? <Film size={28} className="text-gray-300" />
                          : <ImageIcon size={28} className="text-gray-300" />}
                        <p className="text-xs text-gray-400 truncate max-w-[80%]">{sample.title}</p>
                      </div>
                    )}
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-xl">
                <ImageIcon size={28} className="mx-auto text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">No portfolio items yet.</p>
                <Link
                  href="/creator/profile/edit"
                  className="text-xs text-[#6b1d2b] hover:underline font-medium mt-1 block"
                >
                  Upload work samples
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useParams } from 'next/navigation'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useCreative } from '@/lib/hooks/useCreatives'
import { useUser } from '@/lib/hooks/useUser'
import { supabase } from '@/lib/supabase/client'
import { SendInquiryModal } from '@/components/inquiries/SendInquiryModal'
import Link from 'next/link'
import { WorkSample, CreativeWithProfile } from '@/lib/types'

export default function CreativeProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useUser()
  const { data: creative, isLoading } = useCreative(id)
  const [shortlisted, setShortlisted] = useState(false)
  const [inquiryOpen, setInquiryOpen] = useState(false)

  const { data: workSamples = [] } = useQuery<WorkSample[]>({
    queryKey: ['work-samples', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('work_samples')
        .select('*')
        .eq('creative_id', id)
        .order('created_at', { ascending: false })
      return (data || []) as unknown as WorkSample[]
    },
    enabled: !!id,
  })

  const creativeData = creative as unknown as CreativeWithProfile
  const cp = creativeData?.creative_profiles
  const firstName = creativeData?.full_name?.split(' ')[0] || 'Creative'

  const fullName: string = creativeData?.full_name || ''
  const nameParts = fullName.trim().split(' ')
  const displayName =
    nameParts.length > 1
      ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
      : fullName

  async function toggleShortlist() {
    if (!profile) return
    if (shortlisted) {
      await supabase.from('shortlists').delete().match({ founder_id: profile.id, creative_id: id })
      setShortlisted(false)
    } else {
      await supabase.from('shortlists').insert({ founder_id: profile.id, creative_id: id })
      setShortlisted(true)
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-5xl animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-48 mb-5 md:mb-7" />
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start">
          <div className="w-full md:w-64 h-64 md:h-96 bg-gray-200 rounded-2xl shrink-0" />
          <div className="flex-1 w-full space-y-4">
            <div className="h-40 bg-gray-200 rounded-2xl" />
            <div className="h-72 bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!creative) {
    return <div className="p-8 text-gray-500">Creative not found.</div>
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm mb-5 md:mb-7">
        <Link href="/founder/browse" className="text-gray-400 hover:text-gray-700 transition-colors">
          Browse talents
        </Link>
        <span className="text-gray-300">›</span>
        <span className="font-semibold text-gray-800">{displayName}</span>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start">
        {/* Left card */}
        <div className="w-full md:w-64 shrink-0 bg-white rounded-2xl border border-gray-100 p-6">
          {/* Header area with avatar & basic details */}
          <div className="flex flex-row md:flex-col items-center md:items-stretch gap-4 md:gap-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-[#d4a0a8] flex items-center justify-center text-white text-2xl md:text-3xl font-bold shrink-0 md:mx-auto md:mb-4 overflow-hidden">
              {creativeData.avatar_url ? (
                <img src={creativeData.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                creativeData.full_name?.[0]?.toUpperCase() || 'C'
              )}
            </div>

            <div className="text-left md:text-center min-w-0">
              <p className="font-bold text-gray-900 text-lg md:text-xl leading-tight truncate">{creativeData.full_name}</p>
              <p className="text-xs md:text-sm text-gray-400 mt-1">
                {[
                  cp?.discipline,
                  cp?.years_experience ? `${cp.years_experience}+ years exp.` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
          </div>

          {/* Additional details (Rate, Skills) */}
          <div className="grid grid-cols-2 md:grid-cols-1 gap-4 md:gap-0 border-t border-gray-100 md:border-none pt-4 md:pt-0 mt-4 md:mt-0">
            {cp?.hourly_rate && (
              <div className="md:mt-6 text-left">
                <p className="text-xs text-gray-400 mb-0.5">Rate</p>
                <p className="text-sm md:text-base font-bold text-gray-900">
                  ₦{cp.hourly_rate.toLocaleString()} / month
                </p>
              </div>
            )}

            {cp?.skills?.length > 0 && (
              <div className="col-span-2 md:col-span-1 md:mt-5 text-left">
                <p className="text-xs text-gray-400 mb-2">Skills</p>
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  {cp.skills.map((skill: string) => (
                    <span
                      key={skill}
                      className="border border-gray-200 text-gray-700 text-[10px] md:text-xs px-2.5 py-0.5 md:px-3 md:py-1 rounded-full whitespace-nowrap"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 md:mt-7 space-y-2">
            <button
              onClick={() => setInquiryOpen(true)}
              className="w-full bg-[#6b1d2b] text-white rounded-full py-2.5 md:py-3 text-sm font-semibold hover:bg-[#4e1520] transition-colors"
            >
              Hire {firstName}
            </button>
            <button
              onClick={toggleShortlist}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-full py-2.5 md:py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {shortlisted ? (
                <BookmarkCheck size={14} className="text-[#6b1d2b]" />
              ) : (
                <Bookmark size={14} />
              )}
              {shortlisted ? 'Saved to shortlist' : 'Save to shortlist'}
            </button>
          </div>
        </div>

        {/* Right column */}
        <div className="flex-1 w-full min-w-0 space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">About {firstName}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {(creative as any).bio || 'No bio provided yet.'}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Portfolio</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
              {workSamples.length > 0
                ? workSamples.map((sample) => (
                    <a
                      key={sample.id}
                      href={sample.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block aspect-square rounded-xl overflow-hidden bg-gray-100"
                    >
                      {sample.file_type === 'image' || !sample.file_type ? (
                        <img
                          src={sample.url}
                          alt={sample.title || ''}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 p-3 text-center">
                          {sample.title || 'View file'}
                        </div>
                      )}
                    </a>
                  ))
                : <div className="text-center flex items-center justify-center w-full h-full text-gray-400 py-8">No work samples yet.</div>}
            </div>
          </div>
        </div>
      </div>

      {inquiryOpen && (
        <SendInquiryModal
          creativeId={id}
          creativeName={(creative as any).full_name || 'Creative'}
          onClose={() => setInquiryOpen(false)}
        />
      )}
    </div>
  )
}

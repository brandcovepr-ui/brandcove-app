import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import { ProfileActions } from './ProfileActions'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CreativeProfilePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  // 1. Get current authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 2. Fetch creative profile & user details
  const { data: creative } = await supabase
    .from('profiles')
    .select('*, creative_profiles(*)')
    .eq('id', id)
    .single()

  if (!creative) {
    notFound()
  }

  // 3. Fetch work samples
  const { data: workSamples = [] } = await supabase
    .from('work_samples')
    .select('*')
    .eq('creative_id', id)
    .order('created_at', { ascending: false })

  // 4. Check shortlist status
  let initialShortlisted = false
  if (user) {
    const { data: shortlist } = await supabase
      .from('shortlists')
      .select('id')
      .match({ founder_id: user.id, creative_id: id })
      .maybeSingle()

    initialShortlisted = !!shortlist
  }

  // Formatting helpers
  const cp = Array.isArray(creative?.creative_profiles)
    ? creative.creative_profiles[0]
    : creative?.creative_profiles

  const firstName = creative.full_name?.split(' ')[0] || 'Creative'
  const fullName = creative.full_name || ''
  const nameParts = fullName.trim().split(' ')
  const displayName =
    nameParts.length > 1
      ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
      : fullName

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm mb-5 md:mb-7">
        <Link
          href="/dashboard/founder/browse"
          className="text-gray-400 hover:text-gray-700 transition-colors"
        >
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
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-[#d4a0a8] flex items-center justify-center text-white text-2xl md:text-3xl font-bold shrink-0 md:mx-auto md:mb-4 overflow-hidden relative">
              {creative.avatar_url ? (
                <img
                  src={creative.avatar_url}
                  alt={creative.full_name || ''}
                  className="w-full h-full object-cover"
                />
              ) : (
                creative.full_name?.[0]?.toUpperCase() || 'C'
              )}
            </div>

            <div className="text-left md:text-center min-w-0">
              <p className="font-bold text-gray-900 text-lg md:text-xl leading-tight truncate">
                {creative.full_name}
              </p>
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
                  ₦{Number(cp.hourly_rate).toLocaleString()} / month
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

          {/* Interactive Actions (Hire Modal & Shortlist Toggle) */}
          <ProfileActions
            creativeId={id}
            creativeName={creative.full_name || 'Creative'}
            firstName={firstName}
            initialShortlisted={initialShortlisted}
          />
        </div>

        {/* Right column */}
        <div className="flex-1 w-full min-w-0 space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">About {firstName}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {creative.bio || 'No bio provided yet.'}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Portfolio</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
              {workSamples && workSamples.length > 0 ? (
                workSamples.map((sample: any) => (
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
              ) : (
                <div className="text-center flex items-center justify-center w-full col-span-full text-gray-400 py-8 text-sm">
                  No work samples yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
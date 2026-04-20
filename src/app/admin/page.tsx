'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/useUser'
import { formatDistanceToNow } from 'date-fns'
import { CheckCircle, XCircle, Clock, ExternalLink, ChevronDown, ChevronUp, FileText, Film, ImageIcon } from 'lucide-react'

type ReviewStatus = 'pending' | 'approved' | 'rejected'

const STATUS_CONFIG: Record<ReviewStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  approved: { label: 'Approved', color: 'text-green-700', bg: 'bg-green-100' },
  rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-100' },
}

function useApplications(filter: ReviewStatus | 'all') {
  return useQuery({
    queryKey: ['admin-applications', filter],
    staleTime: 0,
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from('profiles')
        .select(`
          id, full_name, created_at, review_status, bio, avatar_url,
          creative_profiles(discipline, skills, years_experience, portfolio_url, hourly_rate, location, availability),
          work_samples(id, url, title, file_type)
        `)
        .eq('role', 'creative')
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('review_status', filter)
      }

      const { data, error } = await query
      if (error) throw error
      return data || []
    },
  })
}

export default function AdminApplicationsPage() {
  const router = useRouter()
  const { profile, loading: userLoading } = useUser()
  const [filter, setFilter] = useState<ReviewStatus | 'all'>('pending')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { data: applications = [], isLoading } = useApplications(filter)

  // Guard: only admins can see this page
  useEffect(() => {
    if (!userLoading && profile?.role !== 'admin') {
      router.replace('/login')
    }
  }, [profile, userLoading, router])

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    setUpdating(id)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    await fetch('/api/admin/review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token ?? ''}`,
      },
      body: JSON.stringify({ creative_id: id, status }),
    })

    queryClient.invalidateQueries({ queryKey: ['admin-applications'] })
    setUpdating(null)
    if (expanded === id) setExpanded(null)
  }

  const filters: { id: ReviewStatus | 'all'; label: string }[] = [
    { id: 'pending', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'all', label: 'All' },
  ]

  // Don't render until we know who the user is
  if (!profile && userLoading) return null
  if (!profile || profile.role !== 'admin') return null

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Creator Applications</h1>
        <p className="text-sm text-gray-500 mt-1">Review and approve creators applying to join BrandCove.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 mb-6">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              filter === f.id
                ? 'border-[#6b1d2b] text-[#6b1d2b]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Applications list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse h-20" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <Clock size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 text-sm">No {filter === 'all' ? '' : filter} applications.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app: any) => {
            const cp = Array.isArray(app.creative_profiles) ? app.creative_profiles[0] : app.creative_profiles
            const samples: any[] = app.work_samples ?? []
            const status = (app.review_status || 'pending') as ReviewStatus
            const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
            const isExpanded = expanded === app.id
            const isUpdating = updating === app.id

            return (
              <div key={app.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {/* Row */}
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-[#d4a0a8] flex items-center justify-center text-white font-semibold shrink-0 overflow-hidden">
                    {app.avatar_url ? (
                      <img src={app.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      app.full_name?.[0]?.toUpperCase() || 'C'
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{app.full_name}</p>
                      {cp?.discipline && (
                        <span className="text-xs text-gray-400">· {cp.discipline}</span>
                      )}
                      {cp?.location && (
                        <span className="text-xs text-gray-400">· {cp.location}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {cp?.years_experience != null && (
                        <p className="text-xs text-gray-400">{cp.years_experience} yrs exp.</p>
                      )}
                      {cp?.hourly_rate != null && (
                        <p className="text-xs text-gray-400">₦{Number(cp.hourly_rate).toLocaleString()}/mo</p>
                      )}
                      {cp?.availability && (
                        <p className="text-xs text-gray-400 capitalize">{cp.availability.replace('_', ' ')}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        Applied {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  {/* Work samples count */}
                  {samples.length > 0 && (
                    <span className="text-xs text-gray-400 shrink-0">{samples.length} sample{samples.length !== 1 ? 's' : ''}</span>
                  )}

                  {/* Status badge */}
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium shrink-0 ${statusCfg.bg} ${statusCfg.color}`}>
                    {statusCfg.label}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateStatus(app.id, 'approved')}
                          disabled={isUpdating}
                          className="flex items-center gap-1.5 bg-green-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle size={13} />
                          Approve
                        </button>
                        <button
                          onClick={() => updateStatus(app.id, 'rejected')}
                          disabled={isUpdating}
                          className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          <XCircle size={13} />
                          Reject
                        </button>
                      </>
                    )}
                    {status === 'approved' && (
                      <button
                        onClick={() => updateStatus(app.id, 'rejected')}
                        disabled={isUpdating}
                        className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-50"
                      >
                        Revoke
                      </button>
                    )}
                    {status === 'rejected' && (
                      <button
                        onClick={() => updateStatus(app.id, 'approved')}
                        disabled={isUpdating}
                        className="text-xs text-green-600 hover:text-green-800 font-medium transition-colors disabled:opacity-50"
                      >
                        Re-approve
                      </button>
                    )}

                    {/* Expand toggle */}
                    <button
                      onClick={() => setExpanded(isExpanded ? null : app.id)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-gray-50 px-5 py-5 bg-gray-50/50 space-y-5">
                    {/* Bio */}
                    {app.bio && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Bio</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{app.bio}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                      {/* Skills */}
                      {cp?.skills?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Skills</p>
                          <div className="flex flex-wrap gap-1.5">
                            {cp.skills.map((skill: string) => (
                              <span key={skill} className="text-xs border border-gray-200 rounded-full px-2.5 py-0.5 text-gray-600">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Portfolio link */}
                      {cp?.portfolio_url && (
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Portfolio</p>
                          <a
                            href={cp.portfolio_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-[#6b1d2b] hover:underline font-medium"
                          >
                            <ExternalLink size={12} />
                            View portfolio
                          </a>
                        </div>
                      )}

                      {/* Rate */}
                      {cp?.hourly_rate != null && (
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Monthly Rate</p>
                          <p className="text-sm font-semibold text-gray-900">₦{Number(cp.hourly_rate).toLocaleString()}</p>
                        </div>
                      )}
                    </div>

                    {/* Work samples */}
                    {samples.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Work Samples</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {samples.map((sample: any) => (
                            <a
                              key={sample.id}
                              href={sample.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group block rounded-lg overflow-hidden border border-gray-200 hover:border-gray-400 transition-colors"
                            >
                              {sample.file_type === 'image' ? (
                                <div className="aspect-square bg-gray-100">
                                  <img
                                    src={sample.url}
                                    alt={sample.title ?? ''}
                                    className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                                  />
                                </div>
                              ) : (
                                <div className="aspect-square bg-gray-50 flex flex-col items-center justify-center gap-2 p-3">
                                  {sample.file_type === 'pdf'
                                    ? <FileText size={24} className="text-gray-400" />
                                    : sample.file_type === 'video'
                                    ? <Film size={24} className="text-gray-400" />
                                    : <ImageIcon size={24} className="text-gray-400" />}
                                  <p className="text-[10px] text-gray-500 text-center truncate w-full px-1">{sample.title}</p>
                                </div>
                              )}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

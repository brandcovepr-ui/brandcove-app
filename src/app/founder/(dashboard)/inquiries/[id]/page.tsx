'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/useUser'
import Link from 'next/link'
import { format } from 'date-fns'
import { Sparkles } from 'lucide-react'

export default function InquiryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useUser()

  const { data: inquiry, isLoading } = useQuery({
    queryKey: ['inquiry', id],
    queryFn: async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('inquiries')
        .select('*, founder:profiles!founder_id(id, full_name, avatar_url), creative:profiles!creative_id(id, full_name, avatar_url, bio, creative_profiles(discipline, skills))')
        .eq('id', id)
        .single()
      return data
    },
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="p-8 animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-48" />
        <div className="h-48 bg-gray-200 rounded-xl" />
      </div>
    )
  }

  if (!inquiry) {
    return <div className="p-8 text-gray-500">Inquiry not found.</div>
  }

  const creative = (inquiry as any).creative
  const cp = creative?.creative_profiles
  const other = profile?.role === 'founder' ? creative : (inquiry as any).founder

  return (
    <div className="p-8 max-w-5xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-7">
        <Link href="/founder/inquiries" className="hover:text-gray-600 transition-colors">Inquiries</Link>
        <span>›</span>
        <span className="text-gray-700 font-medium">{other?.full_name}</span>
      </nav>

      <div className="flex gap-6">
        {/* Main content */}
        <div className="flex-1 space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-full bg-[#d4a0a8] flex items-center justify-center text-white font-semibold shrink-0 overflow-hidden">
                {other?.avatar_url
                  ? <img src={other.avatar_url} alt="" className="w-full h-full object-cover" />
                  : other?.full_name?.[0]?.toUpperCase() || 'U'
                }
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">{other?.full_name}</p>
                <p className="text-xs text-gray-500">{cp?.discipline}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-400 mb-3">
                Original Inquiry · {format(new Date((inquiry as any).created_at), 'MMM d, yyyy')}
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {(inquiry as any).project_description}
              </p>
            </div>

            {(inquiry as any).timeline && (
              <div className="mt-5 pt-4 border-t border-gray-50">
                <p className="text-xs text-gray-400 mb-0.5">Timeline</p>
                <p className="text-sm text-gray-700">{(inquiry as any).timeline}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-48 shrink-0 space-y-5">
          {(inquiry as any).budget && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Budget Shared
              </p>
              <p className="text-sm font-semibold text-gray-900">
                ₦{Number((inquiry as any).budget).toLocaleString()} / month
              </p>
            </div>
          )}

          {(inquiry as any).budget && cp?.skills?.length > 0 && (
            <div className="border-t border-gray-100" />
          )}

          {cp?.skills?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Talent Snapshot
              </p>
              <div className="flex items-start gap-2">
                <Sparkles size={13} className="text-gray-400 mt-0.5 shrink-0" />
                <p className="text-xs text-gray-600 leading-relaxed">
                  Specializes in {cp.skills.slice(0, 2).join(' & ')}.
                </p>
              </div>
            </div>
          )}

          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Status</p>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              ({
                pending: 'bg-yellow-100 text-yellow-700',
                accepted: 'bg-green-100 text-green-700',
                declined: 'bg-red-100 text-red-700',
                hired: 'bg-blue-100 text-blue-700',
              } as Record<string, string>)[(inquiry as any).status] || 'bg-gray-100 text-gray-700'
            }`}>
              {(inquiry as any).status}
            </span>
          </div>

          <Link
            href={`/founder/profile/${creative?.id}`}
            className="block text-xs text-[#6b1d2b] hover:underline font-medium"
          >
            View Profile →
          </Link>
        </div>
      </div>
    </div>
  )
}

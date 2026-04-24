'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/useUser'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { FileText } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
  hired: 'bg-blue-100 text-blue-700',
  completed: 'bg-purple-100 text-purple-700',
}

export default function InquiriesPage() {
  const { profile } = useUser()

  const { data: inquiries, isLoading } = useQuery({
    queryKey: ['inquiries', profile?.id],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!profile?.id) return []
      const supabase = createClient()
      const col = profile.role === 'founder' ? 'founder_id' : 'creative_id'
      const { data } = await supabase
        .from('inquiries')
        .select('*, founder:profiles!founder_id(full_name, avatar_url), creative:profiles!creative_id(full_name, avatar_url, creative_profiles(discipline))')
        .eq(col, profile.id)
        .order('updated_at', { ascending: false })
      return data || []
    },
    enabled: !!profile?.id,
  })

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Inquiries</h1>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : inquiries && inquiries.length > 0 ? (
        <div className="space-y-3">
          {inquiries.map((inquiry: any) => {
            const other = profile?.role === 'founder' ? inquiry.creative : inquiry.founder
            const discipline = (inquiry.creative?.creative_profiles as any)?.discipline

            return (
              <Link
                key={inquiry.id}
                href={`/founder/inquiries/${inquiry.id}`}
                className="block bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-200 to-purple-300 flex items-center justify-center text-white font-bold shrink-0">
                      {other?.avatar_url ? (
                        <img src={other.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        other?.full_name?.[0]?.toUpperCase() || 'C'
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{other?.full_name}</p>
                      {discipline && <p className="text-xs text-gray-400">{discipline}</p>}
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{inquiry.project_description}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[inquiry.status]}`}>
                      {inquiry.status}
                    </span>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(inquiry.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <FileText size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 text-sm mb-4">No inquiries yet.</p>
          <Link href="/founder/browse" className="inline-flex items-center gap-2 bg-[#6b1d2b] text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-[#4e1520] transition-colors">
            Browse Talent
          </Link>
        </div>
      )}
    </div>
  )
}

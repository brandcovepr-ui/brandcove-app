'use client'

import Link from 'next/link'
import { Bell, Plus, Bookmark, FileText, MessageSquare } from 'lucide-react'
import { useUser } from '@/lib/hooks/useUser'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'

function useDashboardData(userId: string | undefined) {
  return useQuery({
    queryKey: ['dashboard', userId],
    staleTime: 0,
    queryFn: async () => {
      if (!userId) return null
      const supabase = createClient()

      const { data: allInquiries } = await supabase
        .from('inquiries')
        .select('id')
        .eq('founder_id', userId)
      const inquiryIds = (allInquiries || []).map((i: any) => i.id)
      const inquiryIdFilter = inquiryIds.length > 0 ? inquiryIds : ['00000000-0000-0000-0000-000000000000']

      const [
        { count: shortlistCount },
        { count: inquiryCount },
        { count: messageCount },
        { data: founderProfile },
        { data: recommended },
        { data: recentInquiries },
        { data: recentShortlists },
        { data: recentMessages },
      ] = await Promise.all([
        supabase
          .from('shortlists')
          .select('id', { count: 'exact', head: true })
          .eq('founder_id', userId),
        supabase
          .from('inquiries')
          .select('id', { count: 'exact', head: true })
          .eq('founder_id', userId)
          .eq('status', 'pending'),
        supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .in('inquiry_id', inquiryIdFilter)
          .neq('sender_id', userId),
        supabase
          .from('founder_profiles')
          .select('creative_types_wanted')
          .eq('id', userId)
          .single(),
        supabase
          .from('profiles')
          .select('*, creative_profiles(discipline)')
          .eq('role', 'creative')
          .eq('review_status', 'approved')
          .limit(4),
        supabase
          .from('inquiries')
          .select('id, created_at, creative:profiles!creative_id(full_name)')
          .eq('founder_id', userId)
          .order('created_at', { ascending: false })
          .limit(4),
        supabase
          .from('shortlists')
          .select('id, created_at, creative:profiles!creative_id(full_name)')
          .eq('founder_id', userId)
          .order('created_at', { ascending: false })
          .limit(4),
        supabase
          .from('messages')
          .select('id, content, created_at, sender:profiles!sender_id(full_name)')
          .in('inquiry_id', inquiryIdFilter)
          .neq('sender_id', userId)
          .order('created_at', { ascending: false })
          .limit(4),
      ])

      type ActivityItem = { icon: 'inquiry' | 'message' | 'shortlist'; text: string; time: string; ts: Date }
      const activities: ActivityItem[] = []

      for (const inq of recentInquiries || []) {
        const name = (inq.creative as any)?.full_name || 'a creative'
        activities.push({
          icon: 'inquiry',
          text: `You sent an inquiry to ${name}`,
          time: formatDistanceToNow(new Date(inq.created_at), { addSuffix: true }),
          ts: new Date(inq.created_at),
        })
      }

      for (const sl of recentShortlists || []) {
        const name = (sl.creative as any)?.full_name || 'a creative'
        activities.push({
          icon: 'shortlist',
          text: `You shortlisted ${name}`,
          time: formatDistanceToNow(new Date(sl.created_at), { addSuffix: true }),
          ts: new Date(sl.created_at),
        })
      }

      for (const msg of recentMessages || []) {
        const name = (msg.sender as any)?.full_name || 'A creative'
        activities.push({
          icon: 'message',
          text: `${name} replied to your inquiry`,
          time: formatDistanceToNow(new Date(msg.created_at), { addSuffix: true }),
          ts: new Date(msg.created_at),
        })
      }

      activities.sort((a, b) => b.ts.getTime() - a.ts.getTime())
      const recentActivity = activities.slice(0, 4)

      const creativeTypesWanted: string[] = founderProfile?.creative_types_wanted || []

      return {
        shortlistCount: shortlistCount || 0,
        inquiryCount: inquiryCount || 0,
        messageCount: messageCount || 0,
        recommended: recommended || [],
        recentActivity,
        creativeTypesWanted,
      }
    },
    enabled: !!userId,
  })
}

const ACTIVITY_ICONS = {
  inquiry: FileText,
  message: MessageSquare,
  shortlist: Bookmark,
} as const

export default function DashboardPage() {
  const { profile } = useUser()
  const { data, isLoading } = useDashboardData(profile?.id)

  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  const recommendedSubtitle = (() => {
    const types = data?.creativeTypesWanted
    if (!types || types.length === 0) return 'Creatives available to work with you.'
    if (types.length === 1) return `Based on your interest in ${types[0]}s.`
    const last = types[types.length - 1]
    const rest = types.slice(0, -1).join(', ')
    return `Based on your interest in ${rest} and ${last}s.`
  })()

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {firstName}</h1>
          <p className="text-sm text-gray-500 mt-1">Here is what is happening with your hiring pipeline today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <Bell size={20} />
          </button>
          <Link
            href="/founder/browse"
            className="flex items-center gap-2 bg-[#6b1d2b] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#4e1520] transition-colors"
          >
            <Plus size={16} />
            Hire Talent
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Shortlisted Talents"
          value={data?.shortlistCount ?? 0}
          icon={<Bookmark size={18} className="text-[#6b1d2b]" />}
          loading={isLoading}
        />
        <StatCard
          label="Active Inquiries"
          value={data?.inquiryCount ?? 0}
          icon={<FileText size={18} className="text-[#6b1d2b]" />}
          loading={isLoading}
        />
        <StatCard
          label="Unread Messages"
          value={data?.messageCount ?? 0}
          icon={<MessageSquare size={18} className="text-[#6b1d2b]" />}
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Recommended talent */}
        <div className="col-span-3 bg-white rounded-xl border border-gray-100 ">
          <div className="flex items-center justify-between border-b p-4 mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Recommended Talent</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {isLoading ? '\u00a0' : recommendedSubtitle}
              </p>
            </div>
            <Link href="/founder/browse" className="text-xs text-[#6b1d2b] font-medium hover:underline">View All</Link>
          </div>

          <div className="space-y-3 p-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-100 shrink-0" />
                    <div className="space-y-1.5">
                      <div className="h-3 bg-gray-100 rounded w-28" />
                      <div className="h-2.5 bg-gray-100 rounded w-16" />
                    </div>
                  </div>
                  <div className="h-7 w-20 bg-gray-100 rounded-full" />
                </div>
              ))
            ) : data?.recommended && data.recommended.length > 0 ? (
              data.recommended.map((creative: any) => (
                <div key={creative.id} className="flex items-center justify-between py-2 border-b/80 border-black last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-200 to-purple-300 flex items-center justify-center text-sm font-bold text-white shrink-0 overflow-hidden">
                      {creative.avatar_url ? (
                        <img src={creative.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        creative.full_name?.[0] || 'C'
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{creative.full_name}</p>
                      <p className="text-xs text-gray-400">{(creative.creative_profiles as any)?.discipline || 'Creative'}</p>
                    </div>
                  </div>
                  <Link
                    href={`/founder/profile/${creative.id}`}
                    className="text-xs text-gray-900 border border-gray-200 rounded-sm shadow-sm px-3 py-1 hover:bg-gray-50 transition-colors"
                  >
                    View Profile
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">No creatives available yet.</p>
                <Link href="/founder/browse" className="text-xs text-[#6b1d2b] hover:underline font-medium mt-1 block">Browse talent</Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent activity */}

      </div>
    </div>
  )
}

function StatCard({ label, value, icon, loading }: { label: string; value: number | string; icon: React.ReactNode; loading: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">{label}</p>
        {icon}
      </div>
      {loading ? (
        <div className="h-9 w-16 bg-gray-100 rounded animate-pulse" />
      ) : (
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      )}
    </div>
  )
}

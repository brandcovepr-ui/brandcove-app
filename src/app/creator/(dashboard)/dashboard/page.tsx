'use client'

import Link from 'next/link'
import { useUser } from '@/lib/hooks/useUser'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, Star, TrendingUp, Bell } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

function useCreativeDashboardData(userId: string | undefined) {
  return useQuery({
    queryKey: ['creative-dashboard', userId],
    queryFn: async () => {
      if (!userId) return null
      const supabase = createClient()

      const [
        { count: totalInquiries },
        { count: newInquiries },
        { data: recentInquiries },
      ] = await Promise.all([
        supabase
          .from('inquiries')
          .select('id', { count: 'exact', head: true })
          .eq('creative_id', userId),
        supabase
          .from('inquiries')
          .select('id', { count: 'exact', head: true })
          .eq('creative_id', userId)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('inquiries')
          .select('id, status, created_at, project_description, founder:profiles!founder_id(full_name, avatar_url, founder_profiles(company_name, industry))')
          .eq('creative_id', userId)
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      const { data: unreadMessages } = await supabase
        .from('messages')
        .select('id, inquiry_id')
        .neq('sender_id', userId)
        .in(
          'inquiry_id',
          (recentInquiries || []).map((i: any) => i.id)
        )

      return {
        totalInquiries: totalInquiries || 0,
        newInquiries: newInquiries || 0,
        unreadMessages: (unreadMessages || []).length,
        recentInquiries: recentInquiries || [],
      }
    },
    enabled: !!userId,
  })
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
  hired: 'bg-blue-100 text-blue-700',
}

export default function CreatorDashboardPage() {
  const { profile } = useUser()
  const { data, isLoading } = useCreativeDashboardData(profile?.id)

  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl text-gray-900" style={{ fontFamily: 'var(--font-editorial)' }}>Welcome back, {firstName}</h1>
          <p className="text-sm text-gray-500 mt-1">Here&apos;s how your profile is performing.</p>
        </div>
        {/* <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
          <Bell size={20} />
        </button> */}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Total Inquiries"
          value={isLoading ? '—' : data?.totalInquiries ?? 0}
          icon={<MessageSquare size={18} className="text-[#6b1d2b]" />}
          loading={isLoading}
        />
        <StatCard
          label="New This Week"
          value={isLoading ? '—' : data?.newInquiries ?? 0}
          icon={<TrendingUp size={18} className="text-[#6b1d2b]" />}
          loading={isLoading}
        />
        <StatCard
          label="Unread Messages"
          value={isLoading ? '—' : data?.unreadMessages ?? 0}
          icon={<Star size={18} className="text-[#6b1d2b]" />}
          loading={isLoading}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-md ">
        <div className="flex items-center justify-between  p-6 border-b rounded-t-xl">
          <h2 className="text-base font-semibold text-gray-900">Recent Inquiries</h2>
          <Link href="/creator/messages" className="text-xs text-[#6b1d2b] font-medium hover:underline">
            View All
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse h-14 bg-gray-100 rounded-lg" />
            ))}
          </div>
        ) : data?.recentInquiries && data.recentInquiries.length > 0 ? (
          <div className="space-y-3 p-4">
            {data.recentInquiries.map((inquiry: any) => (
              <Link
                key={inquiry.id}
                href="/creator/messages"
                className="flex items-center border-b-2 justify-between py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-200 to-purple-300 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {(inquiry.founder as any)?.full_name?.[0]?.toUpperCase() || 'F'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {(inquiry.founder as any)?.full_name}
                      {(inquiry.founder as any)?.founder_profiles?.company_name && (
                        <span className="font-normal text-gray-400"> · {(inquiry.founder as any).founder_profiles.company_name}</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 line-clamp-1">
                      {(inquiry.founder as any)?.founder_profiles?.industry
                        ? `${(inquiry.founder as any).founder_profiles.industry} · ${inquiry.project_description}`
                        : inquiry.project_description}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[inquiry.status] || 'bg-gray-100 text-gray-600'}`}>
                    {inquiry.status}
                  </span>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(inquiry.created_at), { addSuffix: true })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageSquare size={36} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">No inquiries yet.</p>
            <p className="text-xs text-gray-400 mt-1">When founders reach out, their messages will appear here.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  loading,
}: {
  label: string
  value: number | string
  icon: React.ReactNode
  loading: boolean
}) {
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

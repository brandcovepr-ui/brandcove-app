import Link from 'next/link'
import { redirect } from 'next/navigation'
import { MessageSquare, Star, TrendingUp } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import { getCreativeDashboardData } from '@/lib/services/dashboard'
import { StatCard } from '@/app/components/creator/StatCard'
import { InquiryListItem } from '@/app/components/creator/InquiryList'

export default async function CreatorDashboardPage() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const data = await getCreativeDashboardData(user.id)

  return (
    <div className="p-4 md:p-8">
      {/* Welcome Header */}
      <div className="mb-6 flex items-start justify-between gap-3 sm:items-center md:mb-8">
        <div>
          <h1
            className="text-2xl font-editorial font-regular text-gray-900"
            
          >
            Welcome back, {data.userFirstName}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here&apos;s how your profile is performing.
          </p>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3 md:mb-8">
        <StatCard
          label="Total Inquiries"
          value={data.totalInquiries}
          icon={<MessageSquare size={18} className="text-[#6b1d2b]" />}
        />
        <StatCard
          label="New This Week"
          value={data.newInquiries}
          icon={<TrendingUp size={18} className="text-[#6b1d2b]" />}
        />
        <StatCard
          label="Unread Messages"
          value={data.unreadMessages}
          icon={<Star size={18} className="text-[#6b1d2b]" />}
        />
      </div>

      {/* Recent Inquiries Panel */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-md">
        <div className="flex items-center justify-between border-b p-6">
          <h2 className="text-base font-semibold text-gray-900">Recent Inquiries</h2>
          <Link
            href="/creator/messages"
            className="text-xs font-medium text-[#6b1d2b] hover:underline"
          >
            View All
          </Link>
        </div>

        {data.recentInquiries.length > 0 ? (
          <div className="space-y-3 p-4">
            {data.recentInquiries.map((inquiry) => (
              <InquiryListItem key={inquiry.id} inquiry={inquiry} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <MessageSquare size={36} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm text-gray-400">No inquiries yet.</p>
            <p className="mt-1 text-xs text-gray-400">
              When founders reach out, their messages will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
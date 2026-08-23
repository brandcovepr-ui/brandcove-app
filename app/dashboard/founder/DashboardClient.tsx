'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Plus, Bookmark, FileText, MessageSquare, Users } from 'lucide-react'
import { DashboardData } from '@/app/actions/founder'

interface DashboardClientProps {
  firstName: string
  data: DashboardData
}

export function DashboardClient({ firstName, data }: DashboardClientProps) {
  const recommendedSubtitle = (() => {
    const types = data.creativeTypesWanted
    if (!types || types.length === 0) return 'Creatives available to work with you.'
    if (types.length === 1) return `Based on your interest in ${types[0]}s.`
    const last = types[types.length - 1]
    const rest = types.slice(0, -1).join(', ')
    return `Based on your interest in ${rest} and ${last}s.`
  })()

  return (
    <div className="flex flex-col h-full p-4 md:p-8 gap-4 md:gap-8">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl md:text-2xl font-regular font-editorial text-gray-900">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here is what is happening with your hiring pipeline today.
          </p>
        </div>
        <Link
          href="/dashboard/founder/browse"
          className="flex items-center gap-2 bg-[#6b1d2b] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#4e1520] transition-colors shrink-0"
        >
          <Plus size={16} />
          Hire Talent
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
        <StatCard
          label="Shortlisted Talents"
          value={data.shortlistCount}
          icon={<Bookmark size={18} className="text-[#6b1d2b]" />}
        />
        <StatCard
          label="Active Inquiries"
          value={data.inquiryCount}
          icon={<FileText size={18} className="text-[#6b1d2b]" />}
        />
        <StatCard
          label="Unread Messages"
          value={data.messageCount}
          icon={<MessageSquare size={18} className="text-[#6b1d2b]" />}
        />
      </div>

      {/* Recommended talent */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-100 min-h-0">
        <div className="flex items-center justify-between border-b border-gray-100 p-4 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Recommended Talent</h2>
            <p className="text-xs text-gray-400 mt-0.5">{recommendedSubtitle}</p>
          </div>
          <Link
            href="/dashboard/founder/browse"
            className="text-xs text-[#6b1d2b] font-medium hover:underline"
          >
            View All
          </Link>
        </div>

        {data.recommended.length > 0 ? (
          <div className="space-y-3 p-4">
            {data.recommended.map((creative) => (
              <div
                key={creative.id}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-9 h-9 rounded-full bg-[#d4a0a8] flex items-center justify-center text-sm font-bold text-white shrink-0 overflow-hidden">
                    {creative.avatar_url ? (
                      <Image
                        src={creative.avatar_url}
                        alt={creative.full_name || 'Creative avatar'}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      creative.full_name?.[0]?.toUpperCase() || 'C'
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{creative.full_name}</p>
                    <p className="text-xs text-gray-400">{creative.discipline}</p>
                  </div>
                </div>
                <Link
                  href={`/dashboard/founder/browse/${creative.id}`}
                  className="text-xs text-gray-900 border border-gray-200 rounded-lg shadow-sm px-3 py-1.5 hover:bg-gray-50 transition-colors"
                >
                  View Profile
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
            <div className="w-20 h-20 rounded-full bg-[#f5eeee] flex items-center justify-center mb-6">
              <Users size={32} className="text-[#6b1d2b]" />
            </div>
            <h2 className="font-editorial text-2xl text-gray-900 mb-3">No talent available yet.</h2>
            <p className="text-sm text-gray-400 max-w-xs leading-relaxed mb-7">
              Creatives are being reviewed and approved. Check back soon — your perfect match is on the way.
            </p>
            <Link
              href="/dashboard/founder/browse"
              className="bg-[#6b1d2b] text-white px-7 py-2.5 rounded-lg text-sm font-medium hover:bg-[#4e1520] transition-colors"
            >
              Browse Talent
            </Link>
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
}: {
  label: string
  value: number | string
  icon: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">{label}</p>
        {icon}
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
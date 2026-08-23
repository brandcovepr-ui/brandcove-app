import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { DashboardInquiry } from '@/lib/services/dashboard'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
  hired: 'bg-blue-100 text-blue-700',
}

export function InquiryListItem({ inquiry }: { inquiry: DashboardInquiry }) {
  const founderName = inquiry.founder?.full_name || 'Founder'
  const companyName = inquiry.founder?.founder_profiles?.company_name
  const industry = inquiry.founder?.founder_profiles?.industry
  const avatarLetter = founderName[0]?.toUpperCase() || 'F'

  const formattedDate = formatDistanceToNow(new Date(inquiry.created_at), {
    addSuffix: true,
  })

  return (
    <Link
      href="/dashboard/creator/inquiries"
      className="-mx-2 flex items-center justify-between rounded-lg border-b border-gray-50 py-2.5 px-2 transition-colors hover:bg-gray-50 last:border-0"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-200 to-purple-300 text-sm font-bold text-white">
          {avatarLetter}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            {founderName}
            {companyName && (
              <span className="font-normal text-gray-400"> · {companyName}</span>
            )}
          </p>
          <p className="line-clamp-1 text-xs text-gray-400">
            {industry ? `${industry} · ${inquiry.project_description}` : inquiry.project_description}
          </p>
        </div>
      </div>

      <div className="ml-4 shrink-0 text-right">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
            STATUS_COLORS[inquiry.status] || 'bg-gray-100 text-gray-600'
          }`}
        >
          {inquiry.status}
        </span>
        <p className="mt-1 text-[10px] text-gray-400">{formattedDate}</p>
      </div>
    </Link>
  )
}
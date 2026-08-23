'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import type { Inquiry } from '@/lib/types'
import type { Tab } from '@/lib/types/inquiry'
import { Avatar } from './Avatar'

interface InquiryListClientProps {
  inquiries: Inquiry[]
  currentTab: Tab
  profileId: string
}

function relativeTime(dateStr: string) {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
    .replace('about ', '')
    .replace('less than a minute ago', 'Just now')
}

export function InquiryListClient({ inquiries, currentTab, profileId }: InquiryListClientProps) {
  const router = useRouter()

  function hasReplied(inq: Inquiry) {
    return inq.messages?.some((m) => m.sender_id === profileId)
  }

  const filtered = inquiries.filter((inq) => {
    if (currentTab === 'declined') return inq.status === 'declined'
    if (currentTab === 'replied') return hasReplied(inq) && inq.status !== 'declined'
    return true
  })

  const tabs: { id: Tab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'replied', label: 'Replied' },
    { id: 'declined', label: 'Declined' },
  ]

  return (
    <>
      <div className="flex items-center gap-1 border-b border-gray-200 mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => router.push(`/dashboard/creator/inquiries?tab=${t.id}`)}
            className={`px-4 pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              currentTab === t.id ? 'border-[#6b1d2b] text-[#6b1d2b]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {filtered.map((inq) => {
            const founder = inq.founder
            // const fp = Array.isArray(founder?.) ? founder.founder_profiles[0] : founder?.founder_profiles
            // const companyName = fp?.company_name
            // const listIndustry = fp?.industry
            const replied = hasReplied(inq)
            const isUnread = !replied && inq.status !== 'declined'

            return (
              <Link
                key={inq.id}
                href={`/dashboard/creator/inquiries?id=${inq.id}`}
                className="w-full flex items-center gap-3 md:gap-4 px-4 md:px-6 py-4 text-left border-b border-gray-50 last:border-0 hover:bg-gray-50/70 transition-colors"
              >
                <div className="w-2 h-2 shrink-0">{isUnread && <span className="block w-2 h-2 rounded-full bg-[#6b1d2b]" />}</div>
                <Avatar name={founder?.full_name} url={founder?.avatar_url} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    { founder?.full_name || 'Founder'}
                   
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{inq.project_description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-400">{relativeTime(inq.updated_at)}</p>
                
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-500 text-sm">No inquiries found in this view.</p>
        </div>
      )}
    </>
  )
}
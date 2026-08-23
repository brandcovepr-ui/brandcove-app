import { Globe } from 'lucide-react'
import { format } from 'date-fns'
import type { Inquiry,Offer } from '@/lib/types/inquiry'
import { Avatar } from './Avatar'

interface InquirySidebarProps {
  inquiry: Inquiry
  offer?: Offer
  displayRate: number | null
}

export function InquirySidebar({ inquiry, offer, displayRate }: InquirySidebarProps) {
  const founder = inquiry.founder
  const fp = Array.isArray(founder?.founder_profiles) ? founder.founder_profiles[0] : founder?.founder_profiles
  const companyName = fp?.company_name
  const industry = fp?.industry

  const isAccepted = inquiry.status === 'accepted' || inquiry.status === 'hired'
  const isDeclined = inquiry.status === 'declined'
  const isCancelled = inquiry.status === 'cancelled'
  const hasPendingOffer = offer && offer.status === 'pending'

  return (
    <div className="hidden md:flex w-56 lg:w-64 shrink-0 border-l border-gray-100 flex-col overflow-y-auto p-6 space-y-6" style={{ background: '#EFE9E2' }}>
      <div>
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Founder</p>
        <div className="flex items-center gap-2.5">
          <Avatar name={founder?.full_name} url={founder?.avatar_url} size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{founder?.full_name || '—'}</p>
            {companyName && <p className="text-xs text-gray-500 truncate">{companyName}</p>}
            {industry && <p className="text-xs text-gray-400 truncate">{industry}</p>}
          </div>
        </div>
        {fp?.website_url && (
          <a href={fp.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-[#6b1d2b] font-medium hover:underline mt-3">
            <Globe size={12} />
            View website
          </a>
        )}
      </div>

      {displayRate != null && (
        <div>
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Budget</p>
          <p className="text-2xl font-bold text-gray-900">₦{Number(displayRate).toLocaleString()}</p>
          <p className="text-xs text-gray-500">/ month</p>
        </div>
      )}

      {inquiry.timeline && (
        <div>
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Timeline</p>
          <p className="text-sm font-semibold text-gray-900">{inquiry.timeline}</p>
        </div>
      )}

      {offer?.start_date && (
        <div>
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Start Date</p>
          <p className="text-sm font-semibold text-gray-900">{format(new Date(offer.start_date), 'MMM d, yyyy')}</p>
        </div>
      )}

      <div>
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</p>
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            isAccepted
              ? 'bg-green-100 text-green-700'
              : isDeclined
              ? 'bg-red-100 text-red-700'
              : isCancelled
              ? 'bg-gray-100 text-gray-600'
              : hasPendingOffer
              ? 'bg-blue-100 text-blue-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {isAccepted ? 'Accepted' : isDeclined ? 'Declined' : isCancelled ? 'Cancelled' : hasPendingOffer ? 'Offer pending' : 'Active'}
        </span>
      </div>
    </div>
  )
}
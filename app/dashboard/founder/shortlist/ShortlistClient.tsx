'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Trash2, Bookmark } from 'lucide-react'
import { SendInquiryModal } from '@/app/components/ui/InquiryModal'
import { format } from 'date-fns/fp'
import { removeFromShortlistAction, type ShortlistItem } from '@/app/actions/founder'

function abbrevName(name: string | null) {
  if (!name) return '—'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

export function ShortlistClient({
  initialItems,
}: {
  initialItems: ShortlistItem[]
}) {
  const [items, setItems] = useState<ShortlistItem[]>(initialItems)
  const [inquiryTarget, setInquiryTarget] = useState<{ id: string; name: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleRemove(creativeId: string) {
    // Optimistic UI update
    setItems((prev) => prev.filter((item) => item.creative.id !== creativeId))

    startTransition(async () => {
      try {
        await removeFromShortlistAction(creativeId)
      } catch (err) {
        // Revert on failure
        setItems(initialItems)
      }
    })
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-editorial font-regular text-gray-900 mb-6 md:mb-8">
        Your Shortlist
      </h1>

      {items.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* Desktop table header */}
          <div className="hidden sm:grid grid-cols-[2fr_1.5fr_1.5fr_1.5fr_auto] gap-4 px-6 py-3 border-b border-gray-100">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Talent</p>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Role</p>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Rate</p>
            {/*<p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Saved On</p>*/}
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Actions</p>
          </div>

          {items.map((item) => {
            const creative = item.creative
            return (
              <div key={item.id} className="border-b border-gray-50 last:border-0">
                {/* Desktop row */}
                <div className="hidden sm:grid grid-cols-[2fr_1.5fr_1.5fr_1.5fr_auto] gap-4 items-center px-6 py-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="relative w-9 h-9 rounded-full bg-[#d4a0a8] flex items-center justify-center text-white text-sm font-semibold shrink-0 overflow-hidden">
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
                    <Link
                      href={`/dashboard/founder/browse/${creative.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-[#6b1d2b] transition-colors"
                    >
                      {abbrevName(creative.full_name)}
                    </Link>
                  </div>
                  <p className="text-sm text-gray-600">{creative.discipline || '—'}</p>
                  <p className="text-sm text-gray-700 font-medium">
                    {creative.rate ? `₦${(creative.rate / 1000).toFixed(0)}k/mo` : '—'}
                  </p>
                  {/*<p className="text-sm text-gray-500">
                    {format(new Date(item.created_at), 'MMM d, yyyy')}
                  </p>*/}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleRemove(creative.id)}
                      disabled={isPending}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1 disabled:opacity-50"
                      aria-label="Remove talent"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setInquiryTarget({
                          id: creative.id,
                          name: creative.full_name || 'Creative',
                        })
                      }
                      className="bg-[#6b1d2b] text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-[#4e1520] transition-colors whitespace-nowrap"
                    >
                      Send Inquiry
                    </button>
                  </div>
                </div>

                {/* Mobile card */}
                <div className="sm:hidden flex items-center gap-3 px-4 py-4">
                  <div className="relative w-10 h-10 rounded-full bg-[#d4a0a8] flex items-center justify-center text-white text-sm font-semibold shrink-0 overflow-hidden">
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
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/dashboard/founder/browse/${creative.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-[#6b1d2b] transition-colors"
                    >
                      {abbrevName(creative.full_name)}
                    </Link>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {creative.discipline || '—'}
                      {creative.rate ? ` · ₦${(creative.rate / 1000).toFixed(0)}k/mo` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRemove(creative.id)}
                      disabled={isPending}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1 disabled:opacity-50"
                      aria-label="Remove talent"
                    >
                      <Trash2 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setInquiryTarget({
                          id: creative.id,
                          name: creative.full_name || 'Creative',
                        })
                      }
                      className="bg-[#6b1d2b] text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-[#4e1520] transition-colors whitespace-nowrap"
                    >
                      Inquire
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-gray-100">
          <div className="w-20 h-20 rounded-full bg-[#f5eeee] flex items-center justify-center mb-6">
            <Bookmark size={32} className="text-[#6b1d2b]" />
          </div>
          <h2 className="font-editorial text-3xl text-gray-900 text-center mb-3">
            You have not saved
            <br />
            anyone yet.
          </h2>
          <p className="text-sm text-gray-400 text-center max-w-xs leading-relaxed mb-7">
            Tap the bookmark icon on any talent card or profile to save them here for easy access later.
          </p>
          <Link
            href="/dashboard/founder/browse"
            className="bg-[#6b1d2b] text-white px-7 py-2.5 rounded-lg text-sm font-medium hover:bg-[#4e1520] transition-colors"
          >
            Browse Talent
          </Link>
        </div>
      )}

      {inquiryTarget && (
        <SendInquiryModal
          creativeId={inquiryTarget.id}
          creativeName={inquiryTarget.name}
          onClose={() => setInquiryTarget(null)}
        />
      )}
    </div>
  )
}
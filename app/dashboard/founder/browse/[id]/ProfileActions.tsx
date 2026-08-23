'use client'

import { useState, useTransition } from 'react'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { toggleShortlist } from './actions'
import { SendInquiryModal } from '@/app/components/ui/InquiryModal'

interface ProfileActionsProps {
  creativeId: string
  creativeName: string
  firstName: string
  initialShortlisted: boolean
}

export function ProfileActions({
  creativeId,
  creativeName,
  firstName,
  initialShortlisted,
}: ProfileActionsProps) {
  const [inquiryOpen, setInquiryOpen] = useState(false)
  const [shortlisted, setShortlisted] = useState(initialShortlisted)
  const [isPending, startTransition] = useTransition()

  const handleToggleShortlist = () => {
    const nextState = !shortlisted
    setShortlisted(nextState)

    startTransition(async () => {
      try {
        await toggleShortlist(creativeId, shortlisted)
      } catch {
        setShortlisted(!nextState) // Rollback on failure
      }
    })
  }

  return (
    <>
      <div className="mt-5 md:mt-7 space-y-2">
        <button
          onClick={() => setInquiryOpen(true)}
          className="w-full bg-[#6b1d2b] text-white rounded-full py-2.5 md:py-3 text-sm font-semibold hover:bg-[#4e1520] transition-colors"
        >
          Hire {firstName}
        </button>
        <button
          onClick={handleToggleShortlist}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-full py-2.5 md:py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
        >
          {shortlisted ? (
            <BookmarkCheck size={14} className="text-[#6b1d2b]" />
          ) : (
            <Bookmark size={14} />
          )}
          {shortlisted ? 'Saved to shortlist' : 'Save to shortlist'}
        </button>
      </div>

      {inquiryOpen && (
        <SendInquiryModal
          creativeId={creativeId}
          creativeName={creativeName}
          onClose={() => setInquiryOpen(false)}
        />
      )}
    </>
  )
}
import { getFounderInquiries, getInquiryMessages } from './actions'
import { FounderInquiryClient } from './FounderInquiryClient'

interface PageProps {
  searchParams: Promise<{ id?: string }>
}

export default async function FounderInquiriesPage({ searchParams }: PageProps) {
  const { id: selectedId } = await searchParams
  const { inquiries, userId } = await getFounderInquiries()

  let initialMessages: any[] = []
  if (selectedId) {
    initialMessages = await getInquiryMessages(selectedId)
  }

  return (
    <FounderInquiryClient
      inquiries={inquiries}
      selectedId={selectedId || null}
      initialMessages={initialMessages}
      userId={userId}
    />
  )
}
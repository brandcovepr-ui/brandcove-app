import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InquiryDetailClient } from './InquiryDetailsClient'
interface PageProps {
  params: Promise<{ id: string }>
}

export default async function InquiryDetailPage({ params }: PageProps) {
  const { id: inquiryId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: inquiry, error } = await supabase
    .from('inquiries')
    .select(`
      id, status, updated_at, created_at, project_description, timeline, budget,
      founder:profiles!founder_id(
        id, full_name, avatar_url,
        founder_profiles(company_name, industry, website_url, company_description)
      ),
      messages(id, content, created_at, sender_id),
      offers(id, rate, terms, start_date, status, created_at)
    `)
    .eq('id', inquiryId)
    .eq('creative_id', user.id)
    .single()

  if (error || !inquiry) {
    notFound()
  }

  // Mark inquiry as read on the server
  // await markInquiryAsRead(inquiryId)

  return <InquiryDetailClient inquiry={inquiry} currentUserId={user.id} />
}

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import type { Tab } from '@/lib/types/inquiry'
import type { Inquiry } from '@/lib/types'
import { InquiryChatShell } from '@/app/components/creator/inquiries/InquiryChatShell'
import { InquirySidebar } from '@/app/components/creator/inquiries/InquiriesSideBar'
import { InquiryListClient } from '@/app/components/creator/inquiries/InquiriesListClients'

interface PageProps {
  searchParams: Promise<{ id?: string; tab?: Tab }>
}

export default async function CreatorInquiriesPage({ searchParams }: PageProps) {
  const { id: selectedId, tab = 'all' } = await searchParams
  const supabase = await createSupabaseServerClient()

  // 1. Authenticate on Server
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Fetch All Inquiries on Server
  const { data: rawInquiries } = await supabase
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
    .eq('creative_id', user.id)
    .order('updated_at', { ascending: false })

  const inquiries = (rawInquiries as unknown as Inquiry[]) || []
  const selectedInquiry = inquiries.find((i) => i.id === selectedId) || null

  // ── Detail View (Server-Rendered Frame) ───────────────────────────────────
  if (selectedId && selectedInquiry) {
    const founder = selectedInquiry.founder
    const fp = Array.isArray(founder?.founder_profiles) ? founder.founder_profiles[0] : founder?.founder_profiles
    const founderName = founder?.full_name || 'the founder'
    const companyName = fp?.company_name || null

    const sortedOffers = [...(selectedInquiry.offers || [])].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    const offer = sortedOffers[0]
    const displayRate = offer?.rate ?? selectedInquiry.budget

    return (
      <div className="flex flex-col h-full min-h-0">
        {/* Server-Rendered Breadcrumb Header */}
        <div className="px-4 md:px-8 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/creator/inquiries"
              className="font-editorial text-lg md:text-2xl text-gray-400 hover:text-gray-700 transition-colors leading-none"
            >
              Inquiries
            </Link>
            <ChevronRight size={16} className="text-gray-300 shrink-0" />
            <span className="font-editorial text-lg md:text-2xl text-gray-900 leading-none truncate">
              {companyName || founderName}
            </span>
          </div>
        </div>

        {/* Client Shell for Realtime Chat & Actions */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <InquiryChatShell
            inquiry={selectedInquiry}
            profileId={user.id}
            offer={offer}
          />
          {/*<InquirySidebar inquiry={selectedInquiry} offer={offer} displayRate={displayRate} />*/}
        </div>
      </div>
    )
  }

  // ── List View (Server-Rendered Frame) ──────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 md:px-8 py-5 border-b border-gray-100 shrink-0">
        <h1 className="text-2xl font-editorial font-regular text-gray-900">Your Inquiries</h1>
      </div>

      <div className="p-4 md:p-8 flex-1 overflow-y-auto">
        <InquiryListClient inquiries={inquiries} currentTab={tab} profileId={user.id} />
      </div>
    </div>
  )
}
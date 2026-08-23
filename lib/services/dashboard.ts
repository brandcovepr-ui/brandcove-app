
import { createSupabaseServerClient } from '../supabase/server-client'
export interface DashboardInquiry {
  id: string
  status: string
  created_at: string
  project_description: string
  founder: {
    full_name: string | null
    avatar_url: string | null
    founder_profiles: {
      company_name: string | null
      industry: string | null
    } | null
  } | null
}

export interface DashboardData {
  userFirstName: string
  totalInquiries: number
  newInquiries: number
  unreadMessages: number
  recentInquiries: DashboardInquiry[]
}

export async function getCreativeDashboardData(userId: string): Promise<DashboardData> {
  const supabase = await createSupabaseServerClient()

  // 1. Fetch user profile for name display
  const profilePromise = supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .single()

  // 2. Fetch total inquiries count
  const totalInquiriesPromise = supabase
    .from('inquiries')
    .select('id', { count: 'exact', head: true })
    .eq('creative_id', userId)

  // 3. Fetch inquiries created in the past 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const newInquiriesPromise = supabase
    .from('inquiries')
    .select('id', { count: 'exact', head: true })
    .eq('creative_id', userId)
    .gte('created_at', sevenDaysAgo)

  // 4. Fetch 5 most recent inquiries with joined founder information
  const recentInquiriesPromise = supabase
    .from('inquiries')
    .select(
      `
      id,
      status,
      created_at,
      project_description,
      founder:profiles!founder_id (
        full_name,
        avatar_url,
        founder_profiles (
          company_name,
          industry
        )
      )
    `
    )
    .eq('creative_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)

  const [profileRes, totalRes, newRes, recentRes] = await Promise.all([
    profilePromise,
    totalInquiriesPromise,
    newInquiriesPromise,
    recentInquiriesPromise,
  ])

  const recentInquiries = (recentRes.data as unknown as DashboardInquiry[]) || []
  const inquiryIds = recentInquiries.map((i) => i.id)

  // 5. Fetch unread messages for those inquiries if any exist
  let unreadCount = 0
  if (inquiryIds.length > 0) {
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .neq('sender_id', userId)
      .in('inquiry_id', inquiryIds)

    unreadCount = count || 0
  }

  const fullName = profileRes.data?.full_name || ''
  const userFirstName = fullName.split(' ')[0] || 'there'

  return {
    userFirstName,
    totalInquiries: totalRes.count || 0,
    newInquiries: newRes.count || 0,
    unreadMessages: unreadCount,
    recentInquiries,
  }
}
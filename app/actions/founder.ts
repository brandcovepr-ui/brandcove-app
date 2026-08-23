'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import { revalidatePath } from 'next/cache'
import { notifyInquiry } from '@/lib/email/notifications'

function getCreativeProfileData(creativeProfiles: any) {
  if (!creativeProfiles) return null
  return Array.isArray(creativeProfiles) ? creativeProfiles[0] : creativeProfiles
}

/* =============================================================================
   1. FOUNDER DASHBOARD DATA
   ============================================================================= */

export interface DashboardData {
  shortlistCount: number
  inquiryCount: number
  messageCount: number
  recommended: Array<{
    id: string
    full_name: string | null
    avatar_url: string | null
    discipline: string
  }>
  creativeTypesWanted: string[]
}

export async function getFounderDashboardData(userId: string): Promise<DashboardData> {
  const supabase = await createSupabaseServerClient()

  const { data: allInquiries } = await supabase
    .from('inquiries')
    .select('id')
    .eq('founder_id', userId)

  const inquiryIds = (allInquiries || []).map((i) => i.id)
  const inquiryIdFilter = inquiryIds.length > 0 ? inquiryIds : ['00000000-0000-0000-0000-000000000000']

  const [
    { count: shortlistCount },
    { count: inquiryCount },
    { count: messageCount },
    { data: founderProfile },
    { data: recommendedData },
  ] = await Promise.all([
    supabase
      .from('shortlists')
      .select('id', { count: 'exact', head: true })
      .eq('founder_id', userId),
    supabase
      .from('inquiries')
      .select('id', { count: 'exact', head: true })
      .eq('founder_id', userId)
      .eq('status', 'pending'),
    supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .in('inquiry_id', inquiryIdFilter)
      .neq('sender_id', userId),
    supabase
      .from('founder_profiles')
      .select('creative_types_wanted')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('id, full_name, avatar_url, creative_profiles(discipline)')
      .eq('role', 'creative')
      .eq('review_status', 'approved')
      .limit(4),
  ])

  const recommended = (recommendedData || []).map((item: any) => {
    const cp = getCreativeProfileData(item.creative_profiles)
    return {
      id: item.id,
      full_name: item.full_name,
      avatar_url: item.avatar_url,
      discipline: cp?.discipline || 'Creative',
    }
  })

  return {
    shortlistCount: shortlistCount || 0,
    inquiryCount: inquiryCount || 0,
    messageCount: messageCount || 0,
    recommended,
    creativeTypesWanted: founderProfile?.creative_types_wanted || [],
  }
}

/* =============================================================================
   2. CREATIVES DIRECTORY & PROFILES
   ============================================================================= */

export interface CreativeItem {
  id: string
  full_name: string | null
  avatar_url: string | null
  discipline: string | null
  rate: number | null
  location: string | null
  availability?: string | null
}

export interface GetCreativesParams {
  role?: string
  maxRate?: number
  availability?: string
  page?: number
  pageSize?: number
}

export interface GetCreativesResponse {
  items: CreativeItem[]
  total: number
  pageSize: number
  shortlistedIds: string[]
}

export async function getCreativesAction(
  params: GetCreativesParams = {}
): Promise<GetCreativesResponse> {
  const { role, maxRate, availability, page = 0, pageSize = 9 } = params

  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let shortlistedIds: string[] = []
  if (user) {
    const { data: shortlists } = await supabase
      .from('shortlists')
      .select('creative_id')
      .eq('founder_id', user.id)

    shortlistedIds = (shortlists || []).map((s) => s.creative_id)
  }

  let query = supabase
    .from('profiles')
    .select(
      `
      id,
      full_name,
      avatar_url,
      creative_profiles!inner (
        discipline,
        hourly_rate,
        location,
        availability
      )
    `,
      { count: 'exact' }
    )
    .eq('role', 'creative')
    .eq('review_status', 'approved')

  if (role) {
    query = query.eq('creative_profiles.discipline', role)
  }

  if (maxRate !== undefined) {
    query = query.lte('creative_profiles.hourly_rate', maxRate)
  }

  if (availability) {
    query = query.eq('creative_profiles.availability', availability)
  }

  const from = page * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    throw new Error('Failed to fetch creatives.')
  }

  const items: CreativeItem[] = (data || []).map((item: any) => {
    const cp = getCreativeProfileData(item.creative_profiles)

    return {
      id: item.id,
      full_name: item.full_name,
      avatar_url: item.avatar_url,
      discipline: cp?.discipline || null,
      rate: cp?.hourly_rate || null,
      location: cp?.location || null,
      availability: cp?.availability || null,
    }
  })

  return {
    items,
    total: count || 0,
    pageSize,
    shortlistedIds,
  }
}

export interface DetailedCreativeProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  discipline: string | null
  rate: number | null
  location: string | null
  availability: string | null
  skills: string[]
  portfolio_url?: string | null
  portfolio_links?: any
  years_experience?: number | null
  isShortlisted: boolean
}

export async function getCreativeProfileById(
  creativeId: string
): Promise<DetailedCreativeProfile | null> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('profiles')
    .select(
      `
      id,
      full_name,
      avatar_url,
      bio,
      creative_profiles (
        discipline,
        hourly_rate,
        location,
        availability,
        skills,
        portfolio_url,
        portfolio_links,
        years_experience
      )
    `
    )
    .eq('id', creativeId)
    .eq('role', 'creative')
    .eq('review_status', 'approved')
    .single()

  if (error || !data) return null

  let isShortlisted = false
  if (user) {
    const { data: shortlist } = await supabase
      .from('shortlists')
      .select('id')
      .eq('founder_id', user.id)
      .eq('creative_id', creativeId)
      .maybeSingle()

    isShortlisted = !!shortlist
  }

  const cp = getCreativeProfileData(data.creative_profiles)

  return {
    id: data.id,
    full_name: data.full_name,
    avatar_url: data.avatar_url,
    bio: data.bio,
    discipline: cp?.discipline || null,
    rate: cp?.hourly_rate || null,
    location: cp?.location || null,
    availability: cp?.availability || null,
    skills: cp?.skills || [],
    portfolio_url: cp?.portfolio_url || null,
    portfolio_links: cp?.portfolio_links || null,
    years_experience: cp?.years_experience || null,
    isShortlisted,
  }
}

/* =============================================================================
   3. SHORTLIST ACTIONS & FETCHING
   ============================================================================= */

export async function toggleShortlistAction(creativeId: string, isShortlisted: boolean) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  if (isShortlisted) {
    const { error } = await supabase
      .from('shortlists')
      .delete()
      .match({ founder_id: user.id, creative_id: creativeId })

    if (error) throw new Error('Failed to remove shortlist.')
  } else {
    const { error } = await supabase
      .from('shortlists')
      .insert({ founder_id: user.id, creative_id: creativeId })

    if (error) throw new Error('Failed to add shortlist.')
  }

  revalidatePath('/dashboard/founder', 'layout')
}

export interface ShortlistItem {
  id: string
  created_at: string
  creative: {
    id: string
    full_name: string | null
    avatar_url: string | null
    discipline: string | null
    rate: number | null
  }
}

export async function getShortlistData(): Promise<ShortlistItem[]> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('shortlists')
    .select(
      `
      id,
      created_at,
      creative:profiles!creative_id (
        id,
        full_name,
        avatar_url,
        creative_profiles (
          discipline,
          hourly_rate
        )
      )
    `
    )
    .eq('founder_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error('Failed to fetch shortlist.')
  }

  return (data || []).map((item: any) => {
    const creative = item.creative
    const cp = getCreativeProfileData(creative?.creative_profiles)

    return {
      id: item.id,
      created_at: item.created_at,
      creative: {
        id: creative?.id,
        full_name: creative?.full_name || null,
        avatar_url: creative?.avatar_url || null,
        discipline: cp?.discipline || null,
        rate: cp?.hourly_rate || null,
      },
    }
  })
}

export async function removeFromShortlistAction(creativeId: string) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase
    .from('shortlists')
    .delete()
    .match({ founder_id: user.id, creative_id: creativeId })

  if (error) {
    throw new Error('Failed to remove item from shortlist.')
  }

  revalidatePath('/dashboard/founder', 'layout')
}

/* =============================================================================
   4. INQUIRIES & MESSAGES
   ============================================================================= */

export interface CreateInquiryInput {
  creativeId: string
  projectDescription: string
  timeline?: string | null
  budget?: string | null
}

export async function sendInquiryAction(input: CreateInquiryInput) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: inquiry, error: inquiryError } = await supabase
    .from('inquiries')
    .insert({
      founder_id: user.id,
      creative_id: input.creativeId,
      project_description: input.projectDescription,
      timeline: input.timeline || null,
      budget: input.budget ? Number(input.budget) : null,
    })
    .select('id')
    .single()

  if (inquiryError || !inquiry) {
    throw new Error('Failed to create inquiry record.')
  }

  const { error: messageError } = await supabase.from('messages').insert({
    inquiry_id: inquiry.id,
    sender_id: user.id,
    content: input.projectDescription,
  })

  if (messageError) {
    throw new Error('Inquiry created, but failed to record initial message.')
  }

  void notifyInquiry(inquiry.id, user.id)
    .catch((error) => console.error('[inquiry] notification failed', error))

  return { success: true, inquiryId: inquiry.id }
}

export interface InquirySummary {
  id: string
  status: string
  updated_at: string
  project_description: string
  otherParty: {
    id: string
    full_name: string | null
    avatar_url: string | null
    discipline?: string | null
  }
}

export interface InquiryDetail {
  id: string
  created_at: string
  project_description: string
  timeline: string | null
  budget: number | null
  status: string
  creative: {
    id: string
    full_name: string | null
    avatar_url: string | null
    bio: string | null
    discipline: string | null
    skills: string[]
  }
  founder: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
}

export async function getInquiriesList(): Promise<InquirySummary[]> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isFounder = profile?.role === 'founder'
  const filterCol = isFounder ? 'founder_id' : 'creative_id'

  const { data, error } = await supabase
    .from('inquiries')
    .select(
      `
      id,
      status,
      updated_at,
      project_description,
      founder:profiles!founder_id(id, full_name, avatar_url),
      creative:profiles!creative_id(
        id, 
        full_name, 
        avatar_url, 
        creative_profiles(discipline)
      )
    `
    )
    .eq(filterCol, user.id)
    .order('updated_at', { ascending: false })

  if (error || !data) return []

  return data.map((item: any) => {
    const rawOther = isFounder ? item.creative : item.founder
    const cp = getCreativeProfileData(item.creative?.creative_profiles)

    return {
      id: item.id,
      status: item.status,
      updated_at: item.updated_at,
      project_description: item.project_description,
      otherParty: {
        id: rawOther?.id,
        full_name: rawOther?.full_name || null,
        avatar_url: rawOther?.avatar_url || null,
        discipline: isFounder ? cp?.discipline || null : null,
      },
    }
  })
}

export async function getInquiryById(id: string): Promise<InquiryDetail | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('inquiries')
    .select(
      `
      id,
      created_at,
      project_description,
      timeline,
      budget,
      status,
      founder:profiles!founder_id(id, full_name, avatar_url),
      creative:profiles!creative_id(
        id, 
        full_name, 
        avatar_url, 
        bio, 
        creative_profiles(discipline, skills)
      )
    `
    )
    .eq('id', id)
    .single()

  if (error || !data) return null

  const creative = data.creative as any
  const cp = getCreativeProfileData(creative?.creative_profiles)

  return {
    id: data.id,
    created_at: data.created_at,
    project_description: data.project_description,
    timeline: data.timeline,
    budget: data.budget,
    status: data.status,
    creative: {
      id: creative?.id,
      full_name: creative?.full_name || null,
      avatar_url: creative?.avatar_url || null,
      bio: creative?.bio || null,
      discipline: cp?.discipline || null,
      skills: cp?.skills || [],
    },
    founder: {
      id: (data.founder as any)?.id,
      full_name: (data.founder as any)?.full_name || null,
      avatar_url: (data.founder as any)?.avatar_url || null,
    },
  }
}

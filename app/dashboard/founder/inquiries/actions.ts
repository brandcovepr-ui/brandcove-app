'server-only'
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'

export async function getFounderInquiries() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('inquiries')
    .select(`
      id, status, budget, project_description, created_at, updated_at,
      creative:profiles!creative_id(
        id, full_name, avatar_url, bio,
        creative_profiles(discipline, skills)
      )
    `)
    .eq('founder_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) throw new Error(error.message)
  return { inquiries: data || [], userId: user.id }
}

export async function getInquiryMessages(inquiryId: string) {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('messages')
    .select('id, inquiry_id, sender_id, content, created_at')
    .eq('inquiry_id', inquiryId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
}

export async function sendMessageAction(inquiryId: string, content: string) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')
  if (!content.trim()) throw new Error('Message cannot be empty')

  const { error } = await supabase
    .from('messages')
    .insert({
      inquiry_id: inquiryId,
      sender_id: user.id,
      content: content.trim(),
    })

  if (error) throw new Error(error.message)

  // Touch inquiry updated_at
  await supabase
    .from('inquiries')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', inquiryId)

  revalidatePath('/dashboard/founder/inquiries')
  return { success: true }
}

export async function updateInquiryStatusAction(inquiryId: string, status: 'hired' | 'declined' | 'cancelled') {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('inquiries')
    .update({ status })
    .eq('id', inquiryId)
    .eq('founder_id', user.id)

  if (error) throw new Error(error.message)

  if (status === 'hired') {
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/email/hire`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inquiry_id: inquiryId }),
    }).catch((err) => console.error('[hire email]', err))
  }

  revalidatePath('/dashboard/founder/inquiries')
  return { success: true }
}
'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import { revalidatePath } from 'next/cache'
import { notifyMessage, notifyOffer } from '@/lib/email/notifications'

export async function sendReplyAction(inquiryId: string, content: string) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !content.trim()) {
    return { error: 'Unauthorized or empty message' }
  }

  const { error } = await supabase.from('messages').insert({
    inquiry_id: inquiryId,
    sender_id: user.id,
    content: content.trim(),
  })

  if (error) return { error: error.message }

  await supabase
    .from('inquiries')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', inquiryId)

  void notifyMessage(inquiryId, user.id, content.trim().slice(0, 200))
    .catch((error) => console.error('[message] notification failed', error))

  revalidatePath(`/inquiries/${inquiryId}`)
  return { success: true }
}


export async function updateInquiryStatusAction(
  inquiryId: string, 
  status: 'accepted' | 'declined'
) {
  console.log('[DEBUG] updateInquiryStatusAction called:', { inquiryId, status })

  const supabase = await createSupabaseServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error('[DEBUG] Auth failed:', authError)
    return { error: 'Unauthorized user session' }
  }

  console.log('[DEBUG] Authenticated User ID:', user.id)

  const { data, error } = await supabase
    .from('inquiries')
    .update({ 
      status, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', inquiryId)
    .eq('creative_id', user.id)
    .select()

  if (error) {
    console.error('[DEBUG] Supabase DB Error:', error)
    return { error: error.message }
  }

  if (!data || data.length === 0) {
    console.warn('[DEBUG] 0 rows updated! Check if creative_id matches user.id or if RLS policy allows UPDATE.')
    return { error: 'Failed to update: Record not found or permission denied.' }
  }

  // Trigger existing email action
  try {
    await notifyOffer(inquiryId, user.id, status)
  } catch (emailErr: any) {
    console.error('[DEBUG] Email notification failed:', emailErr.message)
    // Non-blocking: status update succeeds even if email transport fails
  }

  revalidatePath(`/inquiries/${inquiryId}`)
  revalidatePath('/inquiries')

  return { success: true }
}


export async function respondToOfferAction(inquiryId: string, offerId: string, status: 'accepted' | 'declined') {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { error: offerError } = await supabase
    .from('offers')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', offerId)
    .eq('inquiry_id', inquiryId)
    .eq('status', 'pending')

  if (offerError) return { error: offerError.message }

  if (status === 'accepted') {
    const { error: inquiryError } = await supabase
      .from('inquiries')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', inquiryId)
      .eq('creative_id', user.id)

    if (inquiryError) return { error: inquiryError.message }
  }

  // Trigger existing email action
  try {
    await notifyOffer(inquiryId, user.id, status)
  } catch (emailErr: any) {
    console.error('[DEBUG] Email notification failed:', emailErr.message)
    // Non-blocking: status update succeeds even if email transport fails
  }
  void notifyOffer(inquiryId, user.id, status)
    .catch((error) => console.error('[offer] notification failed', error))

  revalidatePath(`/inquiries/${inquiryId}`)
  revalidatePath('/inquiries')
  return { success: true }
}

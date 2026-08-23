'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getResend, FROM } from '@/lib/email/client'
import { newInquirySubject, newInquiryHtml } from '@/lib/email/templates/newInquiry'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY!
  )
}

/**
 * POST /api/email/inquiry
 * Body: { inquiry_id: string, sender_id: string }
 *
 * Notifies the creative that a founder sent them a new inquiry.
 */
export async function POST(req: NextRequest) {
  let inquiry_id: string, sender_id: string
  try {
    const body = await req.json()
    inquiry_id = body.inquiry_id
    sender_id = body.sender_id
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!inquiry_id || !sender_id) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Fetch inquiry with founder + creative profiles
  const { data: inquiry, error: inquiryError } = await getSupabaseAdmin()
    .from('inquiries')
    .select('id, project_description, timeline, budget, founder_id, creative_id')
    .eq('id', inquiry_id)
    .single()

  if (inquiryError || !inquiry) {
    return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 })
  }

  // Fetch names
  const { data: profiles } = await getSupabaseAdmin()
    .from('profiles')
    .select('id, full_name')
    .in('id', [inquiry.founder_id, inquiry.creative_id])

  // const founderProfile = profiles?.find((p) => p.id === inquiry.founder_id)
  const creativeProfile = profiles?.find((p) => p.id === inquiry.creative_id)

  // Get creative's email via admin auth API
  const { data: creativeAuth } = await getSupabaseAdmin().auth.admin.getUserById(inquiry.creative_id)

  const recipientEmail = creativeAuth?.user?.email
  if (!recipientEmail) {
    return NextResponse.json({ error: 'Recipient email not found' }, { status: 404 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const ctaUrl = `${appUrl}/creator/messages`

  const { error: emailError } = await getResend().emails.send({
    from: FROM,
    to: recipientEmail,
    subject: newInquirySubject('A founder'),
    html: newInquiryHtml({
      creativeName: creativeProfile?.full_name?.split(' ')[0] ?? 'there',
      founderName: 'A founder',
      projectDescription: inquiry.project_description,
      timeline: inquiry.timeline,
      budget: inquiry.budget,
      ctaUrl,
    }),
  })

  if (emailError) {
    console.error('[email/inquiry]', emailError)
    return NextResponse.json({ error: 'Email failed to send' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

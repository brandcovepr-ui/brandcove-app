import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resend, FROM } from '@/lib/email/client'
import { newMessageSubject, newMessageHtml } from '@/lib/email/templates/newMessage'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/email/message
 * Body: { inquiry_id: string, sender_id: string, preview: string }
 *
 * Notifies the other party in an inquiry thread that a new message was sent.
 */
export async function POST(req: NextRequest) {
  const { inquiry_id, sender_id, preview } = await req.json()

  if (!inquiry_id || !sender_id || !preview) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Fetch inquiry to find both parties
  const { data: inquiry, error: inquiryError } = await supabaseAdmin
    .from('inquiries')
    .select('id, founder_id, creative_id')
    .eq('id', inquiry_id)
    .single()

  if (inquiryError || !inquiry) {
    return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 })
  }

  // Recipient is whichever party is NOT the sender
  const recipientId =
    sender_id === inquiry.founder_id ? inquiry.creative_id : inquiry.founder_id

  // Fetch names for both parties
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name')
    .in('id', [sender_id, recipientId])

  const senderProfile = profiles?.find((p) => p.id === sender_id)
  const recipientProfile = profiles?.find((p) => p.id === recipientId)

  // Get recipient's email via admin auth API
  const { data: recipientAuth } = await supabaseAdmin.auth.admin.getUserById(recipientId)

  const recipientEmail = recipientAuth?.user?.email
  if (!recipientEmail) {
    return NextResponse.json({ error: 'Recipient email not found' }, { status: 404 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  // Deep-link to the right messages page based on who the recipient is
  const ctaUrl =
    recipientId === inquiry.creative_id
      ? `${appUrl}/creative/messages`
      : `${appUrl}/messages`

  const { error: emailError } = await resend.emails.send({
    from: FROM,
    to: recipientEmail,
    subject: newMessageSubject(senderProfile?.full_name ?? 'Someone'),
    html: newMessageHtml({
      recipientName: recipientProfile?.full_name?.split(' ')[0] ?? 'there',
      senderName: senderProfile?.full_name ?? 'Someone',
      preview,
      ctaUrl,
    }),
  })

  if (emailError) {
    console.error('[email/message]', emailError)
    return NextResponse.json({ error: 'Email failed to send' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

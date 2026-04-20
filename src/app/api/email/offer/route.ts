import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getResend, FROM } from '@/lib/email/client'
import {
  offerAcceptedSubject,
  offerDeclinedSubject,
  offerActionHtml,
} from '@/lib/email/templates/offerAction'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/email/offer
 * Body: { inquiry_id: string, action: 'accepted' | 'declined' }
 *
 * Notifies the founder when a creative accepts or declines their offer.
 */
export async function POST(req: NextRequest) {
  const { inquiry_id, action } = await req.json()

  if (!inquiry_id || !action) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { data: inquiry } = await supabaseAdmin
    .from('inquiries')
    .select('id, project_description, founder_id, creative_id')
    .eq('id', inquiry_id)
    .single()

  if (!inquiry) {
    return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 })
  }

  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name')
    .in('id', [inquiry.founder_id, inquiry.creative_id])

  const founderProfile = profiles?.find((p) => p.id === inquiry.founder_id)
  const creativeProfile = profiles?.find((p) => p.id === inquiry.creative_id)

  const { data: founderAuth } = await supabaseAdmin.auth.admin.getUserById(inquiry.founder_id)
  const recipientEmail = founderAuth?.user?.email

  if (!recipientEmail) {
    return NextResponse.json({ error: 'Recipient email not found' }, { status: 404 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const ctaUrl = `${appUrl}/messages`
  const creativeName = creativeProfile?.full_name ?? 'The creative'
  const founderName = founderProfile?.full_name ?? 'there'

  const subject =
    action === 'accepted'
      ? offerAcceptedSubject(creativeName)
      : offerDeclinedSubject(creativeName)

  const html = offerActionHtml({
    founderName,
    creativeName,
    projectDescription: inquiry.project_description,
    action,
    ctaUrl,
  })

  const { error: emailError } = await getResend().emails.send({
    from: FROM,
    to: recipientEmail,
    subject,
    html,
  })

  if (emailError) {
    console.error('[email/offer]', emailError)
    return NextResponse.json({ error: 'Email failed to send' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

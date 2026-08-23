'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getResend, FROM } from '@/lib/email/client'
import {
  hireConfirmedFounderSubject,
  hireConfirmedCreativeSubject,
  hireFounderHtml,
  hireCreativeHtml,
} from '@/lib/email/templates/hireConfirmation'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY!
  )
}

/**
 * POST /api/email/hire
 * Body: { inquiry_id: string }
 *
 * Sends two emails:
 *  - Founder: creative's email address
 *  - Creative: hired notification + founder's email address
 */
export async function POST(req: NextRequest) {
  let inquiry_id: string
  try {
    const body = await req.json()
    inquiry_id = body.inquiry_id
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!inquiry_id) {
    return NextResponse.json({ error: 'Missing inquiry_id' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  const { data: inquiry, error: inquiryError } = await admin
    .from('inquiries')
    .select('id, project_description, founder_id, creative_id')
    .eq('id', inquiry_id)
    .single()

  if (inquiryError || !inquiry) {
    return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 })
  }

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, full_name')
    .in('id', [inquiry.founder_id, inquiry.creative_id])

  const founderProfile = profiles?.find((p) => p.id === inquiry.founder_id)
  const creativeProfile = profiles?.find((p) => p.id === inquiry.creative_id)

  const [{ data: founderAuth }, { data: creativeAuth }] = await Promise.all([
    admin.auth.admin.getUserById(inquiry.founder_id),
    admin.auth.admin.getUserById(inquiry.creative_id),
  ])

  const founderEmail = founderAuth?.user?.email
  const creativeEmail = creativeAuth?.user?.email

  if (!founderEmail || !creativeEmail) {
    return NextResponse.json({ error: 'Email address not found' }, { status: 404 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const founderName = founderProfile?.full_name ?? 'The founder'
  const creativeName = creativeProfile?.full_name ?? 'The creative'

  const [founderResult, creativeResult] = await Promise.allSettled([
    getResend().emails.send({
      from: FROM,
      to: founderEmail,
      subject: hireConfirmedFounderSubject(creativeName),
      html: hireFounderHtml({
        founderName,
        creativeName,
        creativeEmail,
        projectDescription: inquiry.project_description,
        ctaUrl: `${appUrl}/founder/messages`,
      }),
    }),
    getResend().emails.send({
      from: FROM,
      to: creativeEmail,
      subject: hireConfirmedCreativeSubject(founderName),
      html: hireCreativeHtml({
        creativeName,
        founderName,
        founderEmail,
        projectDescription: inquiry.project_description,
        ctaUrl: `${appUrl}/creator/messages`,
      }),
    }),
  ])

  const errors = [founderResult, creativeResult]
    .filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.error))
    .map((r) => (r.status === 'rejected' ? r.reason : (r as PromiseFulfilledResult<{ error: unknown }>).value.error))

  if (errors.length > 0) {
    console.error('[email/hire]', errors)
    return NextResponse.json({ error: 'One or more emails failed to send' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

'use server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getResend, FROM } from '@/lib/email/client'
import { newCreatorApplicationSubject, newCreatorApplicationHtml } from '@/lib/email/templates/newCreatorApplication'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY!
  )
}

/**
 * POST /api/email/creator-application
 * Body: { creative_id: string }
 *
 * Sends the admin a notification email when a creator completes onboarding
 * and enters the pending review queue.
 */
export async function POST(req: NextRequest) {
  const { creative_id } = await req.json()

  if (!creative_id) {
    return NextResponse.json({ error: 'Missing creative_id' }, { status: 400 })
  }

  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) {
    console.warn('[email/creator-application] ADMIN_EMAIL not set — skipping notification')
    return NextResponse.json({ ok: true })
  }

  const supabaseAdmin = getSupabaseAdmin()

  // Verify this creator actually exists and is pending
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, bio, review_status')
    .eq('id', creative_id)
    .eq('role', 'creative')
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
  }

  if (profile.review_status !== 'pending') {
    return NextResponse.json({ error: 'Creator is not in pending state' }, { status: 400 })
  }

  // Fetch creative profile for discipline + portfolio links
  const { data: creativeProfile } = await supabaseAdmin
    .from('creative_profiles')
    .select('discipline, portfolio_links')
    .eq('id', creative_id)
    .single()

  // Fetch email from auth.users
  const { data: authData } = await supabaseAdmin.auth.admin.getUserById(creative_id)
  const creatorEmail = authData?.user?.email ?? '(email unavailable)'

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  const { error: emailError } = await getResend().emails.send({
    from: FROM,
    to: adminEmail,
    subject: newCreatorApplicationSubject(profile.full_name ?? 'Unknown Creator'),
    html: newCreatorApplicationHtml({
      creatorName: profile.full_name ?? 'Unknown Creator',
      creatorEmail,
      bio: profile.bio,
      discipline: creativeProfile?.discipline ?? 'Not specified',
      portfolioLinks: (creativeProfile?.portfolio_links as Array<{ label: string; url: string }>) ?? [],
      adminUrl: `${appUrl}/dashboard/admin`,
    }),
  })

  if (emailError) {
    console.error('[email/creator-application]', emailError)
    return NextResponse.json({ error: 'Email failed to send' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

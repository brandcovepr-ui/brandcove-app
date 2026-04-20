import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getResend, FROM } from '@/lib/email/client'
import { reviewDecisionSubject, reviewDecisionHtml } from '@/lib/email/templates/reviewDecision'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * POST /api/admin/review
 * Body: { creative_id: string, status: 'approved' | 'rejected' }
 *
 * Updates the creative's review_status and sends them a decision email.
 * Requires the caller to be an admin (verified server-side via their session).
 */
export async function POST(req: NextRequest) {
  const { creative_id, status } = await req.json()

  if (!creative_id || !['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 })
  }

  // Verify the caller is an admin using the anon key + their cookie session
  const authHeader = req.headers.get('authorization') ?? ''
  const callerToken = authHeader.replace('Bearer ', '')
  if (!callerToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: { user: caller }, error: callerError } = await getSupabaseAdmin().auth.getUser(callerToken)
  if (callerError || !caller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: callerProfile } = await getSupabaseAdmin()
    .from('profiles')
    .select('role')
    .eq('id', caller.id)
    .single()

  if (callerProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Update review_status
  const { error: updateError } = await getSupabaseAdmin()
    .from('profiles')
    .update({ review_status: status })
    .eq('id', creative_id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }

  // Get creative's email + name
  const { data: creativeAuth } = await getSupabaseAdmin().auth.admin.getUserById(creative_id)
  const recipientEmail = creativeAuth?.user?.email

  const { data: creativeProfile } = await getSupabaseAdmin()
    .from('profiles')
    .select('full_name')
    .eq('id', creative_id)
    .single()

  if (recipientEmail) {
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/login`
    const creativeName = creativeProfile?.full_name?.split(' ')[0] ?? 'there'

    const { error: emailError } = await getResend().emails.send({
      from: FROM,
      to: recipientEmail,
      subject: reviewDecisionSubject(status),
      html: reviewDecisionHtml({ creativeName, status, loginUrl }),
    })

    if (emailError) {
      console.error('[api/admin/review] email failed:', emailError)
      // Still return success — the DB update went through
    }
  }

  return NextResponse.json({ ok: true })
}

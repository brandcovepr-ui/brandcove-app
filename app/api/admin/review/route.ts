import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getResend, FROM } from '@/lib/email/client'
import { reviewDecisionSubject, reviewDecisionHtml } from '@/lib/email/templates/reviewDecision'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  )
}

/**
 * POST /api/admin/review
 * Body: { creative_id: string, status: 'approved' | 'rejected', denial_reason?: string }
 *
 * Updates the creative's review_status and sends them a decision email.
 * Requires the caller to be an admin (verified server-side via their session).
 */
export async function POST(req: NextRequest) {
  try {
    const { creative_id, status, denial_reason } = await req.json()

    if (!creative_id || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 })
    }

    // Verify bearer token
    const authHeader = req.headers.get('authorization') ?? ''
    const callerToken = authHeader.replace('Bearer ', '')
    if (!callerToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Verify caller identity and authorization
    const { data: { user: caller }, error: callerError } = await supabaseAdmin.auth.getUser(callerToken)
    if (callerError || !caller) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (callerProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Prepare profile updates
    const reviewUpdate: Record<string, unknown> = { reviewed_at: new Date().toISOString() }
    if (status === 'rejected' && denial_reason?.trim()) {
      reviewUpdate.review_notes = denial_reason.trim()
    } else if (status === 'approved') {
      reviewUpdate.review_notes = null
    }

    // Execute database updates concurrently
    const [profileResult, creativeProfileResult] = await Promise.all([
      supabaseAdmin
        .from('profiles')
        .update({ review_status: status })
        .eq('id', creative_id),
      supabaseAdmin
        .from('creative_profiles')
        .update(reviewUpdate)
        .eq('id', creative_id),
    ])

    if (profileResult.error || creativeProfileResult.error) {
      console.error('[api/admin/review] Database update error:', profileResult.error || creativeProfileResult.error)
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
    }

    // Fetch recipient user and profile details in parallel
    const [creativeAuth, creativeProfile] = await Promise.all([
      supabaseAdmin.auth.admin.getUserById(creative_id),
      supabaseAdmin
        .from('profiles')
        .select('full_name')
        .eq('id', creative_id)
        .single(),
    ])

    const recipientEmail = creativeAuth?.data?.user?.email

    if (recipientEmail) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
      const loginUrl = `${appUrl}/login`
      const subscribeUrl = `${appUrl}/subscribe`
      const creativeName = creativeProfile?.data?.full_name?.split(' ')[0] ?? 'there'

      try {
        const { error: emailError } = await getResend().emails.send({
          from: FROM,
          to: recipientEmail,
          subject: reviewDecisionSubject(status),
          html: reviewDecisionHtml({
            creativeName,
            status,
            loginUrl,
            subscribeUrl,
            denialReason: status === 'rejected' && denial_reason?.trim() ? denial_reason.trim() : undefined,
          }),
        })

        if (emailError) {
          console.error('[api/admin/review] Email delivery failed:', emailError)
        }
      } catch (err) {
        console.error('[api/admin/review] Unexpected email dispatch error:', err)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/admin/review] Request processing error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
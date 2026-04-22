/**
 * POST /api/paystack/cancel
 *
 * Cancels the authenticated user's Paystack subscription and marks their
 * profile as inactive. If they have no subscription code on file (e.g. the
 * webhook hasn't fired yet), the DB is updated directly.
 *
 * Required env vars:
 *   PAYSTACK_SECRET_KEY
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { disableSubscription } from '@/lib/paystack/server'

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user }, error: authError } = await supabaseAdmin().auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get the user's subscription code
  const { data: profile, error: profileError } = await supabaseAdmin()
    .from('profiles')
    .select('paystack_subscription_code, subscription_status')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // Cancel on Paystack if we have a subscription code
  if (profile.paystack_subscription_code) {
    try {
      await disableSubscription(profile.paystack_subscription_code)
    } catch (err: any) {
      console.error('[paystack/cancel] paystack disable error:', err.message)
      // If Paystack already cancelled it or the code is invalid, proceed to update DB anyway
      // so the user's access is revoked on our side
    }
  }

  // Update profile in DB
  const { error: dbError } = await supabaseAdmin()
    .from('profiles')
    .update({ subscription_status: 'inactive' })
    .eq('id', user.id)

  if (dbError) {
    console.error('[paystack/cancel] db update error:', dbError)
    return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

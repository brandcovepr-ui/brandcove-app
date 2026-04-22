/**
 * POST /api/paystack/verify
 *
 * Called by the client immediately after the Paystack popup fires its success
 * callback. Verifies the reference with Paystack and writes the subscription
 * details to the user's profile.
 *
 * Required env vars:
 *   PAYSTACK_SECRET_KEY
 *   NEXT_PUBLIC_PAYSTACK_FOUNDER_PLAN_CODE
 *   NEXT_PUBLIC_PAYSTACK_CREATIVE_PLAN_CODE
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyTransaction, resolvePlanName } from '@/lib/paystack/server'

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  // Authenticate the caller
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user }, error: authError } = await supabaseAdmin().auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { reference } = await req.json()
  if (!reference) return NextResponse.json({ error: 'Missing reference' }, { status: 400 })

  let txn
  try {
    txn = await verifyTransaction(reference)
  } catch (err: any) {
    console.error('[paystack/verify] verification error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 502 })
  }

  if (txn.status !== 'success') {
    return NextResponse.json({ error: 'Payment not successful' }, { status: 400 })
  }

  const customerCode = txn.customer?.customer_code
  const planCode = txn.plan?.plan_code
  const subscriptionCode = txn.subscription?.subscription_code ?? null
  const planName = planCode ? resolvePlanName(planCode) : null

  // Paystack sometimes returns next_payment_date on the first charge, sometimes not.
  // Fall back to 31 days from now so subscription_expires_at is always populated.
  const nextPaymentDate = txn.subscription?.next_payment_date
    ?? new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString()

  const update: Record<string, unknown> = {
    subscription_status: 'active',
    subscription_expires_at: nextPaymentDate,
    paystack_customer_code: customerCode ?? null,
  }
  if (planName) update.subscription_plan = planName
  if (subscriptionCode) update.paystack_subscription_code = subscriptionCode

  const { error: dbError } = await supabaseAdmin()
    .from('profiles')
    .update(update)
    .eq('id', user.id)

  if (dbError) {
    console.error('[paystack/verify] db update error:', dbError)
    return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

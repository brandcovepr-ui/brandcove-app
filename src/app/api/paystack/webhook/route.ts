/**
 * POST /api/paystack/webhook
 *
 * Receives and handles Paystack webhook events. Verifies the
 * x-paystack-signature header before processing any event.
 *
 * Events handled:
 *   subscription.create      → save subscription_code, next_payment_date
 *   charge.success           → refresh subscription_status + next_payment_date
 *   subscription.disable     → mark subscription as inactive
 *   subscription.not_renew   → mark subscription as inactive
 *   invoice.payment_failed   → mark subscription as grace_period
 *
 * Required env vars:
 *   PAYSTACK_SECRET_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   NEXT_PUBLIC_PAYSTACK_FOUNDER_PLAN_CODE
 *   NEXT_PUBLIC_PAYSTACK_CREATIVE_PLAN_CODE
 *
 * Register this URL in your Paystack dashboard:
 *   Settings → API Keys & Webhooks → Webhook URL
 *   → https://yourdomain.com/api/paystack/webhook
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyWebhookSignature, resolvePlanName } from '@/lib/paystack/server'

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/** Look up a profile by paystack_customer_code first, then fall back to email. */
async function findProfileByCustomer(customerCode: string, email: string) {
  const db = supabaseAdmin()

  // Try customer code first (faster, already indexed)
  if (customerCode) {
    const { data } = await db
      .from('profiles')
      .select('id')
      .eq('paystack_customer_code', customerCode)
      .single()
    if (data) return data.id as string
  }

  // Fall back to email lookup via auth.users
  if (email) {
    const { data: users } = await db.auth.admin.listUsers()
    const match = users?.users?.find(u => u.email === email)
    if (match) return match.id as string
  }

  return null
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-paystack-signature') ?? ''

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.warn('[paystack/webhook] invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: { event: string; data: any }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { event: eventType, data } = event
  const db = supabaseAdmin()

  // ── subscription.create ────────────────────────────────────────────────
  if (eventType === 'subscription.create') {
    const customerCode = data.customer?.customer_code
    const email = data.customer?.email
    const subscriptionCode = data.subscription_code
    const nextPaymentDate = data.next_payment_date
    const planCode = data.plan?.plan_code
    const planName = planCode ? resolvePlanName(planCode) : null

    const userId = await findProfileByCustomer(customerCode, email)
    if (userId) {
      const update: Record<string, unknown> = {
        paystack_subscription_code: subscriptionCode,
        subscription_status: 'active',
      }
      if (nextPaymentDate) update.subscription_expires_at = nextPaymentDate
      if (planName) update.subscription_plan = planName
      if (customerCode) update.paystack_customer_code = customerCode

      await db.from('profiles').update(update).eq('id', userId)
    }
  }

  // ── charge.success ─────────────────────────────────────────────────────
  else if (eventType === 'charge.success') {
    // Only process subscription-related charges (plan is present)
    if (!data.plan && !data.subscription) {
      return NextResponse.json({ ok: true })
    }

    const customerCode = data.customer?.customer_code
    const email = data.customer?.email
    const nextPaymentDate = data.subscription?.next_payment_date ?? null
    const subscriptionCode = data.subscription?.subscription_code ?? null

    const userId = await findProfileByCustomer(customerCode, email)
    if (userId) {
      const update: Record<string, unknown> = { subscription_status: 'active' }
      if (nextPaymentDate) update.subscription_expires_at = nextPaymentDate
      if (subscriptionCode) update.paystack_subscription_code = subscriptionCode

      await db.from('profiles').update(update).eq('id', userId)
    }
  }

  // ── subscription.disable ───────────────────────────────────────────────
  else if (eventType === 'subscription.disable') {
    const customerCode = data.customer?.customer_code
    const email = data.customer?.email

    const userId = await findProfileByCustomer(customerCode, email)
    if (userId) {
      await db
        .from('profiles')
        .update({ subscription_status: 'inactive' })
        .eq('id', userId)
    }
  }

  // ── subscription.not_renew ─────────────────────────────────────────────
  else if (eventType === 'subscription.not_renew') {
    const customerCode = data.customer?.customer_code
    const email = data.customer?.email

    const userId = await findProfileByCustomer(customerCode, email)
    if (userId) {
      await db
        .from('profiles')
        .update({ subscription_status: 'inactive' })
        .eq('id', userId)
    }
  }

  // ── invoice.payment_failed ─────────────────────────────────────────────
  else if (eventType === 'invoice.payment_failed') {
    const customerCode = data.customer?.customer_code
    const email = data.customer?.email

    const userId = await findProfileByCustomer(customerCode, email)
    if (userId) {
      await db
        .from('profiles')
        .update({ subscription_status: 'grace_period' })
        .eq('id', userId)
    }
  }

  return NextResponse.json({ ok: true })
}

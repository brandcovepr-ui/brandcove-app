import { createHmac } from 'crypto'

const BASE = 'https://api.paystack.co'

function authHeader() {
  return { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY!}` }
}

/** Initialize a Paystack transaction and return the hosted checkout URL. */
export async function initializeTransaction(params: {
  email: string
  plan: string
  amount: number
  callback_url: string
}) {
  const res = await fetch(`${BASE}/transaction/initialize`, {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    cache: 'no-store',
  })
  const json = await res.json()
  if (!res.ok || !json.status) throw new Error(json.message ?? 'Failed to initialize transaction')
  return json.data as { authorization_url: string; access_code: string; reference: string }
}

/** Verify a transaction reference and return the data object. */
export async function verifyTransaction(reference: string) {
  const res = await fetch(`${BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: authHeader(),
    cache: 'no-store',
  })
  const json = await res.json()
  if (!res.ok || !json.status) throw new Error(json.message ?? 'Transaction verification failed')
  return json.data as {
    status: string
    reference: string
    customer: { email: string; customer_code: string }
    plan?: { plan_code: string; interval: string }
    subscription?: { subscription_code: string; next_payment_date: string }
  }
}

/** Fetch full subscription details (includes email_token needed for cancellation). */
export async function getSubscription(subscriptionCode: string) {
  const res = await fetch(`${BASE}/subscription/${encodeURIComponent(subscriptionCode)}`, {
    headers: authHeader(),
    cache: 'no-store',
  })
  const json = await res.json()
  if (!res.ok || !json.status) throw new Error(json.message ?? 'Failed to fetch subscription')
  return json.data as {
    subscription_code: string
    email_token: string
    status: string
    next_payment_date: string
  }
}

/**
 * Cancel a Paystack subscription.
 * Paystack requires both the subscription code AND the email_token.
 * The email_token is fetched server-side from the subscription object.
 */
export async function disableSubscription(subscriptionCode: string) {
  const sub = await getSubscription(subscriptionCode)
  const res = await fetch(`${BASE}/subscription/disable`, {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: sub.subscription_code, token: sub.email_token }),
  })
  const json = await res.json()
  if (!res.ok || !json.status) throw new Error(json.message ?? 'Failed to disable subscription')
  return json
}

/** Verify Paystack webhook signature (HMAC-SHA512 of raw body with secret key). */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const expected = createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
    .update(rawBody)
    .digest('hex')
  return expected === signature
}

/**
 * Map a Paystack plan code to our internal subscription_plan enum value.
 * Reads NEXT_PUBLIC_PAYSTACK_*_PLAN_CODE env vars — both are available server-side.
 */
export function resolvePlanName(planCode: string): 'founder_monthly' | 'creative_monthly' | null {
  if (planCode === process.env.NEXT_PUBLIC_PAYSTACK_FOUNDER_PLAN_CODE) return 'founder_monthly'
  if (planCode === process.env.NEXT_PUBLIC_PAYSTACK_CREATIVE_PLAN_CODE) return 'creative_monthly'
  return null
}

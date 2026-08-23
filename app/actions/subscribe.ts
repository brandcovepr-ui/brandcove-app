'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import { redirect } from 'next/navigation'

export async function initializeSubscription() {
  const supabase = await createSupabaseServerClient()

  // 1. Validate user session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Session expired. Please log in again.' }
  }

  // 2. Fetch profile to resolve role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return { error: 'Profile not found.' }
  }

  const isCreative = profile.role === 'creative'
  const planCode = isCreative
    ? process.env.PAYSTACK_CREATIVE_PLAN_CODE
    : process.env.PAYSTACK_FOUNDER_PLAN_CODE

  if (!planCode) {
    return { error: 'Subscription plan is not configured.' }
  }

  // 3. Initialize Paystack Transaction via Paystack API
  let authUrl = ''

  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        plan: planCode,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/paystack/callback`,
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.status) {
      return { error: data.message || 'Could not start payment. Please try again.' }
    }

    authUrl = data.data.authorization_url
  } catch {
    return { error: 'Network error. Please try again.' }
  }

  // 4. Redirect to Paystack Checkout
  redirect(authUrl)
}
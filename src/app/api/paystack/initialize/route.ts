import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { initializeTransaction } from '@/lib/paystack/server'

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

  const { plan: rawPlan } = await req.json()
  const plan = typeof rawPlan === 'string' ? rawPlan.trim() : rawPlan
  if (!plan) return NextResponse.json({ error: 'Missing plan' }, { status: 400 })

  const callback_url = `${process.env.NEXT_PUBLIC_APP_URL}/paystack/callback`

  try {
    const { authorization_url } = await initializeTransaction({
      email: user.email!,
      plan,
      callback_url,
    })
    return NextResponse.json({ authorization_url })
  } catch (err: any) {
    console.error('[paystack/initialize] error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 502 })
  }
}

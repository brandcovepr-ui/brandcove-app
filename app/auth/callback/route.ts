import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=Missing+auth+code`)
  }

  const supabase = await createSupabaseServerClient()

  // 1. Exchange OAuth / Magic Link auth code for a server session
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=Authentication+failed`)
  }

  // 2. Fetch active session user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/login`)
  }

  // 3. Retrieve user profile state to determine destination
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_complete, review_status, subscription_status')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.redirect(`${origin}/login`)
  }

  // Admin routing
  if (profile.role === 'admin') {
    return NextResponse.redirect(`${origin}/dashboard/admin`)
  }

  // Creative routing
  if (profile.role === 'creative') {
    if (!profile.onboarding_complete) {
      return NextResponse.redirect(`${origin}/creator`)
    }
    if (profile.review_status !== 'approved') {
      return NextResponse.redirect(`${origin}/pending`)
    }
    if (profile.subscription_status !== 'active') {
      return NextResponse.redirect(`${origin}/subscribe`)
    }
    return NextResponse.redirect(`${origin}/dashboard/creator/`)
  }

  // Founder routing
  if (!profile.onboarding_complete) {
    return NextResponse.redirect(`${origin}/founder`)
  }
  if (profile.subscription_status !== 'active') {
    return NextResponse.redirect(`${origin}/subscribe`)
  }

  return NextResponse.redirect(`${origin}/dashboard/founder/`)
}
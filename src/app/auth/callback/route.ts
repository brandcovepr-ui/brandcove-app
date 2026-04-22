import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, onboarding_complete, review_status, subscription_status')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'admin') {
        return NextResponse.redirect(`${origin}/admin`)
      }

      if (profile?.role === 'creative') {
        if (!profile.onboarding_complete) return NextResponse.redirect(`${origin}/creator`)
        if (profile.review_status !== 'approved') return NextResponse.redirect(`${origin}/creator/pending-review`)
        if (profile.subscription_status !== 'active') return NextResponse.redirect(`${origin}/subscribe`)
        return NextResponse.redirect(`${origin}/creator/dashboard`)
      }

      // Founder
      if (profile?.onboarding_complete) {
        if (profile.subscription_status !== 'active') return NextResponse.redirect(`${origin}/subscribe`)
        return NextResponse.redirect(`${origin}/founder/dashboard`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FounderLayoutShell } from './FounderLayoutShell'

export const dynamic = 'force-dynamic'

export default async function FounderLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()

  if (error || !data?.claims) {
    redirect('/login')
  }

  const userId = data.claims.sub as string

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_complete, subscription_status, subscription_expires_at')
    .eq('id', userId)
    .single()

  if (!profile) redirect('/login')
  if (profile.role !== 'founder') redirect('/creator/dashboard')
  if (!profile.onboarding_complete) redirect('/founder')

  const isExpired = profile.subscription_expires_at
    ? new Date(profile.subscription_expires_at) < new Date()
    : false
  if (profile.subscription_status !== 'active' || isExpired) redirect('/subscribe')

  return <FounderLayoutShell>{children}</FounderLayoutShell>
}

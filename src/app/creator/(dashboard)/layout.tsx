import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreatorLayoutShell } from './CreatorLayoutShell'

export const dynamic = 'force-dynamic'

export default async function CreatorDashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()

  if (error || !data?.claims) {
    redirect('/login')
  }

  const userId = data.claims.sub as string

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_complete, review_status, subscription_status, subscription_expires_at')
    .eq('id', userId)
    .single()

  if (!profile) redirect('/login')
  if (profile.role !== 'creative') redirect('/founder/dashboard')
  if (!profile.onboarding_complete) redirect('/creator')
  if (profile.review_status !== 'approved') redirect('/creator/pending-review')

  const isExpired = profile.subscription_expires_at
    ? new Date(profile.subscription_expires_at) < new Date()
    : false
  if (profile.subscription_status !== 'active' || isExpired) redirect('/subscribe')

  return <CreatorLayoutShell>{children}</CreatorLayoutShell>
}

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import { DashboardLayoutShell } from '@/app/components/layout/DashboardLayoutShell'
export default async function CreatorDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single()

  return (
    <DashboardLayoutShell profile={profile}>
      {children}
    </DashboardLayoutShell>
  )
}
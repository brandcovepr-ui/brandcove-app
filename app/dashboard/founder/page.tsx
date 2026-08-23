import { createSupabaseServerClient } from '@/lib/supabase/server-client'

import { redirect } from 'next/navigation'
import { getFounderDashboardData } from '@/app/actions/founder'
import { DashboardClient } from './DashboardClient'

export default async function Page() {

  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const firstName = profile?.full_name?.split(' ')[0] || 'there'
  const dashboardData = await getFounderDashboardData(user.id)

  return <DashboardClient firstName={firstName} data={dashboardData} />
}
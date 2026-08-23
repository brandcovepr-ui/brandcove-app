import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import AdminApplicationsList from './application-list'

const PAGE_SIZE = 10

export default async function AdminApplicationsPage() {
  const supabase = await createSupabaseServerClient()

  // 1. Authenticate session & admin role on the server
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  // 2. Fetch initial applications data on server
  const { data: applications, count } = await supabase
    .from('profiles')
    .select(`
      id, full_name, created_at, review_status, bio, avatar_url,
      creative_profiles(discipline, skills, years_experience, portfolio_url, portfolio_links, hourly_rate, location, availability, review_notes),
      work_samples!creative_id(id, url, title, file_type)
    `, { count: 'exact' })
    .eq('role', 'creative')
    .eq('review_status', 'pending')
    .order('created_at', { ascending: false })
    .range(0, PAGE_SIZE - 1)

  return (
    <AdminApplicationsList
      initialApplications={applications || []}
      initialTotal={count ?? 0}
      initialFilter="pending"
      initialPage={0}
    />
  )
}
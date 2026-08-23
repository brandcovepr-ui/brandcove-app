import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import { SettingsForm } from './SettingsForm'

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient()

  // 1. Parallel Server-side Auth & Profile Fetch
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [profileRes, founderRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('founder_profiles').select('company_name, industry, website_url').eq('id', user.id).maybeSingle(),
  ])

  const initialProfile = profileRes.data
  const initialFounderProfile = founderRes.data

  return (
    <div className="relative p-4 md:p-8">
      <h1 className="mb-6 font-editorial text-2xl font-regular text-gray-900 md:mb-8">
        Account Settings
      </h1>

      <SettingsForm
        userEmail={user.email || ''}
        initialProfile={initialProfile}
        initialFounderProfile={initialFounderProfile}
      />
    </div>
  )
}
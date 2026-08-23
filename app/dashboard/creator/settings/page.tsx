import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server' // Standard @supabase/ssr server client wrapper
import SettingsForm from './SettingsForm'

export default async function CreatorSettingsPage() {
  const supabase = await createClient()

  // 1. Fetch authenticated user session server-side
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  // 2. Fetch profile data in parallel on the server
  const [profileRes, creativeProfileRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, avatar_url, subscription_status, subscription_expires_at')
      .eq('id', user.id)
      .single(),
    supabase
      .from('creative_profiles')
      .select('location')
      .eq('id', user.id)
      .maybeSingle(),
  ])

  const initialProfile = {
    id: user.id,
    email: user.email ?? '',
    full_name: profileRes.data?.full_name ?? '',
    avatar_url: profileRes.data?.avatar_url ?? null,
    location: creativeProfileRes.data?.location ?? '',
    subscription_status: profileRes.data?.subscription_status ?? 'inactive',
    subscription_expires_at: profileRes.data?.subscription_expires_at ?? null,
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-editorial font-regular text-gray-900 mb-6 md:mb-8">
        Account Settings
      </h1>
      <SettingsForm initialProfile={initialProfile} />
    </div>
  )
}
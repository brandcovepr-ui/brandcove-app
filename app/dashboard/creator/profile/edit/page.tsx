import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import type { CreativeProfile, WorkSample, Profile } from '@/lib/types'
import CreatorProfileEditForm from './edit-form'

export default async function CreatorProfileEditPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [profileRes, creativeRes, samplesRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('creative_profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('work_samples').select('*').eq('creative_id', user.id).order('created_at', { ascending: false }),
  ])

  const initialProfile = profileRes.data as Profile | null
  const initialCreativeProfile = creativeRes.data as CreativeProfile | null
  const initialWorkSamples = (samplesRes.data || []) as WorkSample[]

  return (
    <CreatorProfileEditForm
      initialProfile={initialProfile}
      initialCreativeProfile={initialCreativeProfile}
      initialWorkSamples={initialWorkSamples}
    />
  )
}
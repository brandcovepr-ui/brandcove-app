'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type ProfileActionResult = {
  success?: boolean
  error?: string
}

export async function updateCreatorProfile(
  prevState: ProfileActionResult,
  formData: FormData
): Promise<ProfileActionResult> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized user session.' }
  }

  const fullName = formData.get('full_name') as string
  const bio = formData.get('bio') as string
  const discipline = formData.get('discipline') as string
  const hourlyRateRaw = formData.get('hourly_rate') as string
  const skillsRaw = formData.get('skills') as string

  const skills = skillsRaw ? JSON.parse(skillsRaw) : []
  const hourlyRate = hourlyRateRaw ? parseFloat(hourlyRateRaw) : null

  try {
    const [profileRes, creativeRes] = await Promise.all([
      supabase
        .from('profiles')
        .update({ full_name: fullName, bio })
        .eq('id', user.id),
      supabase
        .from('creative_profiles')
        .upsert({
          id: user.id,
          discipline,
          skills,
          hourly_rate: hourlyRate,
        }),
    ])

    if (profileRes.error) throw profileRes.error
    if (creativeRes.error) throw creativeRes.error

    revalidatePath('/dashboard/creator/profile')
    revalidatePath('/dashboard/creator/profile/edit')
  } catch (err: any) {
    return { error: err.message || 'Failed to update profile.' }
  }

  // Call redirect OUTSIDE the try/catch block
  redirect('/dashboard/creator/profile')
}

export async function uploadWorkSampleAction(formData: FormData): Promise<ProfileActionResult> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized.' }

  const file = formData.get('file') as File
  if (!file) return { error: 'No file provided.' }

  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  const fileType = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)
    ? 'image'
    : ext === 'pdf'
    ? 'pdf'
    : ['mp4', 'mov', 'avi', 'webm'].includes(ext)
    ? 'video'
    : 'other'

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${user.id}/${Date.now()}-${safeName}`

  const { data: storageData, error: storageError } = await supabase.storage
    .from('work-samples')
    .upload(path, file, { upsert: true, contentType: file.type || undefined })

  if (storageError || !storageData) {
    return { error: storageError?.message || 'Storage upload failed.' }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('work-samples')
    .getPublicUrl(storageData.path)

  const { error: insertError } = await supabase.from('work_samples').insert({
    creative_id: user.id,
    url: publicUrl,
    title: file.name,
    file_type: fileType,
  })

  if (insertError) {
    return { error: insertError.message }
  }

  revalidatePath('/dashboard/creator/profile')
  revalidatePath('/dashboard/creator/profile/edit')
  return { success: true }
}

export async function deleteWorkSampleAction(sampleId: string): Promise<ProfileActionResult> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized.' }

  const { error } = await supabase
    .from('work_samples')
    .delete()
    .eq('id', sampleId)
    .eq('creative_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/creator/profile')
  revalidatePath('/dashboard/creator/profile/edit')
  return { success: true }
}
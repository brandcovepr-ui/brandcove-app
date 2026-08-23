'server-only'
'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'

export interface OnboardPayload {
  role: 'creative' | 'founder'
  email: string
  fullName: string
  bio?: string
  // Creative payload
  discipline?: string
  skills?: string[]
  yearsExp?: number
  monthlyRate?: number
  location?: string
  availability?: string
  portfolioUrl?: string
  // Founder payload
  companyName?: string
  industry?: string[]
  websiteUrl?: string
  companyStage?: string
  companyDescription?: string
  creativeTypesWanted?: string[]
}

export async function onboardUserAction(payload: OnboardPayload) {
  const supabase = await createSupabaseServerClient()

  // 1. Verify authorization
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) throw new Error('Unauthorized')

  // Check admin role
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', currentUser.id)
    .single()

  if (adminProfile?.role !== 'admin') {
    throw new Error('Forbidden: Admin access required')
  }

  // 2. Generate initial credentials
  const tempPassword = `Temp-${Math.random().toString(36).slice(-8)}-${Math.floor(Math.random() * 899 + 100)}`

  // 3. Create Supabase Auth User via service role API or Signup action
  const { data: newUser, error: authError } = await supabase.auth.signUp({
    email: payload.email,
    password: tempPassword,
    options: {
      data: {
        full_name: payload.fullName,
        role: payload.role,
      },
    },
  })

  if (authError || !newUser.user) {
    throw new Error(authError?.message || 'Failed to create user account')
  }

  const userId = newUser.user.id

  // 4. Update Profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: payload.fullName,
      bio: payload.bio,
      role: payload.role,
    })
    .eq('id', userId)

  if (profileError) throw new Error(profileError.message)

  // 5. Insert role-specific profile records
  if (payload.role === 'creative') {
    const { error: creativeError } = await supabase
      .from('creative_profiles')
      .insert({
        id: userId,
        discipline: payload.discipline,
        skills: payload.skills || [],
        years_experience: payload.yearsExp,
        hourly_rate: payload.monthlyRate,
        location: payload.location,
        availability: payload.availability || 'available',
        portfolio_url: payload.portfolioUrl,
      })

    if (creativeError) throw new Error(creativeError.message)
  } else {
    const { error: founderError } = await supabase
      .from('founder_profiles')
      .insert({
        id: userId,
        company_name: payload.companyName,
        industry: payload.industry || [],
        website_url: payload.websiteUrl,
        company_stage: payload.companyStage,
        company_description: payload.companyDescription,
        creative_types_wanted: payload.creativeTypesWanted || [],
      })

    if (founderError) throw new Error(founderError.message)
  }

  revalidatePath('/dashboard/admin')

  return {
    success: true,
    userId,
    email: payload.email,
    password: tempPassword,
    name: payload.fullName,
    role: payload.role,
  }
}

export async function uploadWorkSamplesAction(
  userId: string,
  formData: FormData
) {
  const supabase = await createSupabaseServerClient()
  const files = formData.getAll('files') as File[]
  const titles = formData.getAll('titles') as string[]

  if (!files || files.length === 0) return { uploaded: [] }

  const uploadedSamples = []
  const failedFiles = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const title = titles[i] || file.name.replace(/\.[^.]+$/, '')
    const fileExt = file.name.split('.').pop()?.toLowerCase() ?? ''

    let fileType = 'other'
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) fileType = 'image'
    else if (fileExt === 'pdf') fileType = 'pdf'
    else if (['mp4', 'mov', 'avi', 'webm'].includes(fileExt)) fileType = 'video'

    const storagePath = `${userId}/${Date.now()}-${file.name}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('work-samples')
      .upload(storagePath, file, { upsert: true })

    if (uploadError) {
      failedFiles.push(file.name)
      continue
    }

    const { data: { publicUrl } } = supabase.storage
      .from('work-samples')
      .getPublicUrl(uploadData.path)

    uploadedSamples.push({
      creative_id: userId,
      title,
      url: publicUrl,
      file_type: fileType,
    })
  }

  if (uploadedSamples.length > 0) {
    const { error: samplesError } = await supabase
      .from('work_samples')
      .insert(uploadedSamples)

    if (samplesError) throw new Error(samplesError.message)
  }

  return { uploaded: uploadedSamples, failed: failedFiles }
}
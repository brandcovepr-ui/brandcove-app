'use server'


import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { notifyCreatorApplication } from '@/lib/email/notifications'

// Server-side validation schema
const onboardingSchema = z.object({
  discipline: z.string().min(1, 'Discipline is required'),
  skills: z.array(z.string()).min(1, 'Select at least one skill'),
  bio: z.string().min(30, 'Bio must be at least 30 characters'),
  yearsExperience: z.coerce.number().min(0),
  location: z.string().optional(),
  monthlyRate: z.coerce.number().nullable().optional(),
  availability: z.enum(['available', 'open_to_offers', 'busy']),
  portfolioLinks: z.array(
    z.object({
      label: z.string().min(1, 'Label required'),
      url: z.string().url('Invalid URL format'),
    })
  ),
})

export type ActionResponse = {
  error?: string
}



export async function submitCreativeOnboarding(
  prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const supabase = await createSupabaseServerClient()

  // 1. Authenticate user from server session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Authentication failed or session expired. Please log in again.' }
  }

  const userId = user.id

  // 2. Extract and parse JSON payload
  const payloadRaw = formData.get('payload') as string
  if (!payloadRaw) {
    return { error: 'Invalid form submission: missing payload.' }
  }

  let parsedPayload: z.infer<typeof onboardingSchema>
  try {
    const rawPayload = JSON.parse(payloadRaw)
    parsedPayload = onboardingSchema.parse(rawPayload)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { error: err.message }
    }
    return { error: 'Invalid form structure provided.' }
  }

  const {
    discipline,
    skills,
    bio,
    yearsExperience,
    location,
    monthlyRate,
    availability,
    portfolioLinks,
  } = parsedPayload

  // 3. Process Avatar File Upload
  let avatarPublicUrl: string | null = null
  const avatarFile = formData.get('avatar') as File | null

  if (avatarFile && avatarFile.size > 0) {
    const avatarExt = avatarFile.name.split('.').pop()?.toLowerCase() || 'jpeg'
    const avatarPath = `${userId}/avatar-${Date.now()}.${avatarExt}`

    const { data: avatarUpload, error: avatarErr } = await supabase.storage
      .from('avatars')
      .upload(avatarPath, avatarFile, {
        contentType: avatarFile.type || 'image/jpeg',
        upsert: true,
      })

    if (avatarErr) {
      return { error: `Avatar upload failed: ${avatarErr.message}` }
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(avatarUpload.path)

    avatarPublicUrl = urlData.publicUrl
  }

  // 4. Process Work Samples Uploads (Parallel Execution)
  const workSampleFiles = formData.getAll('workSamples') as File[]
  const uploadedSamples: Array<{
    url: string
    title: string
    file_type: 'image' | 'pdf' | 'video' | 'other'
  }> = []

  if (workSampleFiles.length > 0) {
    const sampleUploadPromises = workSampleFiles
      .filter((file) => file instanceof File && file.size > 0)
      .map(async (file) => {
        const ext = file.name.split('.').pop()?.toLowerCase() || ''
        const fileType: 'image' | 'pdf' | 'video' | 'other' =
          ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
            ? 'image'
            : ext === 'pdf'
            ? 'pdf'
            : ['mp4', 'mov', 'avi', 'webm'].includes(ext)
            ? 'video'
            : 'other'

        const samplePath = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

        const { data: sampleData, error: sampleErr } = await supabase.storage
          .from('work-samples')
          .upload(samplePath, file, {
            contentType: file.type,
            upsert: false,
          })

        if (sampleErr || !sampleData) {
          throw new Error(`Failed to upload "${file.name}": ${sampleErr?.message}`)
        }

        const { data: urlData } = supabase.storage
          .from('work-samples')
          .getPublicUrl(sampleData.path)

        return {
          url: urlData.publicUrl,
          title: file.name,
          file_type: fileType,
        }
      })

    const results = await Promise.allSettled(sampleUploadPromises)
    const failures = results.filter((r) => r.status === 'rejected')

    if (failures.length > 0) {
      return { error: 'Some work samples failed to upload. Please try submitting again.' }
    }

    results.forEach((r) => {
      if (r.status === 'fulfilled') {
        uploadedSamples.push(r.value)
      }
    })
  }

  // 5. Database Writes

  // A. Update Base Profile
  const profileUpdateData: Record<string, unknown> = {
    bio,
    onboarding_complete: true,
    review_status: 'pending',
  }
  if (avatarPublicUrl) {
    profileUpdateData.avatar_url = avatarPublicUrl
  }

  const { error: profileErr } = await supabase
    .from('profiles')
    .update(profileUpdateData)
    .eq('id', userId)

  if (profileErr) {
    return { error: `Profile update failed: ${profileErr.message}` }
  }

  // B. Upsert Creative Profile Attributes
  const { error: creativeErr } = await supabase
    .from('creative_profiles')
    .upsert({
      id: userId,
      discipline,
      skills,
      years_experience: yearsExperience,
      location: location || null,
      hourly_rate: monthlyRate,
      availability,
      portfolio_links: portfolioLinks,
    })

  if (creativeErr) {
    return { error: `Creative profile setup failed: ${creativeErr.message}` }
  }

  // C. Insert Work Samples Records
  if (uploadedSamples.length > 0) {
    const { error: samplesErr } = await supabase.from('work_samples').insert(
      uploadedSamples.map((sample) => ({
        creative_id: userId,
        url: sample.url,
        title: sample.title,
        file_type: sample.file_type,
      }))
    )

    if (samplesErr) {
      return { error: `Saving work samples failed: ${samplesErr.message}` }
    }
  }

  // 6. Admin Notification
  try {
    await notifyCreatorApplication(userId)
  } catch (emailErr) {
    console.error('[creator-onboarding] Admin notification failed:', emailErr)
    // Non-blocking: Allows user to proceed to /pending even if admin email dispatch fails
  }

  revalidatePath('/pending', 'page')
  redirect('/pending')
}
import { createClient } from '@/lib/supabase/server'

export type ActionState = {
  success?: boolean
  error?: string
  authorizationUrl?: string
}

export type FounderOnboardingPayload = {
  companyName: string
  industry: string
  websiteUrl?: string
  companyStage: string
  creativeTypesWanted: string[]
  avatarUrl?: string | null
}

export async function saveFounderOnboarding(
  prevState: ActionState,
  payload: FounderOnboardingPayload
): Promise<ActionState> {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Unauthorized session. Please log in again.' }
  }

  try {
    // 1. Upsert founder profile details
    const { error: founderError } = await supabase.from('founder_profiles').upsert({
      id: user.id,
      company_name: payload.companyName,
      industry: [payload.industry],
      website_url: payload.websiteUrl || null,
      creative_types_wanted: payload.creativeTypesWanted,
      company_stage: payload.companyStage,
    })

    if (founderError) throw founderError

    // 2. Update user profile status & avatar
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        onboarding_complete: true,
        ...(payload.avatarUrl ? { avatar_url: payload.avatarUrl } : {}),
      })
      .eq('id', user.id)

    if (profileError) throw profileError

    return { success: true }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Failed to save onboarding details.',
    }
  }
}

export async function initializeFounderPayment(
  prevState: ActionState
): Promise<ActionState> {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Unauthorized session.' }
  }

  try {
    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: 300000, // ₦3,000 in kobo
        plan: process.env.NEXT_PUBLIC_PAYSTACK_FOUNDER_PLAN_CODE,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      }),
    })

    const data = await res.json()

    if (!data.status) {
      return { error: data.message || 'Could not initialize payment.' }
    }

    return { authorizationUrl: data.data.authorization_url as string }
  } catch {
    return { error: 'Network error initializing payment gateway.' }
  }
}

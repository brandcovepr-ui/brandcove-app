'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import { getAuthErrorMessage } from '@/lib/utils'
import type { UserRole } from '@/lib/types'
import { headers } from 'next/headers'

const schema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})


const forgotPasswordSchema = z.object({
  email: z.email('Please enter a valid email address before we continue.'),
})

const signUpSchema = z.object({
  email: z.email('Enter a valid email'),
  fullName: z.string().min(2, 'Enter your full name'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})


const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Passwords do not match yet.',
    path: ['confirm'],
  })


const verifyOtpSchema = z.object({
  email: z.email('Invalid email address'),
  token: z.string().length(6, 'Verification code must be 6 digits'),
})



export type FormState = {
  success?: boolean
  error?: string
  email?: string
  resentCount?: number
}

export async function loginAction(prevState: FormState, formData: FormData): Promise<FormState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // 1. Server-side Validation
  const validation = schema.safeParse({ email, password })
  if (!validation.success) {
    return { error: validation.error.message }
  }

  // 2. Initialize Server-Only Supabase Client
  const supabase = await createSupabaseServerClient()

  // 3. Authenticate
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError) {
    return { error: getAuthErrorMessage(authError) }
  }
  console.log(authData)

  // 4. Fetch User Profile
  const userId = authData.user?.id
  if (!userId) {
    return { error: 'Authentication failed: missing user ID.' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    console.error('[loginAction] Profile fetch error:', profileError)
    return { error: `Could not load your account profile.` }
  }

  // 5. Determine Role-Based Destination
  let destination = '/dashboard/founder'

  if (profile.role === 'admin') {
    destination = '/dashboard/admin'
  } else if (profile.role === 'creative') {
    if (!profile.onboarding_complete) destination = '/onboarding/creator'
    else if (profile.review_status !== 'approved') destination = '/pending'
    else if (profile.subscription_status !== 'active') destination = '/subscribe'
    else destination = '/dashboard/creator'
  } else if (profile.role === 'founder') {
    if (!profile.onboarding_complete) destination = '/onboarding/founder'
    else if (profile.subscription_status !== 'active') destination = '/subscribe'
    else destination = '/dashboard/founder'
  }

  // 6. Issue Server-Side Redirect
  // NOTE: redirect() must be called outside try/catch blocks because it throws an internal Next.js error
  redirect(destination)
}


export type SignupFormState = {
  error?: string
} | null

export async function signUpAction(
  prevState: SignupFormState,
  formData: FormData
): Promise<SignupFormState> {
  const email = formData.get('email') as string
  const fullName = formData.get('fullName') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as UserRole

  // 1. Server-side Validation
  const validation = signUpSchema.safeParse({ email, fullName, password, role })
  if (!validation.success) {
    return { error: validation.error.message }
  }

  // 2. Initialize Server-Only Supabase Client
  const supabase = await createSupabaseServerClient()

  // 3. Register user with Supabase Auth
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
      },
    },
  })

  if (signUpError) {
    return { error: getAuthErrorMessage(signUpError) }
  }

  // 4. Determine Destination
  let destination = ''
  if (signUpData.session) {
    destination = role === 'creative' ? '/onboarding/creator' : '/onboarding/founder'
  } else {
    destination = `/verify-email?email=${encodeURIComponent(email)}&role=${role}`
  }

  // 5. Server-side Redirect
  redirect(destination)
}




export type VerifyOtpFormState = {
  error?: string
} | null

export async function verifyOtpAction(
  prevState: VerifyOtpFormState,
  formData: FormData
): Promise<VerifyOtpFormState> {
  const email = formData.get('email') as string
  const token = formData.get('token') as string

  // 1. Server-side Validation
  const validation = verifyOtpSchema.safeParse({ email, token })
  if (!validation.success) {
    return { error: validation.error.message }
  }

  // 2. Initialize Server-Only Supabase Client
  const supabase = await createSupabaseServerClient()

  // 3. Verify OTP code
  const { data, error: verifyError } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'signup',
  })

  if (verifyError) {
    return { error: getAuthErrorMessage(verifyError) }
  }

  if (!data.user) {
    redirect('/login')
  }

  // 4. Fetch User Profile for Role-Based Routing
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_complete, review_status, subscription_status')
    .eq('id', data.user.id)
    .single()

  let destination = '/founder'

  if (profile?.role === 'creative') {
    if (!profile.onboarding_complete) destination = '/onboarding/creator'
    else if (profile.review_status !== 'approved') destination = '/pending'
    else if (profile.subscription_status !== 'active') destination = '/subscribe'
    else destination = '/dashboard/creator'
  } else if (profile?.role === 'founder') {
    destination = profile.onboarding_complete ? '/dashboard/founder' : '/onboarding/founder'
  }

  // 5. Server-side Redirect
  redirect(destination)
}

export async function resendCodeAction(email: string): Promise<{ success: boolean; error?: string }> {
  if (!email) return { success: false, error: 'Email address is required.' }

  const supabase = await createSupabaseServerClient()
  const { error: resendError } = await supabase.auth.resend({
    type: 'signup',
    email,
  })

  if (resendError) {
    return { success: false, error: getAuthErrorMessage(resendError) }
  }

  return { success: true }
}




export type ResetPasswordFormState = {
  error?: string
  fieldErrors?: {
    password?: string
    confirm?: string
  }
  success?: boolean
} | null

export async function resetPasswordAction(
  prevState: ResetPasswordFormState,
  formData: FormData
): Promise<ResetPasswordFormState> {
  const password = formData.get('password') as string
  const confirm = formData.get('confirm') as string

  // 1. Server-side Validation
  const validation = resetPasswordSchema.safeParse({ password, confirm })
  if (!validation.success) {
    const formatted = validation.error.format()
    return {
      fieldErrors: {
        password: formatted.password?._errors[0],
        confirm: formatted.confirm?._errors[0],
      },
    }
  }

  // 2. Initialize Server-Only Supabase Client
  const supabase = await createSupabaseServerClient()

  // 3. Update User Password
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: getAuthErrorMessage(error) }
  }

  return { success: true }
}




export type ForgotPasswordFormState = {
  error?: string
  fieldErrors?: {
    email?: string
  }
  email?: string
  success?: boolean
} | null

export async function forgotPasswordAction(
  prevState: ForgotPasswordFormState,
  formData: FormData
): Promise<ForgotPasswordFormState> {
  const email = formData.get('email') as string

  // 1. Validate Email Input
  const validation = forgotPasswordSchema.safeParse({ email })
  if (!validation.success) {
    const formatted = validation.error.format()
    return {
      fieldErrors: {
        email: formatted.email?._errors[0],
      },
    }
  }

  // 2. Construct Dynamic Origin for Redirect URL
  const headersList = await headers()
  const host = headersList.get('host')
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
  const redirectTo = `${protocol}://${host}/reset-password`

  // 3. Initialize Server-Only Supabase Client
  const supabase = await createSupabaseServerClient()

  // 4. Request Password Reset Email
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })

  if (error) {
    return { error: getAuthErrorMessage(error) }
  }

  return { success: true, email }
}






export async function requestPasswordReset(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const email = (formData.get('email') as string) || ''

  const validation = forgotPasswordSchema.safeParse({ email })
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Invalid email address.',
      email,
      resentCount: prevState.resentCount || 0,
    }
  }

  const headerList = await headers()
  const origin = headerList.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || ''

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  })

  if (error) {
    return {
      success: false,
      error: error.message,
      email,
      resentCount: prevState.resentCount || 0,
    }
  }

  return {
    success: true,
    error: undefined,
    email,
    resentCount: (prevState.resentCount || 0) + 1,
  }
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient()

  // Clears session cookies on the server response
  await supabase.auth.signOut()

  // Purge layout cache and redirect to login
  revalidatePath('/', 'layout')
  redirect('/login')
}
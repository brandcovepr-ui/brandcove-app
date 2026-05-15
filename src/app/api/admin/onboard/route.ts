import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getResend, FROM } from '@/lib/email/client'
import { adminOnboardSubject, adminOnboardHtml } from '@/lib/email/templates/adminOnboard'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function generatePassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const special = '!@#$'
  const all = upper + lower + digits + special
  const pw = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
    ...Array.from({ length: 8 }, () => all[Math.floor(Math.random() * all.length)]),
  ]
  for (let i = pw.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pw[i], pw[j]] = [pw[j], pw[i]]
  }
  return pw.join('')
}

async function verifyAdmin(req: NextRequest) {
  const token = (req.headers.get('authorization') ?? '').replace('Bearer ', '')
  if (!token) return null
  const admin = getSupabaseAdmin()
  const { data: { user } } = await admin.auth.getUser(token)
  if (!user) return null
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

/**
 * POST /api/admin/onboard
 * Creates a verified Supabase auth user, inserts all profile rows, and emails credentials.
 */
export async function POST(req: NextRequest) {
  const caller = await verifyAdmin(req)
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const { role, email, full_name, bio,
    discipline, skills, years_experience, hourly_rate, location, availability, portfolio_links,
    company_name, industry, website_url, company_stage, company_description, creative_types_wanted,
  } = body as Record<string, any>

  if (!role || !email || !full_name) {
    return NextResponse.json({ error: 'role, email and full_name are required' }, { status: 400 })
  }

  const password = generatePassword()
  const admin = getSupabaseAdmin()

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role, full_name },
  })

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message ?? 'Failed to create user' }, { status: 500 })
  }

  const userId = authData.user.id

  await admin.from('profiles').upsert({
    id: userId,
    role,
    full_name,
    bio: bio || null,
    onboarding_complete: true,
    review_status: role === 'creative' ? 'approved' : null,
  })

  if (role === 'creative') {
    await admin.from('creative_profiles').upsert({
      id: userId,
      discipline: discipline || '',
      skills: skills || [],
      years_experience: years_experience ? Number(years_experience) : null,
      hourly_rate: hourly_rate ? Number(hourly_rate) : null,
      location: location || null,
      availability: availability || 'available',
      portfolio_links: portfolio_links || [],
      reviewed_at: new Date().toISOString(),
    })
  } else {
    await admin.from('founder_profiles').upsert({
      id: userId,
      company_name: company_name || '',
      industry: industry || [],
      website_url: website_url || null,
      company_stage: company_stage || null,
      company_description: company_description || null,
      creative_types_wanted: creative_types_wanted || [],
    })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const { error: emailError } = await getResend().emails.send({
    from: FROM,
    to: email as string,
    subject: adminOnboardSubject(),
    html: adminOnboardHtml({
      name: (full_name as string).split(' ')[0],
      email: email as string,
      password,
      role: role as 'creative' | 'founder',
      loginUrl: `${appUrl}/login`,
    }),
  })

  return NextResponse.json({
    ok: true,
    userId,
    password,
    emailSent: !emailError,
    emailError: emailError ? (emailError as any).message ?? 'Failed to send welcome email' : null,
  })
}

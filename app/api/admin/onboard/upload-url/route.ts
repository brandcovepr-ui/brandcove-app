import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY!
  )
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
 * POST /api/admin/onboard/upload-url
 * Returns a signed upload URL for a work-sample file using the service role,
 * so uploads are not blocked by storage RLS policies tied to the uploader's UID.
 * Body: { path: string }
 */
export async function POST(req: NextRequest) {
  const caller = await verifyAdmin(req)
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { path: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const { path } = body
  if (!path) return NextResponse.json({ error: 'path is required' }, { status: 400 })

  const { data, error } = await getSupabaseAdmin()
    .storage
    .from('work-samples')
    .createSignedUploadUrl(path)

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Failed to create signed URL' }, { status: 500 })
  }

  return NextResponse.json({ token: data.token, path: data.path })
}

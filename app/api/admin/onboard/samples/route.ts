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
 * POST /api/admin/onboard/samples
 * Inserts work_sample rows for a newly-created creative using the service role,
 * bypassing the RLS policy that restricts inserts to the creative's own session.
 * Body: { creative_id: string, samples: Array<{ url, title, file_type }> }
 */
export async function POST(req: NextRequest) {
  const caller = await verifyAdmin(req)
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { creative_id: string; samples: Array<{ url: string; title: string; file_type: string }> }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const { creative_id, samples } = body
  if (!creative_id || !Array.isArray(samples) || samples.length === 0) {
    return NextResponse.json({ error: 'Missing creative_id or samples' }, { status: 400 })
  }

  const { error } = await getSupabaseAdmin().from('work_samples').insert(
    samples.map(s => ({ creative_id, url: s.url, title: s.title, file_type: s.file_type }))
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

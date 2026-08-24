import 'server-only'

import { createClient } from '@supabase/supabase-js'

function required(name: 'NEXT_PUBLIC_SUPABASE_URL' | 'SUPABASE_SECRET_KEY') {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

/** A privileged client. Keep its use inside authenticated server-side code only. */
export function getSupabaseAdmin() {
  return createClient(
    required('NEXT_PUBLIC_SUPABASE_URL'),
    required('SUPABASE_SECRET_KEY'),
    { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } },
  )
}

export async function getUserFromBearer(authorization: string | null) {
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return null
  const { data, error } = await getSupabaseAdmin().auth.getUser(token)
  return error ? null : data.user
}

export async function isAdmin(userId: string) {
  const { data } = await getSupabaseAdmin()
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()
  return data?.role === 'admin'
}

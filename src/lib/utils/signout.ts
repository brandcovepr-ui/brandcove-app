import { supabase } from '@/lib/supabase/client'

export async function signOutUser(clearState: () => void): Promise<void> {
  clearState()
  await supabase.auth.signOut()
  window.location.href = '/login'
}

'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import { revalidatePath } from 'next/cache'

export async function toggleShortlist(creativeId: string, isShortlisted: boolean) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  if (isShortlisted) {
    await supabase
      .from('shortlists')
      .delete()
      .match({ founder_id: user.id, creative_id: creativeId })
  } else {
    await supabase
      .from('shortlists')
      .insert({ founder_id: user.id, creative_id: creativeId })
  }

  revalidatePath(`/browse/${creativeId}`)
  revalidatePath('/dashboard/founder/shortlist')
}
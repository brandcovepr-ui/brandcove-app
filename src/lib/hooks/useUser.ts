'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/stores/useAppStore'
import { Profile } from '@/lib/types'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

export function useUser() {
  const { profile, setProfile } = useAppStore()
  const [loading, setLoading] = useState(!profile)

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      try {
        // getSession() reads from localStorage — no network call.
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          if (!cancelled) setLoading(false)
          return
        }
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        if (!cancelled) {
          if (data) setProfile(data as unknown as Profile)
          setLoading(false)
        }
      } catch {
        if (!cancelled) setLoading(false)
      }
    }

    if (!profile) {
      loadProfile()
    } else {
      setLoading(false)
    }

    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_OUT') {
          setProfile(null)
        } else if (event === 'SIGNED_IN' && session?.user) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          if (data) setProfile(data as unknown as Profile)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [setProfile])

  return { profile, loading }
}

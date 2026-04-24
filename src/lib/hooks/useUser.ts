'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/stores/useAppStore'
import { Profile } from '@/lib/types'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

// Module-level flag so concurrent hook instances don't all race to load
let loadingProfile = false

export function useUser() {
  const { profile, setProfile } = useAppStore()
  const [loading, setLoading] = useState(!profile)
  const mounted = useRef(true)

  // Load profile once on mount — uses getUser() (hits Supabase server) so
  // stale/forged cookies are never treated as valid sessions.
  useEffect(() => {
    mounted.current = true

    async function loadProfile() {
      if (loadingProfile) return
      loadingProfile = true
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { if (mounted.current) setLoading(false); return }
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (data && mounted.current) setProfile(data as Profile)
      } finally {
        loadingProfile = false
        if (mounted.current) setLoading(false)
      }
    }

    if (!profile) {
      loadProfile()
    } else {
      setLoading(false)
    }

    return () => { mounted.current = false }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auth state changes in a separate stable effect
  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_OUT') {
        setProfile(null)
      } else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        // TOKEN_REFRESHED fires when the singleton auto-refresh timer exchanges
        // the refresh token for a new access token. Re-fetch the profile so the
        // store always reflects the current session, even if the initial load
        // raced with the first refresh on a cold page visit.
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        if (data) setProfile(data as Profile)
      }
    })
    return () => subscription.unsubscribe()
  }, [setProfile])

  return { profile, loading }
}

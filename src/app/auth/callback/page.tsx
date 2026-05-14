'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event !== 'SIGNED_IN' || !session?.user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, onboarding_complete, review_status, subscription_status')
        .eq('id', session.user.id)
        .single()

      if (profile?.role === 'admin') {
        router.replace('/admin')
        return
      }

      if (profile?.role === 'creative') {
        if (!profile.onboarding_complete) { router.replace('/creator'); return }
        if (profile.review_status !== 'approved') { router.replace('/creator/pending-review'); return }
        if (profile.subscription_status !== 'active') { router.replace('/subscribe'); return }
        router.replace('/creator/dashboard')
        return
      }

      // Founder
      if (!profile?.onboarding_complete) { router.replace('/founder'); return }
      if (profile.subscription_status !== 'active') { router.replace('/subscribe'); return }
      router.replace('/founder/dashboard')
    })

    return () => subscription.unsubscribe()
  }, [router])

  return (
    <div className="auth-bg h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
    </div>
  )
}

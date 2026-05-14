'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/hooks/useUser'
import { FounderLayoutShell } from './FounderLayoutShell'

export default function FounderLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!profile) { router.replace('/login'); return }
    if (profile.role !== 'founder') { router.replace('/creator/dashboard'); return }
    if (!profile.onboarding_complete) { router.replace('/founder'); return }
    const isExpired = profile.subscription_expires_at
      ? new Date(profile.subscription_expires_at) < new Date()
      : false
    if (profile.subscription_status !== 'active' || isExpired) { router.replace('/subscribe'); return }
  }, [profile, loading, router])

  if (loading || !profile) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    )
  }

  const isExpired = profile.subscription_expires_at
    ? new Date(profile.subscription_expires_at) < new Date()
    : false

  if (
    profile.role !== 'founder' ||
    !profile.onboarding_complete ||
    profile.subscription_status !== 'active' ||
    isExpired
  ) {
    return null
  }

  return <FounderLayoutShell>{children}</FounderLayoutShell>
}

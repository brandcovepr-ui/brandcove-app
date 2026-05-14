'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/hooks/useUser'
import { CreatorLayoutShell } from './CreatorLayoutShell'

export default function CreatorDashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!profile) { router.replace('/login'); return }
    if (profile.role !== 'creative') { router.replace('/founder/dashboard'); return }
    if (!profile.onboarding_complete) { router.replace('/creator'); return }
    if (profile.review_status !== 'approved') { router.replace('/creator/pending-review'); return }
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
    profile.role !== 'creative' ||
    !profile.onboarding_complete ||
    profile.review_status !== 'approved' ||
    profile.subscription_status !== 'active' ||
    isExpired
  ) {
    return null
  }

  return <CreatorLayoutShell>{children}</CreatorLayoutShell>
}

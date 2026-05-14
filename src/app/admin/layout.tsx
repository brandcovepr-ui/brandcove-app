'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/hooks/useUser'
import { AdminLayoutShell } from './AdminLayoutShell'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!profile || profile.role !== 'admin') {
      router.replace('/login')
    }
  }, [profile, loading, router])

  if (loading || !profile) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    )
  }

  if (profile.role !== 'admin') return null

  return <AdminLayoutShell>{children}</AdminLayoutShell>
}

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/useUser'
import { useAppStore } from '@/lib/stores/useAppStore'
import { format } from 'date-fns'

type Tab = 'profile' | 'subscription' | 'password'

const profileSchema = z.object({
  full_name: z.string().min(1, 'Name is required'),
  location: z.string().optional(),
})

const passwordSchema = z.object({
  password: z.string().min(8, 'Minimum 8 characters'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] })

type ProfileData = z.infer<typeof profileSchema>
type PasswordData = z.infer<typeof passwordSchema>

export default function CreatorSettingsPage() {
  const [tab, setTab] = useState<Tab>('profile')
  const { profile } = useUser()
  const setProfile = useAppStore(s => s.setProfile)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [savedProfile, setSavedProfile] = useState(false)
  const [savedPassword, setSavedPassword] = useState(false)

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      location: '',
    },
  })

  const passwordForm = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
  })

  async function onSaveProfile(data: ProfileData) {
    if (!profile) return
    const supabase = createClient()

    const { data: updated } = await supabase
      .from('profiles')
      .update({ full_name: data.full_name })
      .eq('id', profile.id)
      .select()
      .single()

    if (updated) setProfile(updated as any)

    if (data.location !== undefined) {
      await supabase
        .from('creative_profiles')
        .update({ location: data.location || null })
        .eq('id', profile.id)
    }

    setSavedProfile(true)
    setTimeout(() => setSavedProfile(false), 2000)
  }

  async function onSavePassword(data: PasswordData) {
    const supabase = createClient()
    await supabase.auth.updateUser({ password: data.password })
    passwordForm.reset()
    setSavedPassword(true)
    setTimeout(() => setSavedPassword(false), 2000)
  }

  async function cancelSubscription() {
    if (!profile) return
    const supabase = createClient()
    await supabase.from('profiles').update({ subscription_status: 'inactive' }).eq('id', profile.id)
    setCancelOpen(false)
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile', label: 'Edit Profile' },
    { id: 'subscription', label: 'Subscription' },
    { id: 'password', label: 'Change Password' },
  ]

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h1>

      <div className="flex border-b border-gray-200 mb-6 gap-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-[#6b1d2b] text-[#6b1d2b]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-[#6b1d2b] flex items-center justify-center text-white text-2xl font-bold">
              {profile?.full_name?.[0]?.toUpperCase() || 'C'}
            </div>
            <button type="button" className="text-xs text-[#6b1d2b] font-medium hover:underline">
              Change Photo
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
              <input
                {...profileForm.register('full_name')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              {profileForm.formState.errors.full_name && (
                <p className="text-xs text-red-500 mt-1">{profileForm.formState.errors.full_name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input
                disabled
                value="—"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-400"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
              <input
                {...profileForm.register('location')}
                placeholder="e.g. Lagos, Nigeria"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>

          <button
            type="submit"
            className="bg-[#6b1d2b] text-white rounded-full px-6 py-2.5 text-sm font-medium hover:bg-[#4e1520] transition-colors"
          >
            {savedProfile ? '✓ Saved!' : 'Save Changes'}
          </button>
        </form>
      )}

      {tab === 'subscription' && (
        <div className="space-y-6">
          <div className="border border-gray-200 rounded-xl p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Current Plan</p>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-base font-bold text-gray-900">Creative Plan</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">₦3,000 <span className="text-sm font-normal text-gray-400">/month</span></p>
              </div>
              {profile?.subscription_expires_at && (
                <div className="text-right">
                  <p className="text-xs text-gray-400">Next billing</p>
                  <p className="text-sm font-medium text-gray-700">
                    {format(new Date(profile.subscription_expires_at), 'MMM d, yyyy')}
                  </p>
                </div>
              )}
            </div>
            <div className="mt-3">
              <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${
                profile?.subscription_status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {profile?.subscription_status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>
            {profile?.subscription_status === 'active' && (
              <button
                onClick={() => setCancelOpen(true)}
                className="mt-4 text-xs text-red-500 hover:text-red-700 font-medium"
              >
                Cancel subscription
              </button>
            )}
          </div>

          <div className="border border-gray-200 rounded-xl p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Payment Method</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-5 bg-gray-900 rounded flex items-center justify-center text-white text-[8px] font-bold">VISA</div>
                <p className="text-sm text-gray-700">Visa ending in 8483</p>
              </div>
              <button className="text-xs text-[#6b1d2b] hover:underline font-medium">Update method</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'password' && (
        <form onSubmit={passwordForm.handleSubmit(onSavePassword)} className="space-y-4 max-w-sm">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
            <input
              {...passwordForm.register('password')}
              type="password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            {passwordForm.formState.errors.password && (
              <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.password.message}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              {...passwordForm.register('confirm')}
              type="password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            {passwordForm.formState.errors.confirm && (
              <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.confirm.message}</p>
            )}
          </div>
          <button
            type="submit"
            className="bg-gray-900 text-white rounded-full px-6 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            {savedPassword ? '✓ Password updated!' : 'Update Password'}
          </button>
        </form>
      )}

      {cancelOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-2">Cancel Subscription?</h2>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to cancel? You&apos;ll lose access to the platform at the end of your billing period.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelOpen(false)}
                className="flex-1 border border-gray-200 rounded-full py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Keep Plan
              </button>
              <button
                onClick={cancelSubscription}
                className="flex-1 bg-red-500 text-white rounded-full py-2.5 text-sm font-medium hover:bg-red-600 transition-colors"
              >
                Cancel Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

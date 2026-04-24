'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/useUser'
import { useAppStore } from '@/lib/stores/useAppStore'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle } from 'lucide-react'
import { format } from 'date-fns'

type Tab = 'profile' | 'subscription' | 'password'

const profileSchema = z.object({
  full_name: z.string().min(1, 'Name is required'),
  company_name: z.string().optional(),
  industry: z.string().optional(),
  website_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
})

const passwordSchema = z.object({
  password: z.string().min(8, 'Minimum 8 characters'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] })

type ProfileData = z.infer<typeof profileSchema>
type PasswordData = z.infer<typeof passwordSchema>

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('profile')
  const { profile } = useUser()
  const setProfile = useAppStore(s => s.setProfile)
  const queryClient = useQueryClient()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  // Fetch auth email client-side
  useEffect(() => {
    createClient().auth.getUser().then(({ data }: { data: { user: { email?: string } | null } }) => {
      if (data?.user?.email) setUserEmail(data.user.email)
    })
  }, [])

  // Fetch founder_profile for pre-populating company fields
  const { data: founderProfile } = useQuery({
    queryKey: ['founder-profile-settings', profile?.id],
    staleTime: Infinity,
    queryFn: async () => {
      if (!profile?.id) return null
      const { data } = await createClient()
        .from('founder_profiles')
        .select('company_name, industry, website_url')
        .eq('id', profile.id)
        .single()
      return data
    },
    enabled: !!profile?.id,
  })

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: '', company_name: '', industry: '', website_url: '' },
  })

  const passwordForm = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
  })

  // Reset form when data arrives
  useEffect(() => {
    if (!profile) return
    profileForm.reset({
      full_name: profile.full_name || '',
      company_name: founderProfile?.company_name || '',
      industry: founderProfile?.industry || '',
      website_url: founderProfile?.website_url || '',
    })
  }, [profile, founderProfile])

  function showSaved() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function onSaveProfile(data: ProfileData) {
    if (!profile) return
    const supabase = createClient()

    const [profileUpdate, founderUpdate] = await Promise.all([
      supabase.from('profiles').update({ full_name: data.full_name }).eq('id', profile.id).select().single(),
      supabase.from('founder_profiles').upsert({
        id: profile.id,
        company_name: data.company_name || null,
        industry: data.industry || null,
        website_url: data.website_url || null,
      }),
    ])

    if (profileUpdate.data) setProfile(profileUpdate.data as any)
    queryClient.invalidateQueries({ queryKey: ['founder-profile-settings', profile.id] })
    showSaved()
  }

  async function onSavePassword(data: PasswordData) {
    await createClient().auth.updateUser({ password: data.password })
    passwordForm.reset()
    showSaved()
  }

  async function cancelSubscription() {
    if (!profile) return
    const supabase = createClient()
    // getUser() validates with the auth server and triggers a token refresh if
    // the access token is expired, so the session we read next is always fresh.
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    await fetch('/api/paystack/cancel', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })

    setProfile({ ...profile, subscription_status: 'inactive' } as any)
    setCancelOpen(false)
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile', label: 'Edit Profile' },
    { id: 'subscription', label: 'Subscription' },
    { id: 'password', label: 'Change Password' },
  ]

  return (
    <div className="p-8 relative">
      {/* Page heading */}
      <h1 className="text-2xl font-editorial  font-regular text-gray-900 mb-8">Account Settings</h1>

      {/* Saved toast */}
      {saved && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-white border border-green-200 text-green-700 text-sm font-medium px-4 py-2.5 rounded-full shadow-md">
          <CheckCircle size={15} />
          Changes saved
        </div>
      )}

      <div className="flex gap-6 items-start">
        {/* Sidebar tabs */}
        <div className="w-52 shrink-0 bg-white rounded-xl border border-gray-100 overflow-hidden">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full text-left px-4 py-3 text-sm transition-colors border-b border-gray-50 last:border-0 ${
                tab === t.id
                  ? 'bg-gray-100 font-medium text-gray-900'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content card */}
        <div className="flex-1 bg-white rounded-xl border border-gray-100 p-6 max-w-xl">

          {tab === 'profile' && (
            <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-5">
              {/* Avatar */}
              <div className="flex items-center gap-4 mb-2">
                <div className="w-16 h-16 rounded-full bg-[#6b1d2b] flex items-center justify-center text-white text-2xl font-bold shrink-0 overflow-hidden">
                  {profile?.avatar_url
                    ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    : profile?.full_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <button type="button" className="text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors">
                  Change Photo
                </button>
              </div>

              {/* Full Name + Email */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    {...profileForm.register('full_name')}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                  {profileForm.formState.errors.full_name && (
                    <p className="text-xs text-red-500 mt-1">{profileForm.formState.errors.full_name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <input
                    disabled
                    value={userEmail}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Company Name + Industry */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Company Name</label>
                  <input
                    {...profileForm.register('company_name')}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Industry</label>
                  <input
                    {...profileForm.register('industry')}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>

              {/* Company Website (full width) */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Company Website</label>
                <input
                  {...profileForm.register('website_url')}
                  placeholder="https://yourwebsite.com"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                {profileForm.formState.errors.website_url && (
                  <p className="text-xs text-red-500 mt-1">{profileForm.formState.errors.website_url.message}</p>
                )}
              </div>

              <button
                type="submit"
                className="bg-[#6b1d2b] text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-[#4e1520] transition-colors"
              >
                Save changes
              </button>
            </form>
          )}

          {tab === 'subscription' && (
            <div className="space-y-5">
              <div className="border border-gray-200 rounded-xl p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Current Plan</p>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-base font-bold text-gray-900">Founder Plan</p>
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
                <button
                  onClick={() => setCancelOpen(true)}
                  className="mt-4 text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Cancel subscription
                </button>
              </div>

              <div className="border border-gray-200 rounded-xl p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Payment Method</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-5 bg-gray-900 rounded flex items-center justify-center text-white text-[8px] font-bold">VISA</div>
                    <p className="text-sm text-gray-700">Payment integration coming soon</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'password' && (
            <form onSubmit={passwordForm.handleSubmit(onSavePassword)} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
                <input
                  {...passwordForm.register('password')}
                  type="password"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
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
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                {passwordForm.formState.errors.confirm && (
                  <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.confirm.message}</p>
                )}
              </div>
              <button
                type="submit"
                className="bg-[#6b1d2b] text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-[#4e1520] transition-colors"
              >
                Update Password
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Cancel subscription modal */}
      {cancelOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-2">Cancel Subscription?</h2>
            <p className="text-sm text-gray-500 mb-6">
              You&apos;ll lose access to the marketplace at the end of your current billing period. You won&apos;t be charged again.
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

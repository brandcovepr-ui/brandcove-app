'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import { Camera, CheckCircle, UserCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { AvatarCropModal } from '@/app/components/ui/AvatarCropModal'
type Tab = 'profile' | 'subscription' | 'password'

const profileSchema = z.object({
  full_name: z.string().min(1, 'Name is required'),
  company_name: z.string().optional(),
  industry: z.string().optional(),
  website_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
})

const passwordSchema = z
  .object({
    password: z.string().min(8, 'Minimum 8 characters'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  })

type ProfileData = z.infer<typeof profileSchema>
type PasswordData = z.infer<typeof passwordSchema>

interface SettingsFormProps {
  userEmail: string
  initialProfile: any
  initialFounderProfile: any
}

export function SettingsForm({
  userEmail,
  initialProfile,
  initialFounderProfile,
}: SettingsFormProps) {
  const supabase = getSupabaseBrowserClient()

  const [tab, setTab] = useState<Tab>('profile')
  const [cancelOpen, setCancelOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const [profile, setProfileState] = useState(initialProfile)

  // Avatar State
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      company_name: initialFounderProfile?.company_name || '',
      industry: Array.isArray(initialFounderProfile?.industry)
        ? initialFounderProfile.industry[0]
        : initialFounderProfile?.industry || '',
      website_url: initialFounderProfile?.website_url || '',
    },
  })

  const passwordForm = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
  })

  function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCropSrc(reader.result as string)
    reader.readAsDataURL(file)
    if (avatarInputRef.current) avatarInputRef.current.value = ''
  }

  function handleCropDone(blob: Blob) {
    setAvatarBlob(blob)
    setAvatarPreview(URL.createObjectURL(blob))
    setCropSrc(null)
  }

  async function uploadAvatar(): Promise<string | null> {
    if (!avatarBlob || !profile?.id) return null
    const path = `${profile.id}/avatar.jpg`
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(path, avatarBlob, { upsert: true, contentType: 'image/jpeg' })

    if (error || !data) return null
    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(data.path)
    return `${publicUrl}?t=${Date.now()}`
  }

  function showSaved() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function onSaveProfile(data: ProfileData) {
    if (!profile?.id) return

    const avatarUrl = await uploadAvatar()

    await Promise.all([
      supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        })
        .eq('id', profile.id),

      supabase.from('founder_profiles').upsert({
        id: profile.id,
        company_name: data.company_name || '',
        industry: data.industry ? [data.industry] : null,
        website_url: data.website_url || null,
      } as any),
    ])

    const { data: fresh } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profile.id)
      .single()

    if (fresh) {
      setProfileState(fresh)
    }
    if (avatarUrl) setAvatarBlob(null)
    showSaved()
  }

  async function onSavePassword(data: PasswordData) {
    await supabase.auth.updateUser({ password: data.password })
    passwordForm.reset()
    showSaved()
  }

  async function cancelSubscription() {
    if (!profile) return
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const token = session?.access_token ?? null
    if (!token) return

    await fetch('/api/paystack/cancel', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })

    const updated = { ...profile, subscription_status: 'inactive' }
    setProfileState(updated)
    setCancelOpen(false)
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile', label: 'Edit Profile' },
    { id: 'subscription', label: 'Subscription' },
    { id: 'password', label: 'Change Password' },
  ]

  return (
    <>
      {cropSrc && (
        <AvatarCropModal
          imageSrc={cropSrc}
          onDone={handleCropDone}
          onCancel={() => setCropSrc(null)}
        />
      )}

      {/* Saved Toast */}
      {saved && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-full border border-green-200 bg-white px-4 py-2.5 text-sm font-medium text-green-700 shadow-md">
          <CheckCircle size={15} />
          Changes saved
        </div>
      )}

      <div className="flex flex-col items-start gap-4 md:flex-row md:gap-6">
        {/* Sidebar tabs */}
        <div className="flex w-full shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-white md:w-52 md:flex-col">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 border-r border-gray-50 px-3 py-3 text-center text-sm transition-colors last:border-0 md:flex-none md:border-r-0 md:border-b md:px-4 md:text-left ${
                tab === t.id
                  ? 'bg-gray-100 font-medium text-gray-900'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Form Container */}
        <div className="w-full max-w-xl flex-1 rounded-xl border border-gray-100 bg-white p-5 md:p-6">
          {tab === 'profile' && (
            <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-5">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarFileChange}
                className="hidden"
              />
              <div className="mb-2 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#6b1d2b] font-bold text-white text-2xl focus:outline-none"
                >
                  {avatarPreview || profile?.avatar_url ? (
                    <>
                      <img
                        src={avatarPreview ?? profile!.avatar_url!}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                        <Camera size={16} className="text-white" />
                      </div>
                    </>
                  ) : (
                    <>
                      <UserCircle2 size={28} className="text-white/70 group-hover:hidden" />
                      <Camera size={20} className="hidden text-white group-hover:block" />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-800"
                >
                  {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Full Name</label>
                  <input
                    {...profileForm.register('full_name')}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                  {profileForm.formState.errors.full_name && (
                    <p className="mt-1 text-xs text-red-500">
                      {profileForm.formState.errors.full_name.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Email</label>
                  <input
                    disabled
                    value={userEmail}
                    className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Company Name
                  </label>
                  <input
                    {...profileForm.register('company_name')}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Industry</label>
                  <input
                    {...profileForm.register('industry')}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Company Website
                </label>
                <input
                  {...profileForm.register('website_url')}
                  placeholder="https://yourwebsite.com"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                {profileForm.formState.errors.website_url && (
                  <p className="mt-1 text-xs text-red-500">
                    {profileForm.formState.errors.website_url.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="rounded-lg bg-[#6b1d2b] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4e1520]"
              >
                Save changes
              </button>
            </form>
          )}

          {tab === 'subscription' && (
            <div className="space-y-5">
              <div className="rounded-xl border border-gray-200 p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Current Plan
                </p>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-base font-bold text-gray-900">Founder Plan</p>
                    <p className="mt-1 font-bold text-2xl text-gray-900">
                      ₦3,000 <span className="text-sm font-normal text-gray-400">/month</span>
                    </p>
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
                  className="mt-4 text-xs font-medium text-red-500 hover:text-red-700"
                >
                  Cancel subscription
                </button>
              </div>
            </div>
          )}

          {tab === 'password' && (
            <form onSubmit={passwordForm.handleSubmit(onSavePassword)} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  New Password
                </label>
                <input
                  {...passwordForm.register('password')}
                  type="password"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                {passwordForm.formState.errors.password && (
                  <p className="mt-1 text-xs text-red-500">
                    {passwordForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  {...passwordForm.register('confirm')}
                  type="password"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                {passwordForm.formState.errors.confirm && (
                  <p className="mt-1 text-xs text-red-500">
                    {passwordForm.formState.errors.confirm.message}
                  </p>
                )}
              </div>
              <button
                type="submit"
                className="rounded-lg bg-[#6b1d2b] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4e1520]"
              >
                Update Password
              </button>
            </form>
          )}
        </div>
      </div>

      {cancelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-2 text-base font-semibold text-gray-900">Cancel Subscription?</h2>
            <p className="mb-6 text-sm text-gray-500">
              You&apos;ll lose access to the marketplace at the end of your current billing period.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelOpen(false)}
                className="flex-1 rounded-full border border-gray-200 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50"
              >
                Keep Plan
              </button>
              <button
                onClick={cancelSubscription}
                className="flex-1 rounded-full bg-red-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
              >
                Cancel Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
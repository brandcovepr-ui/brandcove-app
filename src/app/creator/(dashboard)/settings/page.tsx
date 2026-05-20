'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '@/lib/supabase/client'

import { useUser } from '@/lib/hooks/useUser'
import { useAppStore } from '@/lib/stores/useAppStore'
import { format } from 'date-fns'
import { Camera, CheckCircle, UserCircle2 } from 'lucide-react'
import { AvatarCropModal } from '@/components/shared/AvatarCropModal'

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
  const [userEmail, setUserEmail] = useState('')
  const [cancelOpen, setCancelOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Avatar upload
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

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
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(data.path)
    return `${publicUrl}?t=${Date.now()}`
  }

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: '', location: '' },
  })

  const passwordForm = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
  })

  // Fetch real email + pre-fill form once profile loads
  useEffect(() => {
    void (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email) setUserEmail(session.user.email)
    })()
  }, [])

  useEffect(() => {
    if (!profile) return
    profileForm.reset({
      full_name: profile.full_name || '',
      location: (profile as any).location || '',
    })
  }, [profile]) // eslint-disable-line react-hooks/exhaustive-deps

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  async function onSaveProfile(data: ProfileData) {
    if (!profile) return

    const avatarUrl = await uploadAvatar()

    await Promise.all([
      supabase
        .from('profiles')
        .update({ full_name: data.full_name, ...(avatarUrl ? { avatar_url: avatarUrl } : {}) })
        .eq('id', profile.id),
      supabase
        .from('creative_profiles')
        .update({ location: data.location || null })
        .eq('id', profile.id),
    ])

    // Re-fetch so the store always reflects the DB — this also prevents
    // onAuthStateChange re-fetches from rolling back the avatar_url.
    const { data: fresh } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profile.id)
      .single()
    if (fresh) setProfile(fresh as any)
    if (avatarUrl) setAvatarBlob(null)

    showToast('Changes saved')
  }

  async function onSavePassword(data: PasswordData) {
    await supabase.auth.updateUser({ password: data.password })
    passwordForm.reset()
    showToast('Password updated')
  }

  async function cancelSubscription() {
    if (!profile) return
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token ?? null
    if (!token) return

    await fetch('/api/paystack/cancel', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })

    // Reflect cancelled status locally without a full page reload
    setProfile({ ...profile, subscription_status: 'inactive' } as any)
    setCancelOpen(false)
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile', label: 'Edit Profile' },
    { id: 'subscription', label: 'Subscription' },
    { id: 'password', label: 'Change Password' },
  ]

  return (
    <div className="p-4 md:p-8">
      {cropSrc && (
        <AvatarCropModal
          imageSrc={cropSrc}
          onDone={handleCropDone}
          onCancel={() => setCropSrc(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-white border border-green-200 text-green-700 text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg">
          <CheckCircle size={15} />
          {toast}
        </div>
      )}

      <h1 className="text-2xl font-editorial  font-regular text-gray-900 mb-6 md:mb-8">Account Settings</h1>

      <div className="flex flex-col md:flex-row gap-4 md:gap-5 items-start">

        {/* Left sidebar tab card */}
        <div className="w-full md:w-52 shrink-0 bg-white rounded-xl border border-gray-100 overflow-hidden flex md:flex-col">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 md:flex-none text-center md:text-left px-3 md:px-5 py-3 md:py-3.5 text-sm font-medium transition-colors border-r md:border-r-0 md:border-b border-gray-50 last:border-0 ${
                tab === t.id
                  ? 'bg-[#f5eeee] text-[#6b1d2b]'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Right content card */}
        <div className="flex-1 w-full bg-white rounded-xl border border-gray-100 p-5 md:p-7">

          {tab === 'profile' && (
            <form onSubmit={profileForm.handleSubmit(onSaveProfile)}>
              {/* Avatar */}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarFileChange}
                className="hidden"
              />
              <div className="flex items-center gap-4 mb-7">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="relative w-16 h-16 rounded-full overflow-hidden bg-[#6b1d2b] flex items-center justify-center text-white text-2xl font-bold shrink-0 group focus:outline-none"
                >
                  {avatarPreview || profile?.avatar_url ? (
                    <>
                      <img
                        src={avatarPreview ?? profile!.avatar_url!}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera size={16} className="text-white" />
                      </div>
                    </>
                  ) : (
                    <>
                      <UserCircle2 size={28} className="text-white/70 group-hover:hidden" />
                      <Camera size={20} className="text-white hidden group-hover:block" />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="text-xs text-[#6b1d2b] font-medium hover:underline"
                >
                  {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                </button>
              </div>

              <div className="space-y-4">
                {/* Full Name + Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Full Name</label>
                    <input
                      {...profileForm.register('full_name')}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6b1d2b]/30 focus:border-[#6b1d2b]"
                    />
                    {profileForm.formState.errors.full_name && (
                      <p className="text-xs text-red-500 mt-1">{profileForm.formState.errors.full_name.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Email</label>
                    <input
                      disabled
                      value={userEmail}
                      className="w-full border border-gray-100 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-400"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Location</label>
                  <input
                    {...profileForm.register('location')}
                    placeholder="e.g. Lagos, Nigeria"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6b1d2b]/30 focus:border-[#6b1d2b]"
                  />
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    className="bg-[#6b1d2b] text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-[#4e1520] transition-colors"
                  >
                    Save changes
                  </button>
                </div>
              </div>
            </form>
          )}

          {tab === 'subscription' && (
            <div className="space-y-5">
              <div className="border border-gray-100 rounded-xl p-5">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-4">Current Plan</p>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Creative Plan</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      ₦3,000
                      <span className="text-sm font-normal text-gray-400"> /month</span>
                    </p>
                  </div>
                  {profile?.subscription_expires_at && (
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Next billing</p>
                      <p className="text-sm font-medium text-gray-700 mt-1">
                        {format(new Date(profile.subscription_expires_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${
                    profile?.subscription_status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-50 text-red-600'
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

              <div className="border border-gray-100 rounded-xl p-5">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-4">Payment Method</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-6 bg-gray-900 rounded flex items-center justify-center text-white text-[8px] font-bold tracking-wider">
                      VISA
                    </div>
                    <p className="text-sm text-gray-700">Visa ending in 8483</p>
                  </div>
                  <button className="text-xs text-[#6b1d2b] hover:underline font-medium">
                    Update method
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'password' && (
            <form onSubmit={passwordForm.handleSubmit(onSavePassword)} className="space-y-4 max-w-sm">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">New Password</label>
                <input
                  {...passwordForm.register('password')}
                  type="password"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6b1d2b]/30 focus:border-[#6b1d2b]"
                />
                {passwordForm.formState.errors.password && (
                  <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.password.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Confirm Password</label>
                <input
                  {...passwordForm.register('confirm')}
                  type="password"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6b1d2b]/30 focus:border-[#6b1d2b]"
                />
                {passwordForm.formState.errors.confirm && (
                  <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.confirm.message}</p>
                )}
              </div>
              <div className="pt-1">
                <button
                  type="submit"
                  className="bg-[#6b1d2b] text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-[#4e1520] transition-colors"
                >
                  Update Password
                </button>
              </div>
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

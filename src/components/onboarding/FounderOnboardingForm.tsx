'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/useUser'
import Image from 'next/image'
import { Camera, UserCircle2 } from 'lucide-react'
import { AvatarCropModal } from '@/components/shared/AvatarCropModal'


const INDUSTRIES = ['E-commerce', 'FinTech', 'HealthTech', 'EdTech', 'Media', 'Fashion', 'Real Estate', 'SaaS', 'Other']
const STAGES = ['Pre-launch', 'Early stage', 'Growth', 'Established']


const ROLES = [
  'Social Media Manager', 'Graphic Designer', 'Sales Representative',
  'Customer Service Specialist', 'Operations Manager', 'Marketing Associate',

]

const step1Schema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  industry: z.string().min(1, 'Select an industry'),
  website_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
})

type Step1Data = z.infer<typeof step1Schema>

export function FounderOnboardingForm() {
  const { profile } = useUser()
  const [step, setStep] = useState(1)
  const [companyStage, setCompanyStage] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [paymentError, setPaymentError] = useState('')
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null)

  // Avatar
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

  const { register, handleSubmit, formState: { errors } } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
  })

  function onStep1(data: Step1Data) {
    setStep1Data(data)
    setStep(2)
  }

  // Upload avatar and save to profiles on finish
  async function uploadAvatar(userId: string): Promise<string | null> {
    if (!avatarBlob) return null
    const path = `${userId}/avatar.jpg`
    const { data } = await supabase.storage
      .from('avatars')
      .upload(path, avatarBlob, { upsert: true, contentType: 'image/jpeg' })
    if (!data) return null
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(data.path)
    return publicUrl
  }

  function toggleRole(role: string) {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    )
  }

  async function finishOnboarding() {
    if (!step1Data) return
    if (!profile?.id) {
      setSubmitError('Your session expired. Please refresh and try again.')
      return
    }
    setLoading(true)
    setSubmitError('')

    try {
      const userId = profile.id

      const { error: upsertError } = await supabase.from('founder_profiles').upsert({
        id: userId,
        company_name: step1Data.company_name,
        industry: [step1Data.industry],
        website_url: step1Data.website_url || null,
        creative_types_wanted: selectedRoles,
        company_stage: (companyStage || null) as string | null,
      })

      if (upsertError) throw upsertError

      const avatarUrl = await uploadAvatar(userId)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ onboarding_complete: true, ...(avatarUrl ? { avatar_url: avatarUrl } : {}) })
        .eq('id', userId)

      if (updateError) throw updateError

      setStep(5)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handlePayment() {
    if (loading) return
    setLoading(true)
    setPaymentError('')

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token ?? null
    if (!token) { setLoading(false); return }

    try {
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: process.env.NEXT_PUBLIC_PAYSTACK_FOUNDER_PLAN_CODE }),
      })

      if (!res.ok) {
        const body = await res.json()
        setPaymentError(body.error ?? 'Could not start payment. Please try again.')
        setLoading(false)
        return
      }

      const { authorization_url } = await res.json()
      window.location.href = authorization_url
    } catch {
      setPaymentError('Network error. Please try again.')
      setLoading(false)
    }
  }

  const totalSteps = 5
  const stepLabels = ['Your Company', 'Profile Photo', 'Company Stage', 'Roles You Need', 'Subscribe']

  return (
    <div className="auth-bg min-h-screen overflow-y-auto w-full">
      {cropSrc && (
        <AvatarCropModal
          imageSrc={cropSrc}
          onDone={handleCropDone}
          onCancel={() => setCropSrc(null)}
        />
      )}
      <div className="w-full h-full max-h-[92vh] bg-white rounded-2xl border-2 border-white overflow-hidden shadow-xl flex flex-col font-poppins">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-3 border-b border-gray-50 shrink-0 bg-[#F6F4F3]">
          <Image src="/BrandCovePr.png" alt="BrandCove" width={100} height={26} className="object-contain" />
          <span className="text-xs text-gray-400 uppercase tracking-widest">
            Step {step} : {stepLabels[step - 1]}
          </span>
          <span></span>
        </div>

        {/* Body */}
        <div className="flex flex-row items-center justify-center  min-h-full">

          {/* Form side */}
          <div className="w-1/2 overflow-y-auto px-10 py-8 flex ml-20  h-full flex-col  justify-center">

            {/* Step 1: Company info */}
            {step === 1 && (
              <>
                <h1 className="text-[28px] font-editorial font-thin text-gray mb-1">Tell us about your company</h1>
                <p className="text-sm text-gray-500 mb-6">This helps top creatives understand who they&apos;ll be working with.</p>
                <form onSubmit={handleSubmit(onStep1)} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Company Name</label>
                    <input
                      {...register('company_name')}
                      placeholder="e.g. Brand Cove"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                    {errors.company_name && <p className="text-xs text-red-500 mt-1">{errors.company_name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Industry</label>
                    <select
                      {...register('industry')}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                    >
                      <option value="">Select industry</option>
                      {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                    {errors.industry && <p className="text-xs text-red-500 mt-1">{errors.industry.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Website URL <span className="text-gray-400">(optional)</span></label>
                    <input
                      {...register('website_url')}
                      placeholder="https://"
                      className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                  <ProgressDots current={1} total={totalSteps} onDotClick={setStep} />
                  <button type="submit" className="w-full bg-gray-900 text-white rounded-full py-3 text-sm font-medium hover:bg-gray-800 transition-colors">
                    Continue
                  </button>
                </form>
              </>
            )}

            {/* Step 2: Profile Photo */}
            {step === 2 && (
              <>
                <h1 className="text-[28px] font-editorial font-thin text-gray mb-1">Add a profile photo</h1>
                <p className="text-sm text-gray-500 mb-8">A photo helps creatives know who they&apos;re working with. You can skip this and add one later.</p>

                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />

                <div className="flex flex-col items-center gap-5 mb-8">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="relative w-32 h-32 rounded-full overflow-hidden bg-[#f0e8ea] border-2 border-dashed border-[#6b1d2b]/30 hover:border-[#6b1d2b] transition-colors group focus:outline-none"
                  >
                    {avatarPreview ? (
                      <>
                        <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera size={20} className="text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
                        <UserCircle2 size={36} className="text-[#6b1d2b]/40" />
                        <span className="text-[10px] text-[#6b1d2b]/60 font-medium">Upload photo</span>
                      </div>
                    )}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="text-sm font-medium text-[#6b1d2b] hover:text-[#4e1520] transition-colors"
                    >
                      {avatarPreview ? 'Change photo' : 'Choose photo'}
                    </button>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG or WebP · max 5 MB</p>
                  </div>
                </div>

                <ProgressDots current={2} total={totalSteps} onDotClick={setStep} />
                <button
                  onClick={() => setStep(3)}
                  className="w-full bg-gray-900 text-white rounded-full py-3 text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  {avatarPreview ? 'Continue' : 'Skip for now'}
                </button>
              </>
            )}

            {/* Step 3: Company stage */}
            {step === 3 && (
              <>
                <h1 className="text-[28px] font-editorial text-gray-900 mb-1">What stage is your company in</h1>
                <p className="text-sm text-gray-500 mb-6">Help us tailor the experience to your current needs.</p>
                <div className="space-y-2 mb-6">
                  {STAGES.map(stage => (
                    <button
                      key={stage}
                      onClick={() => setCompanyStage(stage)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-full border text-sm transition-colors ${
                        companyStage === stage
                          ? 'border-gray-900 bg-pink-50 font-medium'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {stage}
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        companyStage === stage ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                      }`}>
                        {companyStage === stage && <span className="w-2 h-2 rounded-full bg-white" />}
                      </span>
                    </button>
                  ))}
                </div>
                <ProgressDots current={3} total={totalSteps} onDotClick={setStep} />
                <button
                  onClick={() => setStep(4)}
                  disabled={!companyStage}
                  className="w-full bg-gray-900 text-white rounded-full py-3 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40"
                >
                  Continue
                </button>
              </>
            )}

            {/* Step 4: Roles */}
            {step === 4 && (
              <>
                <h1 className="text-[28px] font-editorial text-gray-900 mb-1">Which roles do you need right now?</h1>
                <p className="text-sm text-gray-500 mb-6">Select the roles to filter your curated marketplace.</p>
                <div className="space-y-2 mb-6">
                  {ROLES.map(role => (
                    <button
                      key={role}
                      onClick={() => toggleRole(role)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-full border text-sm transition-colors ${
                        selectedRoles.includes(role)
                          ? 'border-gray-900 bg-pink-50 font-medium'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {role}
                      <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                        selectedRoles.includes(role) ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                      }`}>
                        {selectedRoles.includes(role) && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
                <ProgressDots current={4} total={totalSteps} onDotClick={setStep} />
                {submitError && (
                  <p className="text-xs text-red-500 mb-3">{submitError}</p>
                )}
                <button
                  onClick={finishOnboarding}
                  disabled={loading || selectedRoles.length === 0}
                  className="w-full bg-gray-900 text-white rounded-full py-3 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40"
                >
                  {loading ? 'Saving…' : 'Continue'}
                </button>
              </>
            )}

            {/* Step 5: Payment */}
            {step === 5 && (
              <>
                <h1 className="text-[28px] font-editorial text-gray-900 mb-1">You&apos;re almost in.</h1>
                <p className="text-sm text-gray-500 mb-8">Get full access to BrandCove&apos;s curated network of top creatives. Cancel anytime.</p>

                <div className="border border-gray-200 rounded-2xl p-6 mb-6">
                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Founder Plan</p>
                      <p className="text-3xl font-editorial text-gray-900">₦3,000</p>
                    </div>
                    <p className="text-sm text-gray-400 mb-1">/ month</p>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {[
                      'Browse verified creatives',
                      'Send unlimited inquiries',
                      'Direct messaging',
                      'Shortlist & compare talent',
                    ].map(feat => (
                      <li key={feat} className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <circle cx="7" cy="7" r="7" fill="#111827"/>
                          <path d="M4 7L6 9.5L10 4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>

                <ProgressDots current={5} total={totalSteps} onDotClick={setStep} />
                {paymentError && (
                  <p className="text-xs text-red-500 mb-3">{paymentError}</p>
                )}
                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className="w-full bg-gray-900 text-white rounded-full py-3 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40"
                >
                  {loading ? 'Processing…' : 'Pay ₦3,000 & Enter BrandCove'}
                </button>
                <p className="text-xs text-gray-400 text-center mt-3">Billed monthly. Cancel anytime.</p>
              </>
            )}
          </div>

          {/* Mascot side */}
          <div className="hidden md:flex w-1/2 items-center justify-center p-8  shrink-0">
            <Image
              src={
                step === 1 ? '/OnboardingMascot.png'
                : step === 2 ? '/Welcome Mascot.svg'
                : step === 3 ? '/Welcome Mascot.svg'
                : step === 4 ? '/Search Mascot.png'
                : '/SubscribeMascot.png'
              }
              alt=""
              width={420}
              height={420}
              className="object-contain w-auto h-auto max-h-[80%]"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function ProgressDots({ current, total, onDotClick }: { current: number; total: number; onDotClick: (step: number) => void }) {
  return (
    <div className="flex gap-1.5 mb-4 mt-6">
      {Array.from({ length: total }, (_, i) => {
        const stepNum = i + 1
        const isPast = stepNum < current
        const isCurrent = stepNum === current
        return (
          <button
            key={i}
            type="button"
            onClick={() => isPast && onDotClick(stepNum)}
            disabled={!isPast}
            className={`w-2 h-2 rounded-full transition-colors ${
              isCurrent || isPast ? 'bg-gray-900' : 'bg-gray-300'
            } ${isPast ? 'cursor-pointer hover:bg-gray-600' : 'cursor-default'}`}
          />
        )
      })}
    </div>
  )
}

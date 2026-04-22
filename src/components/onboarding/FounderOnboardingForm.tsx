'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/useUser'
import Image from 'next/image'


const INDUSTRIES = ['E-commerce', 'FinTech', 'HealthTech', 'EdTech', 'Media', 'Fashion', 'Real Estate', 'SaaS', 'Other']
const STAGES = ['Pre-launch', 'Early stage', 'Growth', 'Established']
const ROLES = [
  'Social Media Manager',
  'Web Designer',
  'Graphic Designer',
  'Sales Rep',
  'Customer Service Rep',
  'Creative Assistant',
  'Copywriter',
  'Video Editor',
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
  const [paymentError, setPaymentError] = useState('')
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
  })

  function onStep1(data: Step1Data) {
    setStep1Data(data)
    setStep(2)
  }

  function toggleRole(role: string) {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    )
  }

  async function finishOnboarding() {
    if (!step1Data) return
    setLoading(true)
    const supabase = createClient()

    try {
      const userId = profile?.id ?? (await supabase.auth.getUser()).data.user?.id
      if (!userId) {
        setLoading(false)
        return
      }

      const { error: upsertError } = await supabase.from('founder_profiles').upsert({
        id: userId,
        company_name: step1Data.company_name,
        industry: [step1Data.industry],
        website_url: step1Data.website_url || null,
        creative_types_wanted: selectedRoles,
      })

      if (upsertError) {
        console.error('founder_profiles upsert error:', upsertError)
        setLoading(false)
        return
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ onboarding_complete: true })
        .eq('id', userId)

      if (updateError) {
        console.error('profiles update error:', updateError)
        setLoading(false)
        return
      }

      setStep(4)
    } catch (err) {
      console.error('finishOnboarding unexpected error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handlePayment() {
    if (loading) return
    setLoading(true)
    setPaymentError('')

    const supabase = createClient()
    const [{ data: { user } }, { data: { session } }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getSession(),
    ])

    if (!user || !session) {
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
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

  const totalSteps = 4
  const stepLabels = ['Your Company', 'Company Stage', 'Roles You Need', 'Subscribe']

  return (
    <div className="auth-bg h-screen w-full">
      <div className="w-full h-full max-h-[92vh] bg-white rounded-2xl border-2 border-white overflow-hidden shadow-xl flex flex-col font-poppins">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-3 border-b border-gray-50 shrink-0 bg-[#F6F4F3]">
          <span className="text-xl font-regular text-gray-900 font-editorial tracking-tight">BrandCove</span>
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
                <h1 className="text-4xl font-editorial font-thin text-gray mb-1">Tell us about your company</h1>
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

            {/* Step 2: Company stage */}
            {step === 2 && (
              <>
                <h1 className="text-4xl font-editorial font-[400px] text-gray-900 mb-1">What stage is your company in</h1>
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
                <ProgressDots current={2} total={totalSteps} onDotClick={setStep} />
                <button
                  onClick={() => setStep(3)}
                  disabled={!companyStage}
                  className="w-full bg-gray-900 text-white rounded-full py-3 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40"
                >
                  Continue
                </button>
              </>
            )}

            {/* Step 3: Roles */}
            {step === 3 && (
              <>
                <h1 className="text-3xl font-editorial text-gray-900 mb-1">Which roles do you need right now?</h1>
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
                <ProgressDots current={3} total={totalSteps} onDotClick={setStep} />
                <button
                  onClick={finishOnboarding}
                  disabled={loading || selectedRoles.length === 0}
                  className="w-full bg-gray-900 text-white rounded-full py-3 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40"
                >
                  {loading ? 'Saving…' : 'Continue'}
                </button>
              </>
            )}

            {/* Step 4: Payment */}
            {step === 4 && (
              <>
                <h1 className="text-3xl font-editorial text-gray-900 mb-1">You&apos;re almost in.</h1>
                <p className="text-sm text-gray-500 mb-8">Get full access to BrandCove&apos;s curated network of top creatives. Cancel anytime.</p>

                <div className="border border-gray-200 rounded-2xl p-6 mb-6">
                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Founder Plan</p>
                      <p className="text-3xl font-editorial text-gray-900">₦25,000</p>
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

                <ProgressDots current={4} total={totalSteps} onDotClick={setStep} />
                {paymentError && (
                  <p className="text-xs text-red-500 mb-3">{paymentError}</p>
                )}
                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className="w-full bg-gray-900 text-white rounded-full py-3 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40"
                >
                  {loading ? 'Processing…' : 'Pay ₦25,000 & Enter BrandCove'}
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
                : step === 3 ? '/Search Mascot.png'
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

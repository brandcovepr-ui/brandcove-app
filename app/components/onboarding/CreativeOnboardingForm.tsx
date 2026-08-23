'use client'

import { useState, useActionState, startTransition, useCallback } from 'react'
import { submitCreativeOnboarding } from '@/app/actions/onboarding'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import { StepOneRole } from './steps/StepOneRole'
import { StepTwoAvatar } from './steps/StepTwoAvatar'
import { StepThreeBio, type BioFormData } from './steps/StepThreeBio'
import { StepFourWork } from './steps/StepFourWork'
import { StepFivePortfolio, type PortfolioLink } from './steps/StepFivePortfolio'
import { StepSixRates } from './steps/StepSixRates'

const STEP_LABELS = ['Your Role', 'Profile Photo', 'Bio & Experience', 'Show Your Work', 'Portfolio Links', 'Your Rate']

export function CreativeOnboardingForm() {
  const [state, formAction, isPending] = useActionState(submitCreativeOnboarding, null)
  const [step, setStep] = useState(1)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Local state across 6 steps
  const [discipline, setDiscipline] = useState<string>('')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null)
  const [bioData, setBioData] = useState<BioFormData>({ bio: '', years_experience: '', location: '' })
  const [workFiles, setWorkFiles] = useState<File[]>([])
  const [portfolioLinks, setPortfolioLinks] = useState<PortfolioLink[]>([{ label: '', url: '' }])
  const [monthlyRate, setMonthlyRate] = useState<string>('')
  const [availability, setAvailability] = useState<'available' | 'open_to_offers' | 'busy'>('available')

  const toggleSkill = useCallback((skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    )
  }, [])

  const handleFinalSubmit = async () => {
    setUploading(true)
    setUploadError(null)

    try {
      const supabase = getSupabaseBrowserClient()
      
      // Get current auth user for storage paths
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User authentication required')

      // 1. Upload Avatar directly to Supabase Storage
      let avatarUrl: string | null = null
      if (avatarBlob) {
        const avatarPath = `${user.id}/avatar-${Date.now()}.jpg`
        const { data: avatarUpload, error: avatarErr } = await supabase.storage
          .from('avatars')
          .upload(avatarPath, avatarBlob, { upsert: true, contentType: 'image/jpeg' })

        if (avatarErr) throw avatarErr

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(avatarUpload.path)
        avatarUrl = publicUrl
      }

      // 2. Upload Portfolio Work Files directly to Supabase Storage
      const workSampleUrls: string[] = []
      for (const file of workFiles) {
        const filePath = `${user.id}/work-${Date.now()}-${file.name}`
        const { data: workUpload, error: workErr } = await supabase.storage
          .from('work_samples')
          .upload(filePath, file, { upsert: true })

        if (workErr) throw workErr

        const { data: { publicUrl } } = supabase.storage
          .from('work_samples')
          .getPublicUrl(workUpload.path)
        workSampleUrls.push(publicUrl)
      }

      // 3. Construct lightweight JSON payload with file URLs
      const formData = new FormData()
      const payload = {
        discipline,
        skills: selectedSkills,
        bio: bioData.bio,
        yearsExperience: parseInt(bioData.years_experience, 10) || 0,
        location: bioData.location || undefined,
        monthlyRate: monthlyRate ? parseFloat(monthlyRate) : null,
        availability,
        portfolioLinks: portfolioLinks.filter((l) => l.label.trim() && l.url.trim()),
        avatarUrl,
        workSampleUrls,
      }

      formData.append('payload', JSON.stringify(payload))

      // 4. Submit small JSON-only payload to Server Action
      startTransition(() => {
        formAction(formData)
      })
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload assets. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="auth-bg min-h-dvh w-full overflow-y-auto p-0! sm:p-4!">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col overflow-hidden bg-white font-poppins shadow-xl sm:min-h-[calc(100dvh-2rem)] sm:max-h-[92dvh] sm:rounded-2xl sm:border-2 sm:border-white">
        
        {/* Header Bar */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-50 bg-[#F6F4F3] px-4 py-3 sm:px-8">
          <span className="shrink-0 font-editorial text-lg text-gray-900 tracking-tight sm:text-xl">
            BrandCove
          </span>
          <span className="min-w-0 text-right text-[10px] text-gray-400 uppercase tracking-widest sm:text-xs">
            Step {step} : {STEP_LABELS[step - 1]}
          </span>
        </div>

        {/* Step Body Container */}
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto px-5 py-6 sm:px-8 sm:py-8 lg:w-1/2 lg:justify-center lg:px-10">
            {step === 1 && (
              <StepOneRole
                discipline={discipline}
                setDiscipline={setDiscipline}
                selectedSkills={selectedSkills}
                toggleSkill={toggleSkill}
                onNext={() => setStep(2)}
              />
            )}

            {step === 2 && (
              <StepTwoAvatar
                avatarBlob={avatarBlob}
                setAvatarBlob={setAvatarBlob}
                onNext={() => setStep(3)}
              />
            )}

            {step === 3 && (
              <StepThreeBio
                initialValues={bioData}
                onSubmitBio={(data) => {
                  setBioData(data)
                  setStep(4)
                }}
              />
            )}

            {step === 4 && (
              <StepFourWork
                workFiles={workFiles}
                setWorkFiles={setWorkFiles}
                onNext={() => setStep(5)}
              />
            )}

            {step === 5 && (
              <StepFivePortfolio
                portfolioLinks={portfolioLinks}
                setPortfolioLinks={setPortfolioLinks}
                onNext={() => setStep(6)}
              />
            )}

            {step === 6 && (
              <StepSixRates
                monthlyRate={monthlyRate}
                setMonthlyRate={setMonthlyRate}
                availability={availability}
                setAvailability={setAvailability}
                onSubmit={handleFinalSubmit}
                isPending={isPending || uploading}
                serverError={uploadError || state?.error}
              />
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
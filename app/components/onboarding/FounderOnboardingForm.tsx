'use client'

import { useState, useActionState, startTransition, useEffect } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'

import {
  saveFounderOnboarding,
  initializeFounderPayment,
  ActionState,
} from '@/app/actions/onboarding'
import { AvatarCropModal } from '../ui/AvatarCropModal'
import { OnboardingHeader } from './FounderOnboardingHeader'

import { MascotSidebar } from './MascottSidebar'
import { Step1CompanyDetails, Step1Data } from './founderSteps/CompanyDetails'
import { Step2ProfilePhoto } from './founderSteps/ProfilePhoto'
import {  Step4RequiredRoles} from './founderSteps/CompanyStage'
import { Step3CompanyStage } from './founderSteps/RequireRoles'
import { Step5Subscribe } from './founderSteps/Subscribe'

const STEP_LABELS = [
  'Your Company',
  'Profile Photo',
  'Company Stage',
  'Roles You Need',
  'Subscribe',
]

const initialActionState: ActionState = {}

export function FounderOnboardingForm() {
  const [step, setStep] = useState(1)
  const [userId, setUserId] = useState<string | null>(null)

  // Step Data State
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null)
  const [companyStage, setCompanyStage] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])

  // Avatar Crop State
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [clientError, setClientError] = useState('')

  // Fetch user ID directly using browser client on mount
  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUserId(data.user.id)
      }
    })
  }, [])

  // Server Actions bound with React's useActionState hook
  const [saveState, runSaveAction, isSaving] = useActionState(
    saveFounderOnboarding,
    initialActionState
  )

  const [paymentState, runPaymentAction, isPaying] = useActionState(
    initializeFounderPayment,
    initialActionState
  )

  // Handle automatic redirection when payment initialization action succeeds
  useEffect(() => {
    if (paymentState.authorizationUrl) {
      window.location.href = paymentState.authorizationUrl
    }
  }, [paymentState.authorizationUrl])

  // Handle transition to Step 5 when save action completes successfully
  useEffect(() => {
    if (saveState.success) {
      setStep(5)
    }
  }, [saveState.success])

  // Avatar Local File Handling
  function handleFileSelect(file: File) {
    const reader = new FileReader()
    reader.onload = () => setCropSrc(reader.result as string)
    reader.readAsDataURL(file)
  }

  function handleCropDone(blob: Blob) {
    setAvatarBlob(blob)
    setAvatarPreview(URL.createObjectURL(blob))
    setCropSrc(null)
  }

  async function uploadAvatarToStorage(activeUserId: string): Promise<string | null> {
    if (!avatarBlob) return null
    const path = `${activeUserId}/avatar.jpg`
    const supabase = getSupabaseBrowserClient()
    
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(path, avatarBlob, { upsert: true, contentType: 'image/jpeg' })

    if (error || !data) return null
    
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(data.path)
    return publicUrl
  }

  function toggleRole(role: string) {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    )
  }

  // Submit Handler executing Save Action via Transition
  async function handleFinishOnboarding() {
    if (!step1Data) {
      setClientError('Please complete company details first.')
      return
    }

    setClientError('')
    setIsUploading(true)

    try {
      const supabase = getSupabaseBrowserClient()
      let currentUserId = userId

      // Fallback: Query session if state wasn't populated yet
      if (!currentUserId) {
        const { data } = await supabase.auth.getUser()
        currentUserId = data.user?.id || null
      }

      if (!currentUserId) {
        setClientError('Unauthorized session. Please log in again.')
        return
      }

      const avatarUrl = await uploadAvatarToStorage(currentUserId)

      startTransition(() => {
        runSaveAction({
          companyName: step1Data.company_name,
          industry: step1Data.industry,
          websiteUrl: step1Data.website_url,
          companyStage,
          creativeTypesWanted: selectedRoles,
          avatarUrl,
        })
      })
    } catch {
      setClientError('Failed to process image upload. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  // Payment Handler executing Payment Action via Transition
  function handlePayment() {
    startTransition(() => {
      runPaymentAction()
    })
  }

  const activeError = clientError || saveState.error

  return (
    <div className="auth-bg min-h-dvh w-full overflow-y-auto !p-0 sm:!p-4">
      {cropSrc && (
        <AvatarCropModal
          imageSrc={cropSrc}
          onDone={handleCropDone}
          onCancel={() => setCropSrc(null)}
        />
      )}

      <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col overflow-hidden bg-white font-poppins shadow-xl sm:min-h-[calc(100dvh-2rem)] sm:max-h-[92dvh] sm:rounded-2xl sm:border-2 sm:border-white">
        <OnboardingHeader
          currentStep={step}
          totalSteps={STEP_LABELS.length}
          label={STEP_LABELS[step - 1]}
        />

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto px-5 py-6 sm:px-8 sm:py-8 lg:w-1/2 lg:justify-center lg:px-10">
            {step === 1 && (
              <Step1CompanyDetails
                defaultValues={step1Data}
                totalSteps={STEP_LABELS.length}
                onNext={(data) => {
                  setStep1Data(data)
                  setStep(2)
                }}
                onDotClick={setStep}
              />
            )}

            {step === 2 && (
              <Step2ProfilePhoto
                avatarPreview={avatarPreview}
                totalSteps={STEP_LABELS.length}
                onFileSelect={handleFileSelect}
                onNext={() => setStep(3)}
                onDotClick={setStep}
              />
            )}

            {step === 3 && (
              <Step3CompanyStage
                companyStage={companyStage}
                totalSteps={STEP_LABELS.length}
                onSelectStage={setCompanyStage}
                onNext={() => setStep(4)}
                onDotClick={setStep}
              />
            )}

            {step === 4 && (
              <Step4RequiredRoles
                selectedRoles={selectedRoles}
                totalSteps={STEP_LABELS.length}
                loading={isSaving || isUploading}
                error={activeError}
                onToggleRole={toggleRole}
                onSubmit={handleFinishOnboarding}
                onDotClick={setStep}
              />
            )}

            {step === 5 && (
              <Step5Subscribe
                totalSteps={STEP_LABELS.length}
                loading={isPaying}
                error={paymentState.error}
                onPay={handlePayment}
                onDotClick={setStep}
              />
            )}
          </div>

          <MascotSidebar step={step} />
        </div>
      </div>
    </div>
  )
}
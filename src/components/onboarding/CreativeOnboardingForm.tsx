'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/useUser'
import { Upload, X, ImageIcon, FileText, Film, Plus, Link as LinkIcon, Camera, UserCircle2 } from 'lucide-react'
import Image from 'next/image'
import { AvatarCropModal } from '@/components/shared/AvatarCropModal'

const DISCIPLINES = [
  'Social Media Manager', 'Graphic Designer', 'Sales Representative',
  'Customer Service Specialist', 'Operations Manager', 'Marketing Associate',

]

const SKILLS_BY_DISCIPLINE: Record<string, string[]> = {
  'Social Media Manager': ['Instagram', 'TikTok', 'Twitter/X', 'LinkedIn', 'Content Calendar', 'Analytics', 'Community Management'],
  'Graphic Designer': ['Adobe Illustrator', 'Photoshop', 'InDesign', 'Brand Identity', 'Typography', 'Print Design'],
  'Sales Representative': ['Lead Generation', 'Cold Outreach', 'CRM Tools', 'Negotiation', 'B2B Sales', 'Presentation'],
  'Customer Service Specialist': ['Support Ticketing', 'Live Chat', 'Email Support', 'Conflict Resolution', 'CRM', 'Empathy'],
  'Operations Manager': ['Project Management', 'Research', 'Scheduling', 'Content Editing', 'Communication'],
  'Marketing Associate': ['SEO Writing', 'Ad Copy', 'Email Marketing', 'Brand Voice', 'Long-form Content', 'Storytelling'],

}

const AVAILABILITY_OPTIONS = [
  { value: 'available', label: 'Available', description: 'Open to new projects right now' },
  { value: 'open_to_offers', label: 'Open to offers', description: 'Busy but accepting the right fit' },
  { value: 'busy', label: 'Busy', description: 'Not available at the moment' },
]

const step2Schema = z.object({
  bio: z.string().min(30, 'Tell us a bit more (min 30 characters)'),
  years_experience: z.string().min(1, 'Required'),
  location: z.string().optional(),
})

type Step2Data = z.infer<typeof step2Schema>

interface UploadedFile {
  name: string
  url: string
  file_type: 'image' | 'pdf' | 'video' | 'other'
  previewUrl?: string
}

interface PortfolioLink {
  label: string
  url: string
}

const MAX_PORTFOLIO_LINKS = 5

function isValidUrl(value: string): boolean {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

export function CreativeOnboardingForm() {
  const router = useRouter()
  const { profile } = useUser()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Step 1
  const [discipline, setDiscipline] = useState('')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])

  // Avatar (step 2)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Step 3 (was 2)
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null)

  // Step 3
  const [uploads, setUploads] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const MAX_FILES = 6
  const MAX_FILE_SIZE_MB = 50
  const UPLOAD_TIMEOUT_MS = 30_000

  // Step 4: Portfolio links
  const [portfolioLinks, setPortfolioLinks] = useState<PortfolioLink[]>([{ label: '', url: '' }])
  const [portfolioErrors, setPortfolioErrors] = useState<Array<{ label?: string; url?: string }>>([{}])

  // Step 5
  const [hourlyRate, setHourlyRate] = useState('')
  const [availability, setAvailability] = useState('available')

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
  })

  function toggleSkill(skill: string) {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    )
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length || !profile?.id) return

    setUploadError('')

    const remaining = MAX_FILES - uploads.length
    if (remaining <= 0) {
      setUploadError(`You've reached the maximum of ${MAX_FILES} files.`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const filesToUpload = files.slice(0, remaining)
    const oversized = filesToUpload.find(f => f.size > MAX_FILE_SIZE_MB * 1024 * 1024)
    if (oversized) {
      setUploadError(`"${oversized.name}" exceeds the ${MAX_FILE_SIZE_MB} MB limit.`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setUploading(true)
    const failed: string[] = []

    for (const file of filesToUpload) {
      const ext = file.name.split('.').pop()?.toLowerCase() || ''
      const fileType: UploadedFile['file_type'] =
        ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) ? 'image'
        : ext === 'pdf' ? 'pdf'
        : ['mp4', 'mov', 'avi', 'webm'].includes(ext) ? 'video'
        : 'other'

      const path = `${profile.id}/${Date.now()}-${file.name}`

      try {
        const uploadPromise = supabase.storage
          .from('work-samples')
          .upload(path, file, { upsert: false })

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), UPLOAD_TIMEOUT_MS)
        )

        const { data, error } = await Promise.race([uploadPromise, timeoutPromise])

        if (error || !data) {
          failed.push(file.name)
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('work-samples')
            .getPublicUrl(data.path)

          const previewUrl = fileType === 'image' ? URL.createObjectURL(file) : undefined
          setUploads(prev => [...prev, { name: file.name, url: publicUrl, file_type: fileType, previewUrl }])
        }
      } catch {
        failed.push(file.name)
      }
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''

    if (failed.length > 0) {
      const names = failed.length === 1 ? `"${failed[0]}"` : `${failed.length} files`
      setUploadError(`${names} failed to upload — check your connection and try again.`)
    }
  }

  function removeUpload(index: number) {
    setUploads(prev => prev.filter((_, i) => i !== index))
  }

  function onStep2Submit(data: Step2Data) {
    setStep2Data(data)
    setStep(4)
  }

  // Portfolio link helpers
  function updatePortfolioLink(index: number, field: 'label' | 'url', value: string) {
    setPortfolioLinks(prev => prev.map((link, i) => i === index ? { ...link, [field]: value } : link))
    setPortfolioErrors(prev => prev.map((err, i) => i === index ? { ...err, [field]: undefined } : err))
  }

  function addPortfolioLink() {
    if (portfolioLinks.length >= MAX_PORTFOLIO_LINKS) return
    setPortfolioLinks(prev => [...prev, { label: '', url: '' }])
    setPortfolioErrors(prev => [...prev, {}])
  }

  function removePortfolioLink(index: number) {
    setPortfolioLinks(prev => prev.filter((_, i) => i !== index))
    setPortfolioErrors(prev => prev.filter((_, i) => i !== index))
  }

  function validateAndAdvancePortfolioStep() {
    const newErrors: Array<{ label?: string; url?: string }> = portfolioLinks.map(link => {
      const err: { label?: string; url?: string } = {}
      if (!link.label.trim()) err.label = 'Label required'
      if (!link.url.trim()) {
        err.url = 'URL required'
      } else if (!isValidUrl(link.url.trim())) {
        err.url = 'Enter a valid URL (e.g. https://...)'
      }
      return err
    })

    setPortfolioErrors(newErrors)
    const hasErrors = newErrors.some(e => e.label || e.url)
    if (!hasErrors) setStep(6)
  }

  async function finishOnboarding() {
    if (!step2Data) return
    if (!profile?.id) {
      setSubmitError('Your session expired. Please refresh and try again.')
      return
    }
    setLoading(true)
    setSubmitError('')

    try {
      // Upload avatar (optional — failure doesn't block submission)
      let avatarUrl: string | null = null
      if (avatarBlob) {
        const path = `${profile.id}/avatar.jpg`
        const { data: uploadData } = await supabase.storage
          .from('avatars')
          .upload(path, avatarBlob, { upsert: true, contentType: 'image/jpeg' })
        if (uploadData) {
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(uploadData.path)
          avatarUrl = publicUrl
        }
      }

      const cleanLinks = portfolioLinks.filter(l => l.label.trim() && l.url.trim())

      const { error: profileError } = await supabase.from('creative_profiles').upsert({
        id: profile.id,
        discipline,
        skills: selectedSkills,
        years_experience: parseInt(step2Data.years_experience) || 0,
        location: step2Data.location || null,
        hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
        availability,
        portfolio_links: cleanLinks as any,
      })

      if (profileError) throw new Error('Failed to save your profile details. Please try again.')

      const { error: bioError } = await supabase.from('profiles').update({
        bio: step2Data.bio,
        onboarding_complete: true,
        review_status: 'pending',
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      }).eq('id', profile.id)

      if (bioError) throw new Error('Failed to save your bio. Please try again.')

      if (uploads.length > 0) {
        const { error: samplesError } = await supabase.from('work_samples').insert(
          uploads.map(u => ({
            creative_id: profile.id,
            url: u.url,
            title: u.name,
            file_type: u.file_type,
          }))
        )
        if (samplesError) throw new Error('Failed to save your work samples. Please try again.')
      }

      // Notify admin — fire and forget, never block navigation on this
      fetch('/api/email/creator-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creative_id: profile.id }),
        keepalive: true,
      }).catch(() => {})

      router.push('/creator/pending-review')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

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

  const totalSteps = 6
  const stepLabels = ['Your Role', 'Profile Photo', 'Bio & Experience', 'Show Your Work', 'Portfolio Links', 'Your Rate']

  return (
    <div className="auth-bg h-screen w-full">
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
          <span className="text-xl font-regular text-gray-900 font-editorial tracking-tight">BrandCove</span>
          <span className="text-xs text-gray-400 uppercase tracking-widest">
            Step {step} : {stepLabels[step - 1]}
          </span>
          <span></span>
        </div>

        {/* Body */}
        <div className="flex flex-row min-h-0">

          {/* Form side */}
          <div className="w-1/2 overflow-y-auto px-10 py-8 flex flex-col justify-center">

            {/* Step 1: Primary Role */}
            {step === 1 && (
              <>
                <h1 className="text-3xl font-editorial text-gray-900 mb-1">What is your primary role?</h1>
                <p className="text-sm text-gray-500 mb-6">Choose the core competency you want to be hired for. You can highlight additional skills in the next step.</p>

                <div className="space-y-2 mb-5">
                  {DISCIPLINES.map(d => (
                    <button
                      key={d}
                      onClick={() => { setDiscipline(d); setSelectedSkills([]) }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm transition-colors ${
                        discipline === d
                          ? 'border-gray-900 bg-pink-50 font-medium'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {d}
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        discipline === d ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                      }`}>
                        {discipline === d && <span className="w-2 h-2 rounded-full bg-white" />}
                      </span>
                    </button>
                  ))}
                </div>

                {discipline && (
                  <>
                    <p className="text-xs font-medium text-gray-700 mb-2">Select your skills</p>
                    <div className="flex flex-wrap gap-2 mb-5">
                      {(SKILLS_BY_DISCIPLINE[discipline] || []).map(skill => (
                        <button
                          key={skill}
                          onClick={() => toggleSkill(skill)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            selectedSkills.includes(skill)
                              ? 'border-gray-900 bg-gray-900 text-white'
                              : 'border-gray-200 text-gray-600 hover:border-gray-400'
                          }`}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <ProgressDots current={1} total={totalSteps} onDotClick={setStep} />
                <button
                  onClick={() => setStep(2)}
                  disabled={!discipline}
                  className="w-full bg-gray-900 text-white rounded-full py-3 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40"
                >
                  Continue
                </button>
              </>
            )}

            {/* Step 2: Profile Photo */}
            {step === 2 && (
              <>
                <h1 className="text-3xl font-editorial text-gray-900 mb-1">Add a profile photo</h1>
                <p className="text-sm text-gray-500 mb-8">A clear photo helps founders put a face to your work. You can skip this and add one later.</p>

                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />

                <div className="flex flex-col items-center gap-5 mb-8">
                  {/* Avatar preview circle */}
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

            {/* Step 3: Bio & Experience */}
            {step === 3 && (
              <>
                <h1 className="text-3xl font-editorial text-gray-900 mb-1">Your bio &amp; experience</h1>
                <p className="text-sm text-gray-500 mb-6">Tell founders what you specialize in and the value you bring to a team.</p>

                <form onSubmit={step2Form.handleSubmit(onStep2Submit)} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      {...step2Form.register('bio')}
                      rows={4}
                      placeholder="Tell founders about yourself, your style, and the kind of work you love doing..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                    />
                    {step2Form.formState.errors.bio && (
                      <p className="text-xs text-red-500 mt-1">{step2Form.formState.errors.bio.message}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Years of Experience</label>
                      <select
                        {...step2Form.register('years_experience')}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                      >
                        <option value="">Select</option>
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'].map(y => (
                          <option key={y} value={y === '10+' ? '10' : y}>{y} {y === '1' ? 'year' : 'years'}</option>
                        ))}
                      </select>
                      {step2Form.formState.errors.years_experience && (
                        <p className="text-xs text-red-500 mt-1">{step2Form.formState.errors.years_experience.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Location <span className="text-gray-400">(optional)</span></label>
                      <input
                        {...step2Form.register('location')}
                        placeholder="e.g. Lagos, Nigeria"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>
                  </div>

                  <ProgressDots current={3} total={totalSteps} onDotClick={setStep} />
                  <button
                    type="submit"
                    className="w-full bg-gray-900 text-white rounded-full py-3 text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    Continue
                  </button>
                </form>
              </>
            )}

            {/* Step 4: Show Your Work */}
            {step === 4 && (
              <>
                <h1 className="text-3xl font-editorial text-gray-900 mb-1">Show your work</h1>
                <p className="text-sm text-gray-500 mb-6">Upload 1 to 6 items that showcase your best capabilities. This is the first
thing founders will look at.</p>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => { setUploadError(''); fileInputRef.current?.click() }}
                  disabled={uploading || uploads.length >= MAX_FILES}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl py-8 flex flex-col items-center gap-2 hover:border-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50 mb-4"
                >
                  <Upload size={20} className="text-gray-400" />
                  <p className="text-sm text-gray-500">
                    {uploading ? 'Uploading…' : uploads.length >= MAX_FILES ? 'Maximum files reached' : 'Click to upload files'}
                  </p>
                  <p className="text-xs text-gray-400">Images, PDFs, Videos · max {MAX_FILE_SIZE_MB} MB each · up to {MAX_FILES} files</p>
                </button>

                {uploadError && (
                  <p className="text-xs text-red-500 mb-3">{uploadError}</p>
                )}

                {uploads.length > 0 && (
                  <div className="space-y-2 mb-5">
                    {uploads.map((file, i) => (
                      <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5">
                        {file.previewUrl ? (
                          <img src={file.previewUrl} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center shrink-0">
                            {file.file_type === 'pdf' ? <FileText size={16} className="text-gray-500" /> :
                             file.file_type === 'video' ? <Film size={16} className="text-gray-500" /> :
                             <ImageIcon size={16} className="text-gray-500" />}
                          </div>
                        )}
                        <p className="text-xs text-gray-700 flex-1 truncate">{file.name}</p>
                        <button onClick={() => removeUpload(i)} className="text-gray-400 hover:text-gray-600 shrink-0">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <ProgressDots current={4} total={totalSteps} onDotClick={setStep} />
                <button
                  onClick={() => setStep(5)}
                  className="w-full bg-gray-900 text-white rounded-full py-3 text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  {uploads.length > 0 ? 'Continue' : 'Skip for now'}
                </button>
              </>
            )}

            {/* Step 5: Portfolio Links */}
            {step === 5 && (
              <>
                <h1 className="text-3xl font-editorial text-gray-900 mb-1">Your portfolio links</h1>
                <p className="text-sm text-gray-500 mb-6">
                  Add links to your online work — portfolio site, Behance, Dribbble, GitHub, Instagram, YouTube, or anywhere else your best work lives. Add at least 1 and up to 5 links.
                </p>

                <div className="space-y-4 mb-5">
                  {portfolioLinks.map((link, i) => (
                    <div key={i} className="rounded-xl border border-gray-200 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <LinkIcon size={13} className="text-gray-400" />
                          <span className="text-xs font-medium text-gray-700">Link {i + 1}</span>
                        </div>
                        {portfolioLinks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePortfolioLink(i)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Label</label>
                        <input
                          type="text"
                          value={link.label}
                          onChange={e => updatePortfolioLink(i, 'label', e.target.value)}
                          placeholder="e.g. My design portfolio, Instagram page, GitHub profile"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                        />
                        {portfolioErrors[i]?.label && (
                          <p className="text-xs text-red-500 mt-1">{portfolioErrors[i].label}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">URL</label>
                        <input
                          type="url"
                          value={link.url}
                          onChange={e => updatePortfolioLink(i, 'url', e.target.value)}
                          placeholder="https://"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                        />
                        {portfolioErrors[i]?.url && (
                          <p className="text-xs text-red-500 mt-1">{portfolioErrors[i].url}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {portfolioLinks.length < MAX_PORTFOLIO_LINKS && (
                  <button
                    type="button"
                    onClick={addPortfolioLink}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-5"
                  >
                    <Plus size={15} />
                    Add another link
                  </button>
                )}

                <ProgressDots current={5} total={totalSteps} onDotClick={setStep} />
                <button
                  onClick={validateAndAdvancePortfolioStep}
                  className="w-full bg-gray-900 text-white rounded-full py-3 text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Continue
                </button>
                <button
                  type="button"
                  onClick={() => { setPortfolioLinks([]); setPortfolioErrors([]); setStep(6) }}
                  className="w-full text-center text-sm text-gray-400 hover:text-gray-600 mt-2 py-1 transition-colors"
                >
                  Skip for now
                </button>
              </>
            )}

            {/* Step 6: Rate & Availability */}
            {step === 6 && (
              <>
                <h1 className="text-3xl font-editorial text-gray-900 mb-1">Set your rate &amp; availability</h1>
                <p className="text-sm text-gray-500 mb-6">Founders will see this on your profile when browsing.</p>

                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Monthly Rate (₦)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₦</span>
                      <input
                        type="number"
                        value={hourlyRate}
                        onChange={e => setHourlyRate(e.target.value)}
                        placeholder="e.g. 150000"
                        className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Availability</label>
                    <div className="space-y-2">
                      {AVAILABILITY_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setAvailability(opt.value)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm transition-colors text-left ${
                            availability === opt.value
                              ? 'border-gray-900 bg-pink-50'
                              : 'border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          <div>
                            <p className={`font-medium ${availability === opt.value ? 'text-gray-900' : 'text-gray-700'}`}>{opt.label}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{opt.description}</p>
                          </div>
                          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            availability === opt.value ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                          }`}>
                            {availability === opt.value && <span className="w-2 h-2 rounded-full bg-white" />}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <ProgressDots current={6} total={totalSteps} onDotClick={setStep} />
                <button
                  onClick={finishOnboarding}
                  disabled={loading}
                  className="w-full mt-2 bg-gray-900 text-white rounded-full py-3 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40"
                >
                  {loading ? 'Submitting…' : 'Submit for Review'}
                </button>
                {submitError && (
                  <p className="text-xs text-red-500 text-center mt-2">{submitError}</p>
                )}
                <p className="text-xs text-gray-400 text-center mt-2">
                  Submitting sends your profile to our team for review. You won&apos;t have access until approved.
                </p>
              </>
            )}
          </div>

          {/* Mascot side */}
          <div className="hidden md:flex w-1/2 items-center justify-center p-8 border-l border-gray-50 shrink-0">
            <Image
              src={
                step === 1 ? '/OnboardingMascot.png'
                : step === 2 ? '/Welcome Mascot.svg'
                : step === 3 ? '/Welcome Mascot.svg'
                : step === 4 ? '/Search Mascot.png'
                : step === 5 ? '/OnboardingMascot.png'
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

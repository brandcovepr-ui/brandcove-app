'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/useUser'
import { Upload, X, ImageIcon, FileText, Film } from 'lucide-react'
import Image from 'next/image'

const DISCIPLINES = [
  'Social Media Manager',
  'Web Designer',
  'Graphic Designer',
  'Sales Rep',
  'Customer Service Rep',
  'Creative Assistant',
]

const SKILLS_BY_DISCIPLINE: Record<string, string[]> = {
  'Social Media Manager': ['Instagram', 'TikTok', 'Twitter/X', 'LinkedIn', 'Content Calendar', 'Analytics', 'Community Management'],
  'Web Designer': ['Figma', 'HTML/CSS', 'React', 'Responsive Design', 'Webflow', 'WordPress', 'UX Research'],
  'Graphic Designer': ['Adobe Illustrator', 'Photoshop', 'InDesign', 'Brand Identity', 'Typography', 'Print Design'],
  'Sales Rep': ['Lead Generation', 'Cold Outreach', 'CRM Tools', 'Negotiation', 'B2B Sales', 'Presentation'],
  'Customer Service Rep': ['Support Ticketing', 'Live Chat', 'Email Support', 'Conflict Resolution', 'CRM', 'Empathy'],
  'Creative Assistant': ['Project Management', 'Research', 'Scheduling', 'Content Editing', 'Communication'],
  'Copywriter': ['SEO Writing', 'Ad Copy', 'Email Marketing', 'Brand Voice', 'Long-form Content', 'Storytelling'],
  'Video Editor': ['Premiere Pro', 'Final Cut Pro', 'DaVinci Resolve', 'Motion Graphics', 'Color Grading', 'YouTube'],
  'Photographer': ['Portrait', 'Product Photography', 'Lightroom', 'Studio Lighting', 'Event Photography'],
  'Brand Strategist': ['Brand Identity', 'Market Research', 'Positioning', 'Competitor Analysis', 'Messaging'],
  'Content Creator': ['Short-form Video', 'Blog Writing', 'Podcasting', 'Storytelling', 'Audience Growth'],
  'UI/UX Designer': ['Figma', 'Prototyping', 'User Research', 'Wireframing', 'Accessibility', 'Design Systems'],
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

export function CreativeOnboardingForm() {
  const router = useRouter()
  const { profile } = useUser()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Step 1
  const [discipline, setDiscipline] = useState('')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])

  // Step 2
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null)

  // Step 3
  const [uploads, setUploads] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const MAX_FILES = 6
  const MAX_FILE_SIZE_MB = 50
  const UPLOAD_TIMEOUT_MS = 30_000

  // Step 4
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
    const supabase = createClient()
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
    setStep(3)
  }

  async function finishOnboarding() {
    if (!step2Data || !profile?.id) return
    setLoading(true)
    const supabase = createClient()

    await supabase.from('creative_profiles').upsert({
      id: profile.id,
      discipline,
      skills: selectedSkills,
      years_experience: parseInt(step2Data.years_experience) || 0,
      location: step2Data.location || null,
      hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
      availability,
    })

    await supabase.from('profiles').update({
      bio: step2Data.bio,
      onboarding_complete: true,
      review_status: 'pending',
    }).eq('id', profile.id)

    if (uploads.length > 0) {
      await supabase.from('work_samples').insert(
        uploads.map(u => ({
          creative_id: profile.id,
          url: u.url,
          title: u.name,
          file_type: u.file_type,
        }))
      )
    }

    setLoading(false)
    router.push('/creator/pending-review')
  }

  const totalSteps = 4
  const stepLabels = ['Your Role', 'Bio & Experience', 'Show Your Work', 'Your Rate']

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

            {/* Step 2: Bio & Experience */}
            {step === 2 && (
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

                  <ProgressDots current={2} total={totalSteps} onDotClick={setStep} />
                  <button
                    type="submit"
                    className="w-full bg-gray-900 text-white rounded-full py-3 text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    Continue
                  </button>
                </form>
              </>
            )}

            {/* Step 3: Show Your Work */}
            {step === 3 && (
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

                <ProgressDots current={3} total={totalSteps} onDotClick={setStep} />
                <button
                  onClick={() => setStep(4)}
                  disabled={uploads.length === 0}
                  className="w-full bg-gray-900 text-white rounded-full py-3 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40"
                >
                  Continue
                </button>
              </>
            )}

            {/* Step 4: Rate */}
            {step === 4 && (
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

                <ProgressDots current={4} total={totalSteps} onDotClick={setStep} />
                <button
                  onClick={finishOnboarding}
                  disabled={loading}
                  className="w-full mt-2 bg-gray-900 text-white rounded-full py-3 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40"
                >
                  {loading ? 'Submitting…' : 'Submit for Review'}
                </button>
              </>
            )}
          </div>

          {/* Mascot side */}
          <div className="hidden md:flex w-1/2 items-center justify-center p-8 border-l border-gray-50 shrink-0">
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

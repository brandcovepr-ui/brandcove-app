'use client'

import { useState, useRef, useCallback, useActionState } from 'react'
import { UploadCloud, X } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import { updateCreatorProfile, ProfileActionResult } from '@/app/actions/creator-profile'
import type { CreativeProfile, WorkSample, Profile } from '@/lib/types'

const DISCIPLINES = [
  'Social Media Manager',
  'Graphic Designer',
  'Sales Representative',
  'Customer Service Specialist',
  'Operations Manager',
  'Marketing Associate',
]

const MAX_FILES = 6
const MAX_MB = 50

interface EditProfileProps {
  initialProfile: Profile | null
  initialCreativeProfile: CreativeProfile | null
  initialWorkSamples?: WorkSample[]
}

export default function CreatorProfileEditForm({
  initialProfile,
  initialCreativeProfile,
  initialWorkSamples = [],
}: EditProfileProps) {
  const [state, formAction, isPending] = useActionState<ProfileActionResult, FormData>(
    updateCreatorProfile,
    {}
  )

  const [discipline, setDiscipline] = useState(initialCreativeProfile?.discipline || '')
  const [skills, setSkills] = useState<string[]>(initialCreativeProfile?.skills || [])
  const [skillInput, setSkillInput] = useState('')

  // Local state for interactive client-side management of work samples
  const [workSamples, setWorkSamples] = useState<WorkSample[]>(initialWorkSamples)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = getSupabaseBrowserClient()

  function addSkill(raw: string) {
    const tag = raw.trim()
    if (tag && !skills.includes(tag)) setSkills((prev) => [...prev, tag])
    setSkillInput('')
  }

  function handleSkillKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addSkill(skillInput)
    } else if (e.key === 'Backspace' && !skillInput && skills.length) {
      setSkills((prev) => prev.slice(0, -1))
    }
  }

  async function uploadFiles(files: File[]) {
    setUploadError('')
    const remaining = MAX_FILES - workSamples.length

    if (remaining <= 0) {
      setUploadError(`Maximum of ${MAX_FILES} files reached.`)
      return
    }

    const batch = files.slice(0, remaining)
    const oversized = batch.find((f) => f.size > MAX_MB * 1024 * 1024)
    if (oversized) {
      setUploadError(`"${oversized.name}" exceeds the ${MAX_MB} MB limit.`)
      return
    }

    setUploading(true)
    const failed: string[] = []

    for (const file of batch) {
      try {
        const fileExt = file.name.split('.').pop()
        const filePath = `${initialProfile?.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        // 1. Upload file directly to Supabase storage bucket from the browser
        const { data: storageData, error: storageError } = await supabase.storage
          .from('work_samples')
          .upload(filePath, file, { cacheControl: '3600', upsert: false })

        if (storageError) throw storageError

        // 2. Get Public URL
        const { data: publicUrlData } = supabase.storage
          .from('work_samples')
          .getPublicUrl(storageData.path)

        const fileType = file.type.startsWith('image/') ? 'image' : 'document'

        // 3. Insert record into database table
        const { data: sampleRecord, error: dbError } = await supabase
          .from('work_samples')
          .insert({
            creative_id: initialProfile?.id,
            url: publicUrlData.publicUrl,
            file_type: fileType,
            title: file.name,
          })
          .select()
          .single()

        if (dbError) throw dbError

        // 4. Update UI local state immediately
        setWorkSamples((prev) => [...prev, sampleRecord])
      } catch (err) {
        console.error('Client upload error:', err)
        failed.push(file.name)
      }
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (failed.length) {
      setUploadError(`${failed.length === 1 ? `"${failed[0]}"` : `${failed.length} files`} failed to upload.`)
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const files = Array.from(e.dataTransfer.files)
      if (files.length) uploadFiles(files)
    },
    [workSamples.length]
  )

  async function handleDeleteSample(sampleId: string) {
    // 1. Optimistically update local UI
    setWorkSamples((prev) => prev.filter((s) => s.id !== sampleId))

    // 2. Delete from database
    const { error } = await supabase.from('work_samples').delete().eq('id', sampleId)
    if (error) {
      console.error('Failed to delete sample:', error)
      // Rollback on failure if necessary
    }
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            form="profile-edit-form"
            disabled={isPending}
            className="bg-[#6b1d2b] text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-[#4e1520] transition-colors disabled:opacity-50"
          >
            {isPending ? 'Saving...' : state.success ? '✓ Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {state.error && <p className="text-xs text-red-500 mb-4">{state.error}</p>}

      <div className="mb-5">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Edit Mode</p>
        <p className="text-sm text-gray-500">This is what founders see when they find you. Make every word count.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-7 space-y-6 max-w-2xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#6b1d2b] flex items-center justify-center text-white text-2xl font-bold shrink-0 overflow-hidden">
            {initialProfile?.avatar_url ? (
              <img src={initialProfile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              initialProfile?.full_name?.[0]?.toUpperCase() || 'C'
            )}
          </div>
          <button type="button" className="text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors">
            Change Photo
          </button>
        </div>

        <form id="profile-edit-form" action={formAction} className="space-y-6">
          <input type="hidden" name="skills" value={JSON.stringify(skills)} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
              <input
                name="full_name"
                defaultValue={initialProfile?.full_name || ''}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6b1d2b]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
              <div className="relative">
                <select
                  name="discipline"
                  value={discipline}
                  onChange={(e) => setDiscipline(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6b1d2b] bg-white appearance-none pr-8"
                >
                  <option value="">Select role</option>
                  {DISCIPLINES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Rate</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">₦</span>
              <input
                name="hourly_rate"
                type="number"
                defaultValue={initialCreativeProfile?.hourly_rate || ''}
                placeholder="200,000"
                className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6b1d2b]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Professional Bio</label>
            <textarea
              name="bio"
              rows={5}
              defaultValue={initialProfile?.bio || ''}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6b1d2b] resize-none"
            />
          </div>
        </form>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Skill Tags</label>
          <div className="flex flex-wrap gap-2 border border-gray-200 rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-[#6b1d2b] min-h-[44px]">
            {skills.map((skill) => (
              <span
                key={skill}
                className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2.5 py-0.5"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => setSkills((prev) => prev.filter((s) => s !== skill))}
                  className="hover:text-blue-900 transition-colors"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleSkillKeyDown}
              onBlur={() => skillInput.trim() && addSkill(skillInput)}
              placeholder={skills.length === 0 ? 'Type to add tags...' : ''}
              className="flex-1 min-w-[120px] text-sm outline-none bg-transparent"
            />
          </div>
          <p className="text-[11px] text-gray-400 mt-1">E.g. TikTok, Branding, Outbound Sales — press Enter to add</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Portfolio</label>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,video/*"
            onChange={(e) => e.target.files && uploadFiles(Array.from(e.target.files))}
            className="hidden"
          />
          <div
            onClick={() => {
              setUploadError('')
              fileInputRef.current?.click()
            }}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl py-10 flex flex-col items-center gap-2 cursor-pointer transition-colors ${
              dragging
                ? 'border-[#6b1d2b] bg-[#fdf4f5]'
                : workSamples.length >= MAX_FILES
                ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <UploadCloud size={28} className="text-gray-400" />
            <p className="text-sm text-gray-600 font-medium">
              {uploading
                ? 'Uploading…'
                : workSamples.length >= MAX_FILES
                ? 'Maximum files reached'
                : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-gray-400">SVG, PNG, JPG or PDF (max. {MAX_MB}MB)</p>
          </div>
          {uploadError && <p className="text-xs text-red-500 mt-2">{uploadError}</p>}
        </div>

        {workSamples.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-700 mb-3">
              Uploaded files ({workSamples.length}/{MAX_FILES})
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {workSamples.map((sample) => (
                <div key={sample.id} className="relative group rounded-xl overflow-hidden border border-gray-100 aspect-video">
                  {sample.file_type === 'image' ? (
                    <img src={sample.url} alt={sample.title || ''} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                      <p className="text-[10px] text-gray-400 text-center px-2 truncate">{sample.title}</p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteSample(sample.id)}
                    className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
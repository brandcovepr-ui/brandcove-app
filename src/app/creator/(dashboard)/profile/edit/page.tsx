'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useUser } from '@/lib/hooks/useUser'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { UploadCloud, X, Eye } from 'lucide-react'
import type { CreativeProfile, WorkSample } from '@/lib/types'

const DISCIPLINES = [
  'Social Media Manager', 'Web Designer', 'Graphic Designer', 'Sales Rep',
  'Customer Service Rep', 'Creative Assistant', 'Copywriter', 'Video Editor',
  'Photographer', 'Brand Strategist', 'Content Creator', 'UI/UX Designer',
]

const profileSchema = z.object({
  full_name: z.string().min(1, 'Name is required'),
  bio: z.string().min(1, 'Bio is required'),
  hourly_rate: z.string().optional(),
  discipline: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

const MAX_FILES = 6
const MAX_MB = 50
const UPLOAD_TIMEOUT_MS = 30_000

export default function CreatorProfileEditPage() {
  const { profile } = useUser()
  const queryClient = useQueryClient()
  const [saved, setSaved] = useState(false)
  const [discipline, setDiscipline] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: creativeProfile } = useQuery({
    queryKey: ['creative-profile', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null
      const { data } = await createClient()
        .from('creative_profiles')
        .select('*')
        .eq('id', profile.id)
        .single()
      return data as CreativeProfile | null
    },
    enabled: !!profile?.id,
  })

  const { data: workSamples = [] } = useQuery({
    queryKey: ['work-samples', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []
      const { data } = await createClient()
        .from('work_samples')
        .select('*')
        .eq('creative_id', profile.id)
        .order('created_at', { ascending: false })
      return (data || []) as WorkSample[]
    },
    enabled: !!profile?.id,
  })

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: '', bio: '', hourly_rate: '', discipline: '' },
  })

  useEffect(() => {
    if (!profile && !creativeProfile) return
    form.reset({
      full_name: profile?.full_name || '',
      bio: profile?.bio || '',
      hourly_rate: creativeProfile?.hourly_rate?.toString() || '',
      discipline: creativeProfile?.discipline || '',
    })
    if (creativeProfile?.discipline) setDiscipline(creativeProfile.discipline)
    if (creativeProfile?.skills) setSkills(creativeProfile.skills)
  }, [profile, creativeProfile])

  // ── Skill tags ────────────────────────────────────────────
  function addSkill(raw: string) {
    const tag = raw.trim()
    if (tag && !skills.includes(tag)) setSkills(prev => [...prev, tag])
    setSkillInput('')
  }

  function handleSkillKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addSkill(skillInput)
    } else if (e.key === 'Backspace' && !skillInput && skills.length) {
      setSkills(prev => prev.slice(0, -1))
    }
  }

  // ── File upload ───────────────────────────────────────────
  async function uploadFiles(files: File[]) {
    if (!profile?.id) return
    setUploadError('')

    const remaining = MAX_FILES - workSamples.length
    if (remaining <= 0) { setUploadError(`Maximum of ${MAX_FILES} files reached.`); return }

    const batch = files.slice(0, remaining)
    const oversized = batch.find(f => f.size > MAX_MB * 1024 * 1024)
    if (oversized) { setUploadError(`"${oversized.name}" exceeds the ${MAX_MB} MB limit.`); return }

    setUploading(true)
    const supabase = createClient()
    const failed: string[] = []

    for (const file of batch) {
      const ext = file.name.split('.').pop()?.toLowerCase() || ''
      const fileType =
        ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext) ? 'image'
        : ext === 'pdf' ? 'pdf'
        : ['mp4', 'mov', 'avi', 'webm'].includes(ext) ? 'video'
        : 'other'

      const path = `${profile.id}/${Date.now()}-${file.name}`

      try {
        const uploadPromise = supabase.storage.from('work-samples').upload(path, file, { upsert: false })
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), UPLOAD_TIMEOUT_MS)
        )
        const { data, error } = await Promise.race([uploadPromise, timeout])
        if (error || !data) { failed.push(file.name); continue }

        const { data: { publicUrl } } = supabase.storage.from('work-samples').getPublicUrl(data.path)
        await supabase.from('work_samples').insert({
          creative_id: profile.id,
          url: publicUrl,
          title: file.name,
          file_type: fileType,
        })
      } catch {
        failed.push(file.name)
      }
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    queryClient.invalidateQueries({ queryKey: ['work-samples', profile.id] })
    if (failed.length) {
      setUploadError(`${failed.length === 1 ? `"${failed[0]}"` : `${failed.length} files`} failed — check your connection and try again.`)
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length) uploadFiles(files)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length) uploadFiles(files)
  }, [workSamples.length, profile?.id])

  async function deleteWorkSample(sampleId: string) {
    if (!profile?.id) return
    await createClient().from('work_samples').delete().eq('id', sampleId)
    queryClient.invalidateQueries({ queryKey: ['work-samples', profile.id] })
  }

  // ── Save ──────────────────────────────────────────────────
  async function onSave(data: ProfileFormData) {
    if (!profile?.id) return
    const supabase = createClient()

    await Promise.all([
      supabase.from('profiles').update({ full_name: data.full_name, bio: data.bio }).eq('id', profile.id),
      supabase.from('creative_profiles').update({
        discipline: discipline || null,
        skills,
        hourly_rate: data.hourly_rate ? parseFloat(data.hourly_rate) : null,
      }).eq('id', profile.id),
    ])

    queryClient.invalidateQueries({ queryKey: ['creative-profile', profile.id] })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/creator/profile"
            className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Eye size={14} />
            Preview
          </Link>
          <button
            onClick={form.handleSubmit(onSave)}
            className="bg-[#6b1d2b] text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-[#4e1520] transition-colors"
          >
            {saved ? '✓ Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Edit mode banner */}
      <div className="mb-5">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Edit Mode</p>
        <p className="text-sm text-gray-500">This is what founders see when they find you. Make every word count.</p>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-xl border border-gray-100 p-7 space-y-6 max-w-2xl">

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#6b1d2b] flex items-center justify-center text-white text-2xl font-bold shrink-0 overflow-hidden">
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              : profile?.full_name?.[0]?.toUpperCase() || 'C'}
          </div>
          <button type="button" className="text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors">
            Change Photo
          </button>
        </div>

        {/* Full Name + Role */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
            <input
              {...form.register('full_name')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6b1d2b]"
            />
            {form.formState.errors.full_name && (
              <p className="text-xs text-red-500 mt-1">{form.formState.errors.full_name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
            <div className="relative">
              <select
                value={discipline}
                onChange={e => setDiscipline(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6b1d2b] bg-white appearance-none pr-8"
              >
                <option value="">Select role</option>
                {DISCIPLINES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </div>
          </div>
        </div>

        {/* Rate */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Rate</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">₦</span>
            <input
              {...form.register('hourly_rate')}
              type="number"
              placeholder="200,000"
              className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6b1d2b]"
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Professional Bio</label>
          <textarea
            {...form.register('bio')}
            rows={5}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6b1d2b] resize-none"
          />
          {form.formState.errors.bio && (
            <p className="text-xs text-red-500 mt-1">{form.formState.errors.bio.message}</p>
          )}
        </div>

        {/* Skill tags */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Skill Tags</label>
          <div className="flex flex-wrap gap-2 border border-gray-200 rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-[#6b1d2b] min-h-[44px]">
            {skills.map(skill => (
              <span
                key={skill}
                className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2.5 py-0.5"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => setSkills(prev => prev.filter(s => s !== skill))}
                  className="hover:text-blue-900 transition-colors"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
            <input
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={handleSkillKeyDown}
              onBlur={() => skillInput.trim() && addSkill(skillInput)}
              placeholder={skills.length === 0 ? 'Type to add tags...' : ''}
              className="flex-1 min-w-[120px] text-sm outline-none bg-transparent"
            />
          </div>
          <p className="text-[11px] text-gray-400 mt-1">E.g. TikTok, Branding, Outbound Sales — press Enter to add</p>
        </div>

        {/* Portfolio upload */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Portfolio</label>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,video/*"
            onChange={handleFileInput}
            className="hidden"
          />
          <div
            onClick={() => { setUploadError(''); fileInputRef.current?.click() }}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
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
              {uploading ? 'Uploading…' : workSamples.length >= MAX_FILES ? 'Maximum files reached' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-gray-400">SVG, PNG, JPG or PDF (max. {MAX_MB}MB)</p>
          </div>
          {uploadError && <p className="text-xs text-red-500 mt-2">{uploadError}</p>}
        </div>

        {/* Uploaded files */}
        {workSamples.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-700 mb-3">
              Uploaded files ({workSamples.length}/{MAX_FILES})
            </p>
            <div className="grid grid-cols-3 gap-3">
              {workSamples.map(sample => (
                <div key={sample.id} className="relative group rounded-xl overflow-hidden border border-gray-100 aspect-video">
                  {sample.file_type === 'image' ? (
                    <img
                      src={sample.url}
                      alt={sample.title || ''}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                      <p className="text-[10px] text-gray-400 text-center px-2 truncate">{sample.title}</p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteWorkSample(sample.id)}
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

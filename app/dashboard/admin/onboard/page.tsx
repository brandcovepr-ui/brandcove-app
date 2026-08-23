'use client'

import { useState, useRef, useTransition } from 'react'
import Link from 'next/link'
import { Upload, X, CheckCircle, Copy, FileText, Film, ImageIcon, ArrowLeft, Loader2 } from 'lucide-react'

import { onboardUserAction, uploadWorkSamplesAction } from './actions'

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

const INDUSTRIES = [
  'Technology', 'Fashion', 'Food & Beverage', 'Health & Wellness', 'Finance',
  'Education', 'Entertainment', 'Real Estate', 'E-commerce', 'Consulting', 'Media', 'Other',
]

const COMPANY_STAGES = ['Pre-launch', 'Early stage', 'Growth', 'Established']
const CREATIVE_TYPES = [
  'Social Media Manager', 'Web Designer', 'Graphic Designer', 'Sales Rep',
  'Customer Service Rep', 'Creative Assistant', 'Copywriter', 'Video Editor',
]

interface WorkSampleFile {
  file: File
  title: string
  preview: string | null
  file_type: 'image' | 'pdf' | 'video' | 'other'
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6b1d2b]/30 focus:border-[#6b1d2b]'
const selectCls = inputCls + ' bg-white'

function fileTypeFromName(name: string): WorkSampleFile['file_type'] {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image'
  if (ext === 'pdf') return 'pdf'
  if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) return 'video'
  return 'other'
}

export default function AdminOnboardPage() {
  const [isPending, startTransition] = useTransition()

  // Account fields
  const [role, setRole] = useState<'creative' | 'founder'>('creative')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')

  // Creative fields
  const [discipline, setDiscipline] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [customSkillInput, setCustomSkillInput] = useState('')
  const [yearsExp, setYearsExp] = useState('')
  const [monthlyRate, setMonthlyRate] = useState('')
  const [location, setLocation] = useState('')
  const [availability, setAvailability] = useState('available')
  const [portfolioUrl, setPortfolioUrl] = useState('')

  // Founder fields
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState<string[]>([])
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [companyStage, setCompanyStage] = useState('')
  const [companyDescription, setCompanyDescription] = useState('')
  const [creativeTypesWanted, setCreativeTypesWanted] = useState<string[]>([])

  // Work Samples
  const [workSamples, setWorkSamples] = useState<WorkSampleFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Status
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<any | null>(null)
  const [copied, setCopied] = useState(false)

  const toggleSkill = (skill: string) => {
    setSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill])
  }

  const addCustomSkill = () => {
    const s = customSkillInput.trim()
    if (s && !skills.includes(s)) setSkills(prev => [...prev, s])
    setCustomSkillInput('')
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    const remaining = 6 - workSamples.length
    const toAdd = files.slice(0, remaining)
    const next = [...workSamples]

    for (const file of toAdd) {
      const ft = fileTypeFromName(file.name)
      const preview = ft === 'image' ? URL.createObjectURL(file) : null
      next.push({ file, title: file.name.replace(/\.[^.]+$/, ''), preview, file_type: ft })
    }

    setWorkSamples(next)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async () => {
    setError('')
    if (!fullName || !email) {
      setError('Please fill out all required basic info fields.')
      return
    }

    startTransition(async () => {
      try {
        const result = await onboardUserAction({
          role,
          email: email.trim(),
          fullName: fullName.trim(),
          bio: bio.trim() || undefined,
          ...(role === 'creative' ? {
            discipline,
            skills,
            yearsExp: yearsExp ? Number(yearsExp) : undefined,
            monthlyRate: monthlyRate ? Number(monthlyRate) : undefined,
            location: location.trim() || undefined,
            availability,
            portfolioUrl: portfolioUrl.trim() || undefined,
          } : {
            companyName: companyName.trim(),
            industry,
            websiteUrl: websiteUrl.trim() || undefined,
            companyStage: companyStage || undefined,
            companyDescription: companyDescription.trim() || undefined,
            creativeTypesWanted,
          }),
        })

        if (role === 'creative' && workSamples.length > 0) {
          const formData = new FormData()
          workSamples.forEach((ws) => {
            formData.append('files', ws.file)
            formData.append('titles', ws.title)
          })
          await uploadWorkSamplesAction(result.userId, formData)
        }

        setSuccess(result)
      } catch (err: any) {
        setError(err.message || 'Onboarding failed')
      }
    })
  }

  if (success) {
    return (
      <div className="p-8 max-w-lg mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-green-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Account Created!</h1>
          <p className="text-sm text-gray-500 mb-6">
            <span className="font-medium text-gray-700">{success.name}</span> onboarded as a {success.role}.
          </p>

          <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 text-left mb-6">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Credentials</p>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Email</p>
                <p className="text-sm font-medium text-gray-900">{success.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Password</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono bg-white border border-gray-200 rounded px-2 py-1 flex-1">
                    {success.password}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(success.password)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                    className="text-xs text-[#6b1d2b] font-medium flex items-center gap-1"
                  >
                    <Copy size={13} />
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <Link href="/dashboard/admin" className="block w-full bg-[#6b1d2b] text-white py-2.5 rounded-lg text-sm font-medium">
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/admin" className="text-gray-400 hover:text-gray-700">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Onboard User</h1>
          <p className="text-xs text-gray-400">Server-action powered onboarding engine</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div className="flex gap-2">
          {(['creative', 'founder'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium capitalize border ${
                role === r ? 'bg-[#6b1d2b] text-white border-[#6b1d2b]' : 'border-gray-200 text-gray-600'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full Name *"
            className={inputCls}
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address *"
            className={inputCls}
          />
        </div>

        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="User Bio..."
          className={inputCls + ' resize-none'}
          rows={3}
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        {role === 'creative' ? (
          <>
            <select value={discipline} onChange={(e) => setDiscipline(e.target.value)} className={selectCls}>
              <option value="">Select Discipline</option>
              {DISCIPLINES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {discipline && (
              <div className="flex flex-wrap gap-1.5">
                {(SKILLS_BY_DISCIPLINE[discipline] || []).map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleSkill(s)}
                    className={`px-3 py-1 rounded-full text-xs border ${
                      skills.includes(s) ? 'bg-[#6b1d2b] text-white' : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                value={monthlyRate}
                onChange={(e) => setMonthlyRate(e.target.value)}
                placeholder="Monthly Rate (₦)"
                className={inputCls}
              />
              <input
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="Portfolio Link (https://...)"
                className={inputCls}
              />
            </div>
          </>
        ) : (
          <>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company Name *"
              className={inputCls}
            />
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="Website URL"
              className={inputCls}
            />
          </>
        )}
      </div>

      {role === 'creative' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <p className="text-xs font-semibold text-gray-700 mb-2">Work Samples</p>
          <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,video/*" onChange={handleFileSelect} className="hidden" />

          {workSamples.length < 6 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 py-6 rounded-xl flex flex-col items-center text-gray-400 hover:bg-gray-50"
            >
              <Upload size={20} />
              <span className="text-xs mt-1">Upload files</span>
            </button>
          )}

          <div className="space-y-2 mt-3">
            {workSamples.map((ws, i) => (
              <div key={i} className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-lg text-xs">
                {ws.file_type === 'image' ? <ImageIcon size={14} /> : ws.file_type === 'pdf' ? <FileText size={14} /> : <Film size={14} />}
                <span className="flex-1 truncate">{ws.title}</span>
                <button onClick={() => setWorkSamples(prev => prev.filter((_, idx) => idx !== i))}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full bg-[#6b1d2b] text-white py-3 rounded-xl font-semibold hover:bg-[#4e1520] disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isPending ? <Loader2 size={16} className="animate-spin" /> : 'Create User & Generate Passcode'}
      </button>
    </div>
  )
}
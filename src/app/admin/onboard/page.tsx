'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Upload, X, Plus, CheckCircle, Copy, FileText, Film, ImageIcon, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

// ─── constants ───────────────────────────────────────────────────────────────

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

const AVAILABILITY_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'open_to_offers', label: 'Open to offers' },
  { value: 'busy', label: 'Busy' },
]

// ─── types ───────────────────────────────────────────────────────────────────

interface WorkSample {
  file: File
  title: string
  preview: string | null
  file_type: 'image' | 'pdf' | 'video' | 'other'
}

interface PortfolioLink { label: string; url: string }

interface SuccessData {
  userId: string
  email: string
  password: string
  name: string
  role: 'creative' | 'founder'
  emailSent: boolean
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function fileTypeFromName(name: string): WorkSample['file_type'] {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image'
  if (ext === 'pdf') return 'pdf'
  if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) return 'video'
  return 'other'
}

function isValidUrl(v: string) {
  try { new URL(v); return true } catch { return false }
}

// ─── sub-components ──────────────────────────────────────────────────────────

function SectionHeading({ number, title, subtitle }: { number: number; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="w-8 h-8 rounded-full bg-[#6b1d2b] text-white flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
        {number}
      </div>
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  )
}

function Field({ label, required, children, error }: {
  label: string; required?: boolean; children: React.ReactNode; error?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6b1d2b]/30 focus:border-[#6b1d2b]'
const selectCls = inputCls + ' bg-white'

// ─── main component ──────────────────────────────────────────────────────────

export default function AdminOnboardPage() {
  // ── account fields ──
  const [role, setRole] = useState<'creative' | 'founder'>('creative')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')

  // ── creative profile fields ──
  const [discipline, setDiscipline] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [customSkillInput, setCustomSkillInput] = useState('')
  const [yearsExp, setYearsExp] = useState('')
  const [monthlyRate, setMonthlyRate] = useState('')
  const [location, setLocation] = useState('')
  const [availability, setAvailability] = useState('available')

  // ── founder profile fields ──
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState<string[]>([])
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [companyStage, setCompanyStage] = useState('')
  const [companyDescription, setCompanyDescription] = useState('')
  const [creativeTypesWanted, setCreativeTypesWanted] = useState<string[]>([])

  // ── portfolio (creative) ──
  const [workSamples, setWorkSamples] = useState<WorkSample[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadFailures, setUploadFailures] = useState<string[]>([])
  const [portfolioLinks, setPortfolioLinks] = useState<PortfolioLink[]>([{ label: '', url: '' }])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── form state ──
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [success, setSuccess] = useState<SuccessData | null>(null)
  const [copied, setCopied] = useState(false)

  // ── skill helpers ──
  function toggleSkill(skill: string) {
    setSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill])
  }
  function addCustomSkill() {
    const s = customSkillInput.trim()
    if (s && !skills.includes(s)) setSkills(prev => [...prev, s])
    setCustomSkillInput('')
  }

  // ── file upload ──
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploadError('')

    const remaining = 6 - workSamples.length
    const toAdd = files.slice(0, remaining)
    const oversized = toAdd.find(f => f.size > 50 * 1024 * 1024)
    if (oversized) { setUploadError(`"${oversized.name}" exceeds the 50 MB limit.`); return }

    setUploading(true)
    const next = [...workSamples]
    for (const file of toAdd) {
      const ft = fileTypeFromName(file.name)
      const preview = ft === 'image' ? URL.createObjectURL(file) : null
      next.push({ file, title: file.name.replace(/\.[^.]+$/, ''), preview, file_type: ft })
    }
    setWorkSamples(next)
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── portfolio link helpers ──
  function updateLink(i: number, field: 'label' | 'url', val: string) {
    setPortfolioLinks(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l))
  }

  // ── validation ──
  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!fullName.trim()) e.full_name = 'Required'
    if (!email.trim()) e.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email'

    if (role === 'creative') {
      if (!discipline) e.discipline = 'Required'
      portfolioLinks.forEach((l, i) => {
        if (l.url.trim() && !isValidUrl(l.url.trim())) e[`link_url_${i}`] = 'Enter a valid URL'
      })
    } else {
      if (!companyName.trim()) e.company_name = 'Required'
      if (websiteUrl.trim() && !isValidUrl(websiteUrl.trim())) e.website_url = 'Enter a valid URL'
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── submit ──
  async function handleSubmit() {
    setSubmitError('')
    setUploadFailures([])
    if (!validate()) {
      setSubmitError('Please fix the validation errors below.')
      return
    }
    setSubmitting(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token ?? ''

      const cleanLinks = portfolioLinks.filter(l => l.label.trim() && l.url.trim())

      const res = await fetch('/api/admin/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          role, email: email.trim(), full_name: fullName.trim(), bio: bio.trim() || undefined,
          ...(role === 'creative' ? {
            discipline,
            skills,
            years_experience: yearsExp ? Number(yearsExp) : undefined,
            hourly_rate: monthlyRate ? Number(monthlyRate) : undefined,
            location: location.trim() || undefined,
            availability,
            portfolio_links: cleanLinks,
          } : {
            company_name: companyName.trim(),
            industry,
            website_url: websiteUrl.trim() || undefined,
            company_stage: companyStage || undefined,
            company_description: companyDescription.trim() || undefined,
            creative_types_wanted: creativeTypesWanted,
          }),
        }),
      })

      const json = await res.json()
      if (!res.ok) { setSubmitError(json.error ?? 'Something went wrong'); return }

      const { userId, password, emailSent } = json

      // Upload work samples via signed URLs (service-role signed — not blocked by storage RLS)
      if (role === 'creative' && workSamples.length > 0) {
        const uploaded: Array<{ url: string; title: string; file_type: string }> = []
        const failed: string[] = []

        for (const ws of workSamples) {
          try {
            const path = `${userId}/${Date.now()}-${ws.file.name}`

            const urlRes = await fetch('/api/admin/onboard/upload-url', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ path }),
            })
            if (!urlRes.ok) { failed.push(ws.title); continue }
            const { token: uploadToken, path: signedPath } = await urlRes.json()

            const { data, error } = await supabase.storage
              .from('work-samples')
              .uploadToSignedUrl(signedPath, uploadToken, ws.file, { upsert: false })

            if (error || !data) { failed.push(ws.title); continue }

            const { data: { publicUrl } } = supabase.storage.from('work-samples').getPublicUrl(data.path)
            uploaded.push({ url: publicUrl, title: ws.title, file_type: ws.file_type })
          } catch {
            failed.push(ws.title)
          }
        }

        if (failed.length > 0) setUploadFailures(failed)

        if (uploaded.length > 0) {
          const samplesRes = await fetch('/api/admin/onboard/samples', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ creative_id: userId, samples: uploaded }),
          })
          if (!samplesRes.ok) {
            const samplesJson = await samplesRes.json().catch(() => ({}))
            setUploadFailures(prev => [...prev, `Portfolio save failed: ${samplesJson.error ?? 'unknown error'}`])
          }
        }
      }

      setSuccess({ userId, email: email.trim(), password, name: fullName.trim(), role, emailSent: emailSent ?? false })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    workSamples.forEach(ws => { if (ws.preview) URL.revokeObjectURL(ws.preview) })
    setRole('creative'); setFullName(''); setEmail(''); setBio('')
    setDiscipline(''); setSkills([]); setCustomSkillInput(''); setYearsExp('')
    setMonthlyRate(''); setLocation(''); setAvailability('available')
    setCompanyName(''); setIndustry([]); setWebsiteUrl(''); setCompanyStage('')
    setCompanyDescription(''); setCreativeTypesWanted([])
    setWorkSamples([]); setPortfolioLinks([{ label: '', url: '' }])
    setErrors({}); setSubmitError(''); setUploadFailures([]); setSuccess(null); setCopied(false)
  }

  async function copyPassword() {
    if (!success) return
    await navigator.clipboard.writeText(success.password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SUCCESS SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="p-4 md:p-8 max-w-lg">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-green-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Account created!</h1>
          <p className="text-sm text-gray-500 mb-6">
            <span className="font-medium text-gray-700">{success.name}</span> has been onboarded as a {success.role}.
            {success.emailSent
              ? ' A welcome email with these credentials was sent to their inbox.'
              : ' Save the credentials below — the welcome email could not be delivered.'}
          </p>

          <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 text-left mb-6">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Login credentials</p>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Email</p>
                <p className="text-sm font-medium text-gray-900">{success.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Temporary password</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono bg-white border border-gray-200 rounded px-2 py-1 flex-1">
                    {success.password}
                  </code>
                  <button
                    onClick={copyPassword}
                    className="flex items-center gap-1 text-xs text-[#6b1d2b] font-medium hover:text-[#4e1520] transition-colors shrink-0"
                  >
                    <Copy size={13} />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {!success.emailSent && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-left">
              <p className="text-xs font-semibold text-amber-700 mb-1">Welcome email failed to send</p>
              <p className="text-xs text-amber-600 leading-relaxed">
                The account was created successfully but the email could not be delivered. Share the credentials above with {success.name} directly.
              </p>
            </div>
          )}

          {uploadFailures.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-left">
              <p className="text-xs font-semibold text-amber-700 mb-1">Some work samples failed to upload</p>
              <ul className="text-xs text-amber-600 leading-relaxed list-disc list-inside">
                {uploadFailures.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
              <p className="text-xs text-amber-600 mt-1">You can re-upload these from the creative&apos;s profile page.</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={resetForm}
              className="flex-1 bg-[#6b1d2b] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#4e1520] transition-colors"
            >
              Onboard another
            </button>
            <Link
              href="/admin"
              className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-center"
            >
              Back to Applications
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN FORM
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin" className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Onboard New User</h1>
          <p className="text-sm text-gray-400 mt-0.5">Create an account, pre-fill their profile, and send login credentials.</p>
        </div>
      </div>

      <div className="space-y-8">

        {/* ── Section 1: Account ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <SectionHeading number={1} title="Account" subtitle="Basic account details and role assignment" />

          <div className="space-y-5">
            {/* Role toggle */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Role<span className="text-red-400 ml-0.5">*</span></label>
              <div className="flex gap-2">
                {(['creative', 'founder'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => { setRole(r); setErrors({}); setSubmitError(''); }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors capitalize ${
                      role === r
                        ? 'bg-[#6b1d2b] text-white border-[#6b1d2b]'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name" required error={errors.full_name}>
                <input
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Amaka Osei"
                  className={inputCls}
                />
              </Field>
              <Field label="Email Address" required error={errors.email}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="amaka@example.com"
                  className={inputCls}
                />
              </Field>
            </div>

            <Field label="Bio">
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={3}
                placeholder="Brief description shown on their profile…"
                className={inputCls + ' resize-none'}
              />
            </Field>
          </div>
        </div>

        {/* ── Section 2: Profile details ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <SectionHeading
            number={2}
            title={role === 'creative' ? 'Creative Profile' : 'Founder Profile'}
            subtitle={role === 'creative' ? 'Discipline, skills, rate, and availability' : 'Company details and hiring intent'}
          />

          {role === 'creative' ? (
            <div className="space-y-5">
              <Field label="Discipline" required error={errors.discipline}>
                <select
                  value={discipline}
                  onChange={e => { setDiscipline(e.target.value); setSkills([]) }}
                  className={selectCls}
                >
                  <option value="">Select discipline</option>
                  {DISCIPLINES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>

              {discipline && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Skills</label>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {(SKILLS_BY_DISCIPLINE[discipline] ?? []).map(s => (
                      <button
                        key={s}
                        onClick={() => toggleSkill(s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          skills.includes(s)
                            ? 'bg-[#6b1d2b] text-white border-[#6b1d2b]'
                            : 'border-gray-200 text-gray-600 hover:border-gray-400'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={customSkillInput}
                      onChange={e => setCustomSkillInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomSkill())}
                      placeholder="Add custom skill…"
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={addCustomSkill}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
                    >
                      Add
                    </button>
                  </div>
                  {skills.filter(s => !(SKILLS_BY_DISCIPLINE[discipline] ?? []).includes(s)).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {skills.filter(s => !(SKILLS_BY_DISCIPLINE[discipline] ?? []).includes(s)).map(s => (
                        <span key={s} className="flex items-center gap-1 px-2.5 py-1 bg-[#6b1d2b] text-white rounded-full text-xs">
                          {s}
                          <button onClick={() => setSkills(prev => prev.filter(x => x !== s))} className="hover:text-[#d4a0a8]"><X size={11} /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Years of Experience">
                  <select value={yearsExp} onChange={e => setYearsExp(e.target.value)} className={selectCls}>
                    <option value="">Select</option>
                    {['1','2','3','4','5','6','7','8','9'].map(y => (
                      <option key={y} value={y}>{y} {y === '1' ? 'year' : 'years'}</option>
                    ))}
                    <option value="10">10+ years</option>
                  </select>
                </Field>
                <Field label="Monthly Rate (₦)">
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#6b1d2b]/30 focus-within:border-[#6b1d2b]">
                    <span className="flex items-center px-2.5 bg-gray-50 text-gray-500 text-sm border-r border-gray-200 shrink-0">₦</span>
                    <input
                      type="number"
                      value={monthlyRate}
                      onChange={e => setMonthlyRate(e.target.value)}
                      placeholder="150000"
                      className="flex-1 px-2.5 py-2.5 text-sm focus:outline-none"
                    />
                  </div>
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Location">
                  <input
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. Lagos, Nigeria"
                    className={inputCls}
                  />
                </Field>
                <Field label="Availability">
                  <select value={availability} onChange={e => setAvailability(e.target.value)} className={selectCls}>
                    {AVAILABILITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <Field label="Company Name" required error={errors.company_name}>
                <input
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="e.g. Zoomo Technologies"
                  className={inputCls}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Company Stage">
                  <select value={companyStage} onChange={e => setCompanyStage(e.target.value)} className={selectCls}>
                    <option value="">Select stage</option>
                    {COMPANY_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Website URL" error={errors.website_url}>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={e => setWebsiteUrl(e.target.value)}
                    placeholder="https://yourcompany.com"
                    className={`${inputCls} ${errors.website_url ? 'border-red-300' : ''}`}
                  />
                </Field>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Industry</label>
                <div className="flex flex-wrap gap-1.5">
                  {INDUSTRIES.map(ind => (
                    <button
                      key={ind}
                      onClick={() => setIndustry(prev => prev.includes(ind) ? prev.filter(x => x !== ind) : [...prev, ind])}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        industry.includes(ind)
                          ? 'bg-[#6b1d2b] text-white border-[#6b1d2b]'
                          : 'border-gray-200 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Company Description">
                <textarea
                  value={companyDescription}
                  onChange={e => setCompanyDescription(e.target.value)}
                  rows={3}
                  placeholder="What does the company do…"
                  className={inputCls + ' resize-none'}
                />
              </Field>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Types of Creatives Wanted</label>
                <div className="flex flex-wrap gap-1.5">
                  {CREATIVE_TYPES.map(ct => (
                    <button
                      key={ct}
                      onClick={() => setCreativeTypesWanted(prev => prev.includes(ct) ? prev.filter(x => x !== ct) : [...prev, ct])}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        creativeTypesWanted.includes(ct)
                          ? 'bg-[#6b1d2b] text-white border-[#6b1d2b]'
                          : 'border-gray-200 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {ct}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Section 3: Portfolio (creative only) ───────────────────────── */}
        {role === 'creative' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <SectionHeading number={3} title="Portfolio" subtitle="Work samples and portfolio links — shown to founders on their profile" />

            {/* Work samples */}
            <div className="mb-7">
              <p className="text-xs font-medium text-gray-700 mb-2">Work Samples <span className="text-gray-400 font-normal">(up to 6 files · images, PDFs, videos · max 50 MB each)</span></p>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {workSamples.length < 6 && (
                <button
                  type="button"
                  onClick={() => { setUploadError(''); fileInputRef.current?.click() }}
                  disabled={uploading}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl py-7 flex flex-col items-center gap-2 hover:border-[#6b1d2b]/40 hover:bg-gray-50 transition-colors disabled:opacity-50 mb-3"
                >
                  <Upload size={20} className="text-gray-400" />
                  <p className="text-sm text-gray-500">{uploading ? 'Processing…' : 'Click to select files'}</p>
                </button>
              )}

              {uploadError && <p className="text-xs text-red-500 mb-3">{uploadError}</p>}

              {workSamples.length > 0 && (
                <div className="space-y-2">
                  {workSamples.map((ws, i) => (
                    <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5">
                      {ws.preview ? (
                        <img src={ws.preview} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center shrink-0">
                          {ws.file_type === 'pdf' ? <FileText size={16} className="text-gray-500" /> :
                           ws.file_type === 'video' ? <Film size={16} className="text-gray-500" /> :
                           <ImageIcon size={16} className="text-gray-500" />}
                        </div>
                      )}
                      <input
                        value={ws.title}
                        onChange={e => setWorkSamples(prev => prev.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x))}
                        className="flex-1 text-xs text-gray-700 bg-transparent border-b border-gray-200 focus:outline-none focus:border-[#6b1d2b] py-0.5"
                        placeholder="Title"
                      />
                      <span className="text-[10px] text-gray-400 shrink-0 uppercase">{ws.file_type}</span>
                      <button
                        onClick={() => {
                          const ws = workSamples[i]
                          if (ws.preview) URL.revokeObjectURL(ws.preview)
                          setWorkSamples(prev => prev.filter((_, idx) => idx !== i))
                        }}
                        className="text-gray-400 hover:text-gray-700 shrink-0"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Portfolio links */}
            <div>
              <p className="text-xs font-medium text-gray-700 mb-3">Portfolio Links <span className="text-gray-400 font-normal">(optional — Behance, Dribbble, Instagram, etc.)</span></p>
              <div className="space-y-3">
                {portfolioLinks.map((link, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div>
                        <input
                          value={link.label}
                          onChange={e => updateLink(i, 'label', e.target.value)}
                          placeholder="Label (e.g. Behance)"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <input
                          type="url"
                          value={link.url}
                          onChange={e => updateLink(i, 'url', e.target.value)}
                          placeholder="https://"
                          className={`${inputCls} ${errors[`link_url_${i}`] ? 'border-red-300' : ''}`}
                        />
                        {errors[`link_url_${i}`] && (
                          <p className="text-xs text-red-500 mt-1">{errors[`link_url_${i}`]}</p>
                        )}
                      </div>
                    </div>
                    {portfolioLinks.length > 1 && (
                      <button
                        onClick={() => setPortfolioLinks(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-gray-400 hover:text-gray-700 mt-2.5 shrink-0"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {portfolioLinks.length < 5 && (
                <button
                  type="button"
                  onClick={() => setPortfolioLinks(prev => [...prev, { label: '', url: '' }])}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#6b1d2b] transition-colors mt-3"
                >
                  <Plus size={13} />
                  Add another link
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Submit ─────────────────────────────────────────────────────── */}
        {submitError && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <p className="text-sm text-red-700">{submitError}</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-[#6b1d2b] text-white rounded-xl py-3.5 text-sm font-semibold hover:bg-[#4e1520] transition-colors disabled:opacity-60"
        >
          {submitting ? 'Creating account…' : 'Create Account & Send Credentials'}
        </button>

        <p className="text-xs text-gray-400 text-center -mt-4 pb-4">
          A temporary password will be generated and emailed to the user. They will only need to subscribe when they log in.
        </p>
      </div>
    </div>
  )
}

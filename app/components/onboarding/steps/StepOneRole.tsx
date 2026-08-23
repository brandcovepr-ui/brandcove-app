'use client'

export const DISCIPLINES = [
  'Social Media Manager', 'Graphic Designer', 'Sales Representative',
  'Customer Service Specialist', 'Operations Manager', 'Marketing Associate',
] as const

export const SKILLS_BY_DISCIPLINE: Record<string, string[]> = {
  'Social Media Manager': ['Instagram', 'TikTok', 'Twitter/X', 'LinkedIn', 'Content Calendar', 'Analytics', 'Community Management'],
  'Graphic Designer': ['Adobe Illustrator', 'Photoshop', 'InDesign', 'Brand Identity', 'Typography', 'Print Design'],
  'Sales Representative': ['Lead Generation', 'Cold Outreach', 'CRM Tools', 'Negotiation', 'B2B Sales', 'Presentation'],
  'Customer Service Specialist': ['Support Ticketing', 'Live Chat', 'Email Support', 'Conflict Resolution', 'CRM', 'Empathy'],
  'Operations Manager': ['Project Management', 'Research', 'Scheduling', 'Content Editing', 'Communication'],
  'Marketing Associate': ['SEO Writing', 'Ad Copy', 'Email Marketing', 'Brand Voice', 'Long-form Content', 'Storytelling'],
}

interface StepOneProps {
  discipline: string
  setDiscipline: (d: string) => void
  selectedSkills: string[]
  toggleSkill: (s: string) => void
  onNext: () => void
}

export function StepOneRole({ discipline, setDiscipline, selectedSkills, toggleSkill, onNext }: StepOneProps) {
  return (
    <>
      <h1 className="mb-1 font-editorial text-2xl text-gray-900 sm:text-3xl">What is your primary role?</h1>
      <p className="mb-6 text-sm text-gray-500">Choose the core competency you want to be hired for.</p>
      
      <div className="mb-5 space-y-2">
        {DISCIPLINES.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDiscipline(d)}
            className={`flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
              discipline === d ? 'border-gray-900 bg-pink-50 font-medium' : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            {d}
            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
              discipline === d ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
            }`}>
              {discipline === d && <span className="h-2 w-2 rounded-full bg-white" />}
            </span>
          </button>
        ))}
      </div>

      {discipline && (
        <>
          <p className="mb-2 text-xs font-medium text-gray-700">Select your skills</p>
          <div className="mb-5 flex flex-wrap gap-2">
            {(SKILLS_BY_DISCIPLINE[discipline] || []).map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => toggleSkill(skill)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedSkills.includes(skill) ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </>
      )}

      <button
        type="button"
        onClick={onNext}
        disabled={!discipline || selectedSkills.length === 0}
        className="w-full rounded-full bg-gray-900 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-40"
      >
        Continue
      </button>
    </>
  )
}
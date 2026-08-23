'use client'

import { useState } from 'react'

export interface PortfolioLink {
  label: string
  url: string
}

interface StepFiveProps {
  portfolioLinks: PortfolioLink[]
  setPortfolioLinks: React.Dispatch<React.SetStateAction<PortfolioLink[]>>
  onNext: () => void
}

export function StepFivePortfolio({ portfolioLinks, setPortfolioLinks, onNext }: StepFiveProps) {
  const [errors, setErrors] = useState<Array<{ label?: string; url?: string }>>([])

  const validateAndAdvance = () => {
    const newErrors = portfolioLinks.map((link) => {
      const err: { label?: string; url?: string } = {}
      if (!link.label.trim() && link.url.trim()) err.label = 'Label required'
      if (link.label.trim() && !link.url.trim()) {
        err.url = 'URL required'
      } else if (link.url.trim()) {
        try {
          new URL(link.url.trim())
        } catch {
          err.url = 'Enter a valid URL (e.g. https://...)'
        }
      }
      return err
    })

    setErrors(newErrors)
    if (!newErrors.some((e) => e.label || e.url)) {
      onNext()
    }
  }

  return (
    <>
      <h1 className="mb-1 font-editorial text-2xl text-gray-900 sm:text-3xl">Your portfolio links</h1>
      <p className="mb-6 text-sm text-gray-500">Add links to your Behance, GitHub, LinkedIn, or personal site.</p>

      <div className="mb-5 space-y-4">
        {portfolioLinks.map((link, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-gray-200 p-4">
            <div>
              <input
                type="text"
                value={link.label}
                onChange={(e) => {
                  const val = e.target.value
                  setPortfolioLinks((prev) => prev.map((l, idx) => (idx === i ? { ...l, label: val } : l)))
                }}
                placeholder="Label (e.g. Portfolio Site)"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              {errors[i]?.label && <p className="mt-1 text-xs text-red-500">{errors[i].label}</p>}
            </div>

            <div>
              <input
                type="url"
                value={link.url}
                onChange={(e) => {
                  const val = e.target.value
                  setPortfolioLinks((prev) => prev.map((l, idx) => (idx === i ? { ...l, url: val } : l)))
                }}
                placeholder="https://"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              {errors[i]?.url && <p className="mt-1 text-xs text-red-500">{errors[i].url}</p>}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={validateAndAdvance}
        className="w-full rounded-full bg-gray-900 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
      >
        Continue
      </button>
    </>
  )
}
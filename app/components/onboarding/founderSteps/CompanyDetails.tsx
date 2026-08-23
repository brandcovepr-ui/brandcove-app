'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ProgressDots } from '../../ui/ProgressDots'

export const INDUSTRIES = [
  'E-commerce',
  'FinTech',
  'HealthTech',
  'EdTech',
  'Media',
  'Fashion',
  'Real Estate',
  'SaaS',
  'Other',
]

export const step1Schema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  industry: z.string().min(1, 'Select an industry'),
  website_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
})

export type Step1Data = z.infer<typeof step1Schema>

interface Props {
  defaultValues: Step1Data | null
  totalSteps: number
  onNext: (data: Step1Data) => void
  onDotClick: (step: number) => void
}

export function Step1CompanyDetails({ defaultValues, totalSteps, onNext, onDotClick }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      company_name: defaultValues?.company_name || '',
      industry: defaultValues?.industry || '',
      website_url: defaultValues?.website_url || '',
    },
  })

  return (
    <div>
      <h1 className="text-2xl sm:text-[28px] font-editorial font-thin text-gray-900 mb-1 leading-tight">
        Tell us about your company
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        This helps top creatives understand who they&apos;ll be working with.
      </p>

      <form onSubmit={handleSubmit(onNext)} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Company Name</label>
          <input
            {...register('company_name')}
            placeholder="e.g. Brand Cove"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          {errors.company_name && (
            <p className="text-xs text-red-500 mt-1">{errors.company_name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Industry</label>
          <select
            {...register('industry')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
          >
            <option value="">Select industry</option>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
          {errors.industry && (
            <p className="text-xs text-red-500 mt-1">{errors.industry.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Website URL <span className="text-gray-400">(optional)</span>
          </label>
          <input
            {...register('website_url')}
            placeholder="https://"
            className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          {errors.website_url && (
            <p className="text-xs text-red-500 mt-1">{errors.website_url.message}</p>
          )}
        </div>

        <ProgressDots current={1} total={totalSteps} onDotClick={onDotClick} />

        <button
          type="submit"
          className="w-full bg-gray-900 text-white rounded-full py-3 text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Continue
        </button>
      </form>
    </div>
  )
}
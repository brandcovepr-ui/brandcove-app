'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

export const bioSchema = z.object({
  bio: z.string().min(30, 'Tell us a bit more (min 30 characters)'),
  years_experience: z.string().min(1, 'Required'),
  location: z.string().optional(),
})

export type BioFormData = z.infer<typeof bioSchema>

interface StepThreeProps {
  initialValues: BioFormData
  onSubmitBio: (data: BioFormData) => void
}

export function StepThreeBio({ initialValues, onSubmitBio }: StepThreeProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<BioFormData>({
    resolver: zodResolver(bioSchema),
    defaultValues: initialValues,
  })

  return (
    <>
      <h1 className="mb-1 font-editorial text-2xl text-gray-900 sm:text-3xl">Your bio &amp; experience</h1>
      <p className="mb-6 text-sm text-gray-500">Tell founders what you specialize in and the value you bring.</p>

      <form onSubmit={handleSubmit(onSubmitBio)} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Bio</label>
          <textarea
            {...register('bio')}
            rows={4}
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          {errors.bio && <p className="mt-1 text-xs text-red-500">{errors.bio.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Years of Experience</label>
          <select
            {...register('years_experience')}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">Select</option>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'].map((y) => (
              <option key={y} value={y === '10+' ? '10' : y}>
                {y} {y === '1' ? 'year' : 'years'}
              </option>
            ))}
          </select>
          {errors.years_experience && (
            <p className="mt-1 text-xs text-red-500">{errors.years_experience.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Location <span className="text-gray-400">(optional)</span>
          </label>
          <input
            {...register('location')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-full bg-gray-900 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          Continue
        </button>
      </form>
    </>
  )
}
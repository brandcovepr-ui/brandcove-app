'use client'

import { useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { sendInquiryAction } from '@/app/actions/founder'

const schema = z.object({
  project_description: z
    .string()
    .min(20, 'Please describe your project in at least 20 characters'),
  timeline: z.string().optional(),
  budget: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  creativeId: string
  creativeName: string
  onClose: () => void
}

export function SendInquiryModal({ creativeId, creativeName, onClose }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  function onSubmit(data: FormData) {
    setServerError(null)

    startTransition(async () => {
      try {
        await sendInquiryAction({
          creativeId,
          projectDescription: data.project_description,
          timeline: data.timeline,
          budget: data.budget,
        })
        onClose()
        router.push('/dashboard/founder/messages?sent=1')
      } catch (err: any) {
        setServerError(err.message || 'Something went wrong. Please try again.')
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-start justify-between mb-6">
          <h2 className="font-editorial text-2xl text-gray-900 leading-tight">
            Inquire with
            <br />
            {creativeName}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors mt-1"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {serverError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Project Context
            </label>
            <textarea
              {...register('project_description')}
              rows={4}
              placeholder="Briefly describe your company and what you need help with..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
            />
            {errors.project_description && (
              <p className="text-xs text-red-500 mt-1">
                {errors.project_description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Timeline
              </label>
              <select
                {...register('timeline')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white text-gray-700"
              >
                <option value="">Select timeline</option>
                <option value="Start immediately">Start immediately</option>
                <option value="Within 2 weeks">Within 2 weeks</option>
                <option value="Within a month">Within a month</option>
                <option value="1–3 months">1–3 months</option>
                <option value="3–6 months">3–6 months</option>
                <option value="Flexible">Flexible</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Budget
              </label>
              <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-gray-900">
                <span className="flex items-center px-2.5 bg-gray-50 text-gray-500 text-sm border-r border-gray-200 shrink-0">
                  ₦
                </span>
                <input
                  {...register('budget')}
                  type="number"
                  placeholder="150,000"
                  className="flex-1 px-2.5 py-2.5 text-sm focus:outline-none min-w-0"
                />
                <span className="flex items-center px-2.5 bg-gray-50 text-gray-400 text-xs border-l border-gray-200 shrink-0 whitespace-nowrap">
                  /mo
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="border border-gray-200 rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="bg-[#6b1d2b] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#4e1520] transition-colors disabled:opacity-60"
            >
              {isPending ? 'Sending…' : 'Send Inquiry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
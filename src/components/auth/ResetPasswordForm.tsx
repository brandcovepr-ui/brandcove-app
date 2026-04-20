'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthCard } from './AuthCard'

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Passwords do not match yet.',
  path: ['confirm'],
})

type FormData = z.infer<typeof schema>

export function ResetPasswordForm() {
  const router = useRouter()
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.updateUser({ password: data.password })
    setLoading(false)
    setDone(true)
  }

  if (done) {
    return (
      <AuthCard mascotSrc="/SuccessMascott.png">
        <div className="w-full">
          <h1 className="text-[45px] font-regular font-sans text-black mb-1 tracking-tight">You&apos;re all set</h1>
          <p className="text-sm text-gray-500 mb-7 font-poppins">
            Your password has been reset. Sign back in to resume to enter your dashboard.
          </p>
          <Link
            href="/login"
            className="block w-full bg-gray-900 text-white rounded-full py-3 text-sm font-medium hover:bg-gray-800 transition-colors text-center font-poppins"
          >
            Go to log in
          </Link>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard mascotSrc="/SuccessMascott.png">
      <div className="w-full">
        <h1 className="text-[45px] font-regular font-sans text-black mb-1 tracking-tight">Reset Password</h1>
        <p className="text-sm text-gray-500 mb-7 font-poppins">
          Choose a new password for your account so you can return to hiring, shortlisting, and finishing setup.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-medium text-gray-700 font-poppins">New Password</label>
              <span className="text-xs text-gray-400 font-poppins">Minimum 8 characters</span>
            </div>
            <div className="relative">
              <input
                {...register('password')}
                type={showPw ? 'text' : 'password'}
                placeholder="Create a strong password"
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 pr-10 font-poppins ${
                  errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1 font-poppins">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 font-poppins">Re-enter Password</label>
            <div className="relative">
              <input
                {...register('confirm')}
                type={showConfirm ? 'text' : 'password'}
                placeholder="Re-enter your new password"
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 pr-10 font-poppins ${
                  errors.confirm ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirm && <p className="text-xs text-red-500 mt-1 font-poppins">{errors.confirm.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white rounded-full py-3 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-60 font-poppins"
          >
            {loading ? 'Saving…' : 'Save Password'}
          </button>
        </form>
      </div>
    </AuthCard>
  )
}

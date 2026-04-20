'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthCard } from './AuthCard'

const schema = z.object({
  email: z.string().email('Please enter a valid email address before we continue.'),
})

type FormData = z.infer<typeof schema>

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    setSent(true)
  }

  if (sent) {
    return (
      <AuthCard mascotSrc="/SubscribeMascot.png">
        <div className="w-full">
          <h1 className="text-[45px] font-regular font-sans text-black mb-1 tracking-tight">Check your inbox</h1>
          <p className="text-sm text-gray-500 mb-7 font-poppins">
            We sent a secure link to <strong>{getValues('email')}</strong>. Open it to reset your password and continue into your founder onboarding flow.
          </p>
          <div className="border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between mb-6">
            <span className="text-sm text-gray-700 font-poppins">{getValues('email')}</span>
            <span className="text-green-500">✓</span>
          </div>
          <button
            onClick={() => setSent(false)}
            className="w-full bg-gray-900 text-white rounded-full py-3 text-sm font-medium hover:bg-gray-800 transition-colors mb-3 font-poppins"
          >
            Didn&apos;t see it? Resend Email
          </button>
          <p className="text-xs text-gray-400 text-center mt-2 font-poppins">
            <Link href="/login" className="text-gray-900 font-semibold font-poppins">
              Back to Log In
            </Link>
          </p>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard mascotSrc="/SubscribeMascot.png">
      <div className="w-full">
        <h1 className="text-[45px] font-regular font-sans text-black mb-1 tracking-tight">Forgot password?</h1>
        <p className="text-sm text-gray-500 mb-7 font-poppins">
          Enter the email linked to your account and we&apos;ll send a reset link so you can continue your setup.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 font-poppins">Email Address</label>
            <div className="relative">
              <input
                {...register('email')}
                type="email"
                placeholder="e.g. founder@brandcove.com"
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 pr-10 font-poppins ${
                  errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500 mt-1 font-poppins">{errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white rounded-full py-3 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-60 font-poppins"
          >
            {loading ? 'Sending…' : 'Send Email'}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-5 font-poppins">
          <Link href="/login" className="text-gray-900 font-semibold font-poppins">
            Back to Log In
          </Link>
        </p>
      </div>
    </AuthCard>
  )
}

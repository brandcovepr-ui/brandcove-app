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
import { getAuthErrorMessage } from '@/lib/utils/authErrors'
import type { UserRole } from '@/lib/types'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  fullName: z.string().min(2, 'Enter your full name'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type FormData = z.infer<typeof schema>

export function SignupForm() {
  const router = useRouter()
  const [role, setRole] = useState<UserRole>('founder')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError('')
    const supabase = createClient()

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.fullName, role },
      },
    })

    if (signUpError) {
      setError(getAuthErrorMessage(signUpError))
      setLoading(false)
      return
    }

    const onboardingPath = role === 'creative' ? '/creative' : '/founder'

    if (signUpData.session) {
      router.push(onboardingPath)
    } else {
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}&role=${role}`)
    }
  }

  async function signUpWithGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <AuthCard mascotSrc="/SignUpMascot.jpg">
      <div className="w-full">
        <h1 className="text-[45px] font-editorial text-black mb-1 tracking-tight leading-tight">Let&apos;s set up your account</h1>
        <p className="text-sm text-gray-500 mb-5 font-poppins">Please confirm your basic details to get started.</p>

        {/* Role selector */}
        <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-full">
          {(['founder', 'creative'] as UserRole[]).map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex-1 py-2 text-sm font-medium rounded-full transition-all ${
                role === r
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {r === 'founder' ? 'Founder' : 'Creative'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-black mb-1 font-poppins">Email Address</label>
            <input
              {...register('email')}
              type="email"
              placeholder="chidera@brandcove.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 font-poppins"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1 font-poppins">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 font-poppins">Full Name</label>
            <input
              {...register('fullName')}
              type="text"
              placeholder="Paul Smith"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 font-poppins"
            />
            {errors.fullName && <p className="text-xs text-red-500 mt-1 font-poppins">{errors.fullName.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 font-poppins">Password</label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 pr-10 font-poppins"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1 font-poppins">{errors.password.message}</p>}
          </div>

          {error && <p className="text-xs text-red-500 font-poppins">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white rounded-full py-3 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-60 font-poppins"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-poppins">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <button
          onClick={signUpWithGoogle}
          className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-full py-3 text-sm font-medium hover:bg-gray-50 transition-colors font-poppins"
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign up with Google
        </button>

        <p className="text-xs text-gray-400 text-center mt-5 font-poppins">
          Already signed up?{' '}
          <Link href="/login" className="text-gray-900 font-semibold font-poppins">
            Log in
          </Link>
        </p>
      </div>
    </AuthCard>
  )
}

'use client'

import { useState, useActionState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { AuthCard } from './AuthCard'
import { signUpAction, type SignupFormState } from '@/app/actions/auth'
import type { UserRole } from '@/lib/types'

export function SignupForm() {
  const [role, setRole] = useState<UserRole>('founder')
  const [showPassword, setShowPassword] = useState(false)

  const [state, formAction, isPending] = useActionState<SignupFormState, FormData>(
    signUpAction,
    null
  )

  return (
    <AuthCard mascotSrc="/SignUpMascot.jpg">
      <div className="w-full">
        <h1 className="text-xl md:text-[28px] font-editorial text-black mb-1 tracking-tight leading-tight">
          Let&apos;s set up your account
        </h1>
        <p className="text-sm text-gray-500 mb-5 font-poppins">
          Please confirm your basic details to get started.
        </p>

        {/* Role selector */}
        <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-full">
          {(['founder', 'creative'] as UserRole[]).map((r) => (
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

        <form action={formAction} className="space-y-4">
          {/* Hidden input to pass selected role through FormData */}
          <input type="hidden" name="role" value={role} />

          <div>
            <label className="block text-xs font-semibold text-black mb-1 font-poppins">
              Email Address
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="chidera@brandcove.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 font-poppins"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 font-poppins">
              Full Name
            </label>
            <input
              name="fullName"
              type="text"
              required
              minLength={2}
              placeholder="Paul Smith"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 font-poppins"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 font-poppins">
              Password
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 pr-10 font-poppins"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {state?.error && (
            <p className="text-xs text-red-500 font-poppins">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-gray-900 text-white rounded-full py-3 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-60 font-poppins"
          >
            {isPending
              ? 'Creating account…'
              : role === 'founder'
              ? 'Sign up as a founder'
              : 'Sign up as a creative'}
          </button>
        </form>

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
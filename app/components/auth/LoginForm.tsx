'use client'

import { useState, useActionState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { AuthCard } from './AuthCard'
import { loginAction, type FormState } from '@/app/actions/auth'

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)

  // React 19 / Next.js hook for handling Server Action states natively
  const [state, formAction, isPending] = useActionState<FormState, FormData>(loginAction, null)

  return (
    <AuthCard mascotSrc="/LoginMascot.jpg">
      <div className="w-full">
        <h1 className="text-2xl md:text-[45px] font-editorial text-black mb-1 tracking-tight leading-tight">
          Welcome back
        </h1>
        <p className="text-sm text-gray-500 mb-7 font-poppins">
          Log in to your account to continue.
        </p>

        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 font-poppins">
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
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-700 font-poppins">
                Password
              </label>
              <Link href="/forgot-password" className="text-xs text-gray-500 hover:text-gray-700 font-poppins">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                name="password"
                required
                type={showPassword ? 'text' : 'password'}
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
            {isPending ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-5 font-poppins">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-gray-900 font-semibold font-poppins">
            Sign up
          </Link>
        </p>
      </div>
    </AuthCard>
  )
}
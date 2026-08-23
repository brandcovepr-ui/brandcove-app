'use client'

import { useState, useActionState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { resetPasswordAction, type ResetPasswordFormState } from '@/app/actions/auth'
import { AuthCard } from './AuthCard'

export function ResetPasswordForm() {
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [state, formAction, isPending] = useActionState<ResetPasswordFormState, FormData>(
    resetPasswordAction,
    null
  )

  if (state?.success) {
    return (
      <AuthCard mascotSrc="/SuccessMascott.png">
        <div className="w-full">
          <h1 className="text-2xl md:text-[45px] font-regular font-sans text-black mb-1 tracking-tight">
            You&apos;re all set
          </h1>
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
        <h1 className="text-2xl md:text-[45px] font-regular font-sans text-black mb-1 tracking-tight">
          Reset Password
        </h1>
        <p className="text-sm text-gray-500 mb-7 font-poppins">
          Choose a new password for your account so you can return to hiring, shortlisting, and finishing setup.
        </p>

        <form action={formAction} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-medium text-gray-700 font-poppins">
                New Password
              </label>
              <span className="text-xs text-gray-400 font-poppins">Minimum 8 characters</span>
            </div>
            <div className="relative">
              <input
                name="password"
                type={showPw ? 'text' : 'password'}
                placeholder="Create a strong password"
                className={`w-full border rounded-lg px-3 py-2.5 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 pr-10 font-poppins ${
                  state?.fieldErrors?.password ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {state?.fieldErrors?.password && (
              <p className="text-xs text-red-500 mt-1 font-poppins">
                {state.fieldErrors.password}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 font-poppins">
              Re-enter Password
            </label>
            <div className="relative">
              <input
                name="confirm"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Re-enter your new password"
                className={`w-full border rounded-lg px-3 py-2.5 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 pr-10 font-poppins ${
                  state?.fieldErrors?.confirm ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {state?.fieldErrors?.confirm && (
              <p className="text-xs text-red-500 mt-1 font-poppins">
                {state.fieldErrors.confirm}
              </p>
            )}
          </div>

          {state?.error && (
            <p className="text-xs text-red-500 font-poppins">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-gray-900 text-white rounded-full py-3 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-60 font-poppins"
          >
            {isPending ? 'Saving…' : 'Save Password'}
          </button>
        </form>
      </div>
    </AuthCard>
  )
}
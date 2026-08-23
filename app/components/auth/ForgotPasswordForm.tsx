'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { Mail, AlertCircle, CheckCircle2 } from 'lucide-react'
import { requestPasswordReset, FormState } from '@/app/actions/auth'
import { AuthCard } from './AuthCard'

const initialState: FormState = {
  success: false,
  error: undefined,
  email: '',
  resentCount: 0,
}

export function ForgotPasswordForm() {
  const [resetKey, setResetKey] = useState(0)

  return (
    <ForgotPasswordFormInternal
      key={resetKey}
      onReset={() => setResetKey((k) => k + 1)}
    />
  )
}

function ForgotPasswordFormInternal({ onReset }: { onReset: () => void }) {
  const [state, formAction, isPending] = useActionState(requestPasswordReset, initialState)
  const [email, setEmail] = useState(state.email || '')

  if (state.success) {
    return (
      <AuthCard mascotSrc="/SubscribeMascot.png">
        <div className="w-full">
          <h1 className="text-xl md:text-[28px] font-editorial text-black mb-1 tracking-tight">
            Check your inbox
          </h1>
          <p className="text-sm text-gray-500 mb-7 font-poppins">
            We sent a secure link to <strong>{state.email}</strong>. Open it to reset your password and continue into your founder onboarding flow.
          </p>

          <div className="border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between mb-4">
            <span className="text-sm text-gray-700 font-poppins truncate max-w-[200px]">
              {state.email}
            </span>
            <span className="text-green-500 flex items-center gap-1 text-xs font-poppins">
              <CheckCircle2 size={16} /> Sent
            </span>
          </div>

          {state.resentCount && state.resentCount > 1 ? (
            <div className="mb-4 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg p-2.5 text-center font-poppins">
              Reset link resent successfully!
            </div>
          ) : null}

          <form action={formAction}>
            <input type="hidden" name="email" value={state.email} />
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-gray-900 text-white rounded-full py-3 text-sm font-medium hover:bg-gray-800 transition-colors mb-3 font-poppins disabled:opacity-60"
            >
              {isPending ? 'Sending…' : "Didn't see it? Resend Email"}
            </button>
          </form>

          <button
            type="button"
            onClick={onReset}
            className="w-full text-xs text-gray-500 hover:text-gray-800 font-poppins text-center py-1 underline"
          >
            Entered the wrong email? Re-enter email
          </button>

          <p className="text-xs text-gray-400 text-center mt-4 font-poppins">
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
        <h1 className="text-xl md:text-[28px] font-editorial text-black mb-1 tracking-tight">
          Forgot password?
        </h1>
        <p className="text-sm text-gray-500 mb-7 font-poppins">
          Enter the email linked to your account and we&apos;ll send a reset link so you can continue your setup.
        </p>

        {state.error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-600 font-poppins">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <p>{state.error}</p>
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 font-poppins">
              Email Address
            </label>
            <div className="relative">
              <input
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. founder@brandcove.com"
                className={`w-full border rounded-lg px-3 py-2.5 text-base md:text-sm focus:outline-none focus:ring-2 pr-10 font-poppins ${
                  state.error
                    ? 'border-red-400 bg-red-50 focus:ring-red-400'
                    : 'border-gray-300 focus:ring-gray-900'
                }`}
              />
              <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-gray-900 text-white rounded-full py-3 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-60 font-poppins"
          >
            {isPending ? 'Sending…' : 'Send Email'}
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
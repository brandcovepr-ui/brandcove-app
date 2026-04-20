import { AuthCard } from '@/components/auth/AuthCard'
import Link from 'next/link'

export default function CheckEmailPage() {
  return (
    <AuthCard mascotSrc="/SignUpMascot.jpg">
      <div className="w-full text-center">
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>

        <h1 className="text-[32px] font-semibold text-gray-900 mb-2 tracking-tight font-sans">Check your email</h1>
        <p className="text-sm text-gray-500 mb-6 font-poppins leading-relaxed">
          We sent a confirmation link to your inbox.<br />
          Click it to activate your account and get started.
        </p>

        <p className="text-xs text-gray-400 font-poppins">
          Wrong email?{' '}
          <Link href="/signup" className="text-gray-900 font-semibold hover:underline">
            Go back
          </Link>
        </p>
      </div>
    </AuthCard>
  )
}

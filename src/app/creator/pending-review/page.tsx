'use client'

import { useUser } from '@/lib/hooks/useUser'
import { Clock, CheckCircle, XCircle, Mail } from 'lucide-react'
import { useAppStore } from '@/lib/stores/useAppStore'
import { signOutUser } from '@/lib/utils/signout'
import Image from 'next/image'

export default function PendingReviewPage() {
  const { profile } = useUser()
  const setProfile = useAppStore(s => s.setProfile)

  const reviewStatus = profile?.review_status

  function handleSignOut() {
    signOutUser(() => setProfile(null))
  }

  return (
    <div className="auth-bg h-screen font-poppins">
      <div className="w-full max-w-4xl h-full max-h-[92vh] bg-white rounded-2xl border-2 border-white overflow-hidden shadow-xl flex flex-col">

        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-50 shrink-0">
          <span className="text-xl font-bold text-gray-900  font-regular font-sans tracking-tight">BrandCove</span>
          <button
            onClick={handleSignOut}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest"
          >
            Sign out
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-10 py-8 flex flex-col justify-center max-w-md">

            {(!reviewStatus || reviewStatus === 'pending') && (
              <>
                <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center mb-5">
                  <Clock size={22} className="text-yellow-500" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Application under review</h1>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  Your profile is being reviewed by the BrandCove team. This usually takes 1–3 business days.
                  We&apos;ll email you once a decision has been made.
                </p>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-6">
                  <p className="text-xs font-semibold text-gray-700">What happens next?</p>
                  {[
                    'Our team reviews your profile and work samples',
                    'You receive an approval or feedback email',
                    'On approval, you subscribe and get full access',
                  ].map((s, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-xs text-gray-600">{s}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Mail size={13} />
                  <span>Check your inbox for updates</span>
                </div>
              </>
            )}

            {reviewStatus === 'approved' && (
              <>
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-5">
                  <CheckCircle size={22} className="text-green-500" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re approved!</h1>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  Congratulations! Your profile has been approved. Subscribe to unlock full access to the platform.
                </p>
                <a
                  href="/subscribe"
                  className="inline-block w-full text-center bg-gray-900 text-white rounded-full py-3 text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Subscribe &amp; Get Access
                </a>
              </>
            )}

            {reviewStatus === 'rejected' && (
              <>
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-5">
                  <XCircle size={22} className="text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Application not approved</h1>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  Your application wasn&apos;t approved at this time. This may be due to profile completeness or work
                  sample quality. You&apos;re welcome to strengthen your profile and reapply.
                </p>
                <a
                  href="/creator"
                  className="inline-block w-full text-center bg-gray-900 text-white rounded-full py-3 text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Update Profile &amp; Reapply
                </a>
              </>
            )}
          </div>

          <div className="hidden md:flex w-72 items-center justify-center p-8 border-l border-gray-50 shrink-0">
            <Image
              src="/OnboardingMascot.png"
              alt=""
              width={220}
              height={220}
              className="object-contain w-auto h-auto max-h-64"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

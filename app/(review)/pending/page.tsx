import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { Clock, CheckCircle2, XCircle, Mail, ArrowRight } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import { signOutAction } from '@/app/actions/auth'

export default async function PendingReviewPage() {
  const supabase = await createSupabaseServerClient()

  // 1. Authenticate user directly on the server
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Fetch profile review status
  const { data: profile } = await supabase
    .from('profiles')
    .select('review_status')
    .eq('id', user.id)
    .single()

  const reviewStatus = profile?.review_status ?? 'pending'

  return (
    <div className="auth-bg flex min-h-dvh w-full items-center justify-center p-4 font-poppins">
      <div className="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border-2 border-white bg-white shadow-xl">
        
        {/* Header Bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-[#F6F4F3] px-6 py-4 sm:px-8">
          <span className="font-editorial text-xl font-bold tracking-tight text-gray-900">
            BrandCove
          </span>
          <form action={signOutAction}>
            <button
              type="submit"
              className="text-xs font-medium uppercase tracking-widest text-gray-500 transition-colors hover:text-gray-900"
            >
              Sign out
            </button>
          </form>
        </div>

        {/* Content Body */}
        <div className="flex min-h-0 flex-1">
          <div className="flex flex-1 flex-col justify-center overflow-y-auto px-6 py-8 sm:px-10 lg:max-w-xl">
            
            {/* STATUS: PENDING */}
            {reviewStatus === 'pending' && (
              <div>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
                  <Clock size={22} className="text-amber-600" />
                </div>
                
                <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">
                  Application under review
                </h1>
                
                <p className="mb-6 text-sm leading-relaxed text-gray-500">
                  Your profile is currently being reviewed by the BrandCove curation team.
                  This process usually takes 1–3 business days. We will notify you by email as soon as a decision is made.
                </p>

                <div className="mb-6 space-y-3 rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-semibold text-gray-800">What happens next?</p>
                  {[
                    'Our team reviews your profile and uploaded work samples',
                    'You receive a status email in your registered inbox',
                    'Upon approval, you unlock subscription and platform access',
                  ].map((stepText, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[10px] font-bold text-white">
                        {idx + 1}
                      </span>
                      <p className="text-xs text-gray-600">{stepText}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Mail size={14} />
                  <span>Check your inbox for updates</span>
                </div>
              </div>
            )}

            {/* STATUS: APPROVED */}
            {reviewStatus === 'approved' && (
              <div>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                  <CheckCircle2 size={22} className="text-emerald-600" />
                </div>

                <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">
                  You&apos;re approved!
                </h1>

                <p className="mb-6 text-sm leading-relaxed text-gray-500">
                  Congratulations! Your application passed review. Subscribe now to activate your talent membership and start applying to client requests.
                </p>

                <Link
                  href="/subscribe"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                >
                  <span>Subscribe &amp; Get Access</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            )}

            {/* STATUS: REJECTED */}
            {reviewStatus === 'rejected' && (
              <div>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50">
                  <XCircle size={22} className="text-rose-600" />
                </div>

                <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">
                  Application not approved
                </h1>

                <p className="mb-6 text-sm leading-relaxed text-gray-500">
                  Your application was not approved at this time. This is typically due to incomplete information or portfolio sample quality. You can update your details and re-submit for evaluation.
                </p>

                <Link
                  href="/creator/onboarding"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                >
                  <span>Update Profile &amp; Reapply</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            )}

          </div>

          {/* Right Mascot Sidebar */}
          <div className="hidden border-l border-gray-100 p-8 md:flex md:w-80 md:items-center md:justify-center">
            <Image
              src="/OnboardingMascot.png"
              alt="BrandCove Onboarding"
              width={220}
              height={220}
              priority
              className="h-auto max-h-64 w-auto object-contain"
            />
          </div>
        </div>

      </div>
    </div>
  )
}
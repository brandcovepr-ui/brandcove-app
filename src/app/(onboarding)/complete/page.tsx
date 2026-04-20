import Link from 'next/link'

export default function OnboardingCompletePage() {
  return (
    <div className="min-h-screen bg-[#6b1d2b] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl px-16 py-16 max-w-sm w-full text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">You&apos;re all set!</h1>
        <p className="text-sm text-gray-500 mb-8">Your subscription is active. Welcome to BrandCove.</p>
        <div className="flex justify-center mb-8">
          {/* Celebration character placeholder */}
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-yellow-200 via-pink-200 to-purple-200 flex items-center justify-center text-5xl">
            🎉
          </div>
        </div>
        <Link
          href="/founder/dashboard"
          className="block w-full bg-gray-900 text-white rounded-full py-3 text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}

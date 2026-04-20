import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#6b1d2b] flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5">
        <span className="text-white text-2xl font-bold tracking-tight">BrandCove</span>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="px-5 py-2 text-white border border-white/40 rounded-full text-sm font-medium hover:bg-white/10 transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2 bg-white text-[#6b1d2b] rounded-full text-sm font-bold hover:bg-gray-100 transition-colors"
          >
            Sign up
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <h1 className="text-5xl md:text-6xl font-bold text-white max-w-3xl leading-tight mb-6">
          Connect with the <span className="text-pink-200">best creative talent</span> for your brand
        </h1>
        <p className="text-white/70 text-lg max-w-xl mb-10">
          BrandCove is the marketplace where founders discover, shortlist, and hire vetted creatives — designers, social media managers, copywriters, and more.
        </p>
        <div className="flex gap-4">
          <Link
            href="/signup"
            className="px-8 py-3 bg-white text-[#6b1d2b] rounded-full font-bold text-base hover:bg-gray-100 transition-colors"
          >
            Get started — it&apos;s free
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 border border-white/40 text-white rounded-full font-medium text-base hover:bg-white/10 transition-colors"
          >
            Log in
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-white/40 text-sm">
        © {new Date().getFullYear()} BrandCove. All rights reserved.
      </footer>
    </div>
  )
}

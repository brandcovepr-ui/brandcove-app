import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/check-email',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/subscribe',
  '/creator/pending-review',
  '/paystack/callback',
]

// Creator routes that require auth + approval + subscription
const CREATOR_PROTECTED_PREFIXES = [
  '/creator/dashboard',
  '/creator/messages',
  '/creator/profile',
  '/creator/settings',
]

// Admin routes
const ADMIN_PREFIXES = ['/admin']

/** Copy any refreshed session cookies from supabaseResponse onto a redirect. */
function redirectWithCookies(to: URL, supabaseResponse: NextResponse): NextResponse {
  const res = NextResponse.redirect(to)
  supabaseResponse.cookies.getAll().forEach(cookie => res.cookies.set(cookie))
  return res
}

export async function proxy(request: NextRequest) {
  try {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // getSession() reads the session from cookies locally — no GoTrue network call
    // for valid tokens. If the access token is expired it calls the refresh
    // endpoint once to obtain a new one and writes the updated cookies onto
    // supabaseResponse via the setAll hook. This is the "optimistic check"
    // pattern recommended by Next.js 16 for Proxy: trust the cookie for routing
    // decisions; actual data-layer security is enforced by RLS and route-handler
    // auth checks. getUser() (which always hits GoTrue even for valid tokens) was
    // causing visible latency and, under prefetch load, the appearance of infinite
    // loading on every dashboard page.
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null
    const pathname = request.nextUrl.pathname
    const isPublic = PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith('/auth/'))

    // Unauthenticated user hitting a protected route → send to login
    if (!user && !isPublic) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Authenticated user hitting login/signup → redirect based on role
    if (user && (pathname === '/login' || pathname === '/signup')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, onboarding_complete, review_status, subscription_status')
        .eq('id', user.id)
        .single()

      // If profile couldn't be fetched, pass through — the page will handle it
      if (!profile) return supabaseResponse

      if (profile.role === 'admin') {
        return redirectWithCookies(new URL('/admin', request.url), supabaseResponse)
      }

      if (profile.role === 'creative') {
        if (!profile.onboarding_complete) {
          return redirectWithCookies(new URL('/creator', request.url), supabaseResponse)
        }
        if (profile.review_status !== 'approved') {
          return redirectWithCookies(new URL('/creator/pending-review', request.url), supabaseResponse)
        }
        if (profile.subscription_status !== 'active') {
          return redirectWithCookies(new URL('/subscribe', request.url), supabaseResponse)
        }
        return redirectWithCookies(new URL('/creator/dashboard', request.url), supabaseResponse)
      }

      if (profile.role === 'founder') {
        if (!profile.onboarding_complete) {
          return redirectWithCookies(new URL('/founder', request.url), supabaseResponse)
        }
        if (profile.subscription_status !== 'active') {
          return redirectWithCookies(new URL('/subscribe', request.url), supabaseResponse)
        }
        return redirectWithCookies(new URL('/founder/dashboard', request.url), supabaseResponse)
      }
    }

    // Unauthenticated user on creator/admin protected routes → login
    const isCreatorProtected = CREATOR_PROTECTED_PREFIXES.some(p => pathname.startsWith(p))
    const isAdminProtected = ADMIN_PREFIXES.some(p => pathname.startsWith(p))
    if (!user && (isCreatorProtected || isAdminProtected)) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    return supabaseResponse
  } catch {
    // If Supabase is unreachable or env vars are missing, fail open
    // so the app doesn't return 500 on every request.
    return NextResponse.next({ request })
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}

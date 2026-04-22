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

    const { data: { user } } = await supabase.auth.getUser()
    const pathname = request.nextUrl.pathname
    const isPublic = PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith('/auth/'))

    // If no user but stale sb-* cookies exist, expire them so the browser
    // doesn't keep sending them on subsequent requests.
    if (!user) {
      const hasSbCookies = request.cookies.getAll().some(({ name }) => name.startsWith('sb-'))
      if (hasSbCookies) {
        const cleanupResponse = isPublic
          ? NextResponse.next({ request })
          : NextResponse.redirect(new URL('/login', request.url))
        request.cookies.getAll().forEach(({ name }) => {
          if (name.startsWith('sb-')) {
            cleanupResponse.cookies.set(name, '', {
              maxAge: 0,
              path: '/',
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              httpOnly: false,
            })
          }
        })
        return cleanupResponse
      }
    }

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

      // If profile couldn't be fetched, send to login to re-authenticate
      if (!profile) {
        return NextResponse.redirect(new URL('/login', request.url))
      }

      if (profile.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }

      if (profile.role === 'creative') {
        if (!profile.onboarding_complete) {
          return NextResponse.redirect(new URL('/creator', request.url))
        }
        if (profile.review_status !== 'approved') {
          return NextResponse.redirect(new URL('/creator/pending-review', request.url))
        }
        if (profile.subscription_status !== 'active') {
          return NextResponse.redirect(new URL('/subscribe', request.url))
        }
        return NextResponse.redirect(new URL('/creator/dashboard', request.url))
      }

      if (profile.role === 'founder') {
        if (!profile.onboarding_complete) {
          return NextResponse.redirect(new URL('/founder', request.url))
        }
        if (profile.subscription_status !== 'active') {
          return NextResponse.redirect(new URL('/subscribe', request.url))
        }
        return NextResponse.redirect(new URL('/founder/dashboard', request.url))
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
